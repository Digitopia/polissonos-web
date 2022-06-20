<template>
  <div
    class="instrument"
    :class="{ right: sceneSelectorPosition === 'right' }"
    @click.stop="setSelectedInstrument"
  >
    <!-- scene selector -->
    <div class="scenes" :class="{ active: isInstrumentSelected }">
      <div
        v-for="(_, sceneIdx) in instrument.scenes"
        :key="sceneIdx"
        class="scene"
        :class="{
          active: selectedSceneIdx === sceneIdx,
          pending: nextSceneIdx === sceneIdx,
        }"
        @click="selectScene(sceneIdx)"
        @touchstart="selectScene(sceneIdx)"
      >
        <!-- scene label -->
        <span
          :class="{
            colored: sceneHasNotes(sceneIdx) && sceneIdx !== selectedSceneIdx,
          }"
          >{{ sceneIdx + 1 }}
        </span>
      </div>
    </div>

    <div class="sequence">
      <svg class="svg" :class="{ active: isInstrumentSelected }">
        <!-- transform into center (so that DOM has time to render) -->
        <g :transform="`translate(${cx} ${cy})`">
          <circle class="points-circle" cx="0" cy="0" :r="rInner"></circle>

          <!-- beat points -->
          <g class="beat-points">
            <circle
              v-for="(beatPoint, beatPointIdx) in beatPoints"
              :key="beatPointIdx"
              :cx="beatPoint.x"
              :cy="beatPoint.y"
              :r="beatPointIdx === selectedBeatIdx ? rPointSelected : rPoint"
              class="point"
              :class="{ playing: playingNoteIdx === beatPointIdx }"
              @click.exact="addNote(beatPointIdx)"
              @click.middle="removeNote(beatPointIdx)"
            ></circle>
          </g>

          <!-- shape -->
          <polygon :points="polygon"></polygon>

          <!-- instrument label -->
          <text class="label" style="fill: rgba(48, 48, 48, 0.5)">
            {{ name }}
          </text>

          <!-- volume -->
          <g class="volume-circle">
            <!-- volume arc -->
            <path class="arc" :d="volumeArc"></path>

            <!-- volume point -->
            <circle
              v-if="selectedNoteVolumeX && selectedNoteVolumeY"
              :cx="selectedNoteVolumeX"
              :cy="selectedNoteVolumeY"
              :r="rPoint"
            ></circle>
          </g>

          <!-- notes -->
          <g class="scale-circle">
            <!-- note arc -->
            <path class="arc" :d="noteArc"></path>

            <!-- note points -->
            <g class="note-points">
              <circle
                v-for="(notePoint, notePointIdx) in notePoints"
                :key="notePointIdx"
                :r="notePointIdx === selectedNoteIdx ? rPointSelected : rPoint"
                :cx="notePoint.x"
                :cy="notePoint.y"
                class="point"
                @click.exact="selectNote(notePointIdx)"
              ></circle>
            </g>
          </g>
        </g>
      </svg>

      <!-- buttons -->
      <div class="buttons">
        <!-- play/pause -->
        <FontAwesomeIcon
          :icon="['fas', playing ? 'pause' : 'play']"
          class="play"
          :class="{ active: playing }"
          @click="playing = !playing"
        />

        <!-- settings -->
        <FontAwesomeIcon
          icon="cog"
          class="settings"
          :class="{ active: isInstrumentSelected && showSettings }"
          @click="toggleSettings"
          @touchstart="toggleSettings"
        />

        <!-- send midi -->
        <FontAwesomeIcon
          icon="paper-plane"
          class="send-midi"
          :class="{ active: sendMidi }"
          @click="toggleSendMidi"
          @touchstart="toggleSendMidi"
          @mouseover="$store.commit('setHelp', 'title')"
          @mouseout="$store.commit('clearHelp')"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { WebMidi } from 'webmidi'
import { mapState } from 'vuex'
import { Scale, Note } from '@tonaljs/tonal'
import * as Tone from 'tone'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faPlay,
  faPause,
  faCog,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons'
import { map } from '@/utils.js'
import { defaults } from '@/store'

library.add(faPlay, faPause, faCog, faPaperPlane)

export default {
  props: {
    channel: {
      type: Number,
      required: true,
    },

    sceneSelectorPosition: {
      type: String,
      default: 'left',
      validator: (val) => {
        return ['left', 'right'].includes(val)
      },
    },
  },

  data() {
    const angMargin = Math.PI / 8
    return {
      playing: false,
      cx: 0, // center of inner (beats) and outer (volume at left and notes at right) circles
      cy: 0, // center of inner (beats) and outer (volume at left and notes at right) circles
      w: 0, // width of "sequence", full svg element
      h: 0, // height of "sequence", full svg element
      beatPoints: [],
      notePoints: [],
      rPoint: 3 * 2,
      rPointSelected: 6 * 2,
      rInner: 67,
      rOuter: 93,
      selectedBeatIdx: null,
      selectedNoteIdx: null,
      selectedSceneIdx: 0,
      nextSceneIdx: null,
      playingNoteIdx: null,
      volumeArcAng1: Math.PI + angMargin,
      volumeArcAng2: -angMargin,
      noteArcAng1: angMargin,
      noteArcAng2: Math.PI - angMargin,
      loop: null, // instance of Tone.Loop
    }
  },

  computed: {
    ...mapState(['showSettings']),

    instrument() {
      return this.$store.getters.getInstrumentByChannel(this.channel)
    },

    color() {
      return this.instrument.color
    },

    name() {
      return this.instrument.name
    },

    root() {
      return this.instrument.root
    },

    scale() {
      return this.instrument.scale
    },

    beats() {
      return this.instrument.beats
    },

    subdivisions() {
      return this.instrument.subdivisions
    },

    sendMidi() {
      return this.instrument.sendMidi
    },

    isInstrumentSelected() {
      return this.$store.state.selectedInstrument === this.channel
    },

    data() {
      return this.instrument.scenes[this.selectedSceneIdx]
    },

    nPoints() {
      return this.beats * this.subdivisions
    },

    nScaleNotes() {
      return Scale.get(`${this.root} ${this.scale}`).notes.length * 2 + 1
    },

    polygon() {
      let ret = ''
      if (!this.data) return ''
      this.data.forEach((noteData, idx) => {
        if (noteData[0] === null) return
        let { x, y } = this.getPolygonPointInArc(
          idx,
          this.nPoints,
          this.rInner,
          0,
          Math.PI * 2,
          this.cx,
          this.cy
        )
        x *= 0.92 // spacing between beat point and polygon point
        y *= 0.92
        ret += `${x},${y} `
      })
      return ret
    },

    volumeArc() {
      return this.getArcPath(
        this.rOuter,
        this.volumeArcAng1,
        this.volumeArcAng2
      )
    },

    noteArc() {
      return this.getArcPath(this.rOuter, this.noteArcAng1, this.noteArcAng2)
    },

    selectedNoteVolumeX() {
      // TODO:
      return null
      // const ang1 = Math.PI + this.angMargin + Math.PI / 8
      // return this.cx + Math.sin(ang1) * this.rOuter
    },

    selectedNoteVolumeY() {
      // TODO:
      return null
      // const ang1 = Math.PI + this.angMargin + Math.PI / 8
      // return this.cx + Math.cos(ang1) * this.rOuter
    },

    scaleNotes() {
      const range = Scale.rangeOf(`${this.root} ${this.scale}`)
      const notes = range(`${this.root}3`, `${this.root}5`)
      return notes
    },

    loopInterval() {
      return `${this.beats * this.subdivisions}n`
    },

    defaultSelectedNoteIdx() {
      return Math.floor(this.scaleNotes.length / 2)
    },
  },

  watch: {
    playing() {
      console.log('playing changed', this.playing)
      this.$store.state.instruments[this.channel].playing = this.playing
      if (this.playing) this.play()
      else this.stop()
    },

    selectedBeatIdx() {
      const noteData = this.data[this.selectedBeatIdx]
      console.log('noteData', noteData[0])
      this.selectedNoteIdx =
        noteData[0] !== null ? noteData[0] : this.defaultSelectedNoteIdx
      console.log('selectedNoteIdx is now', this.selectedNoteIdx)
    },

    loopInterval() {
      console.log('loopInterval is now', this.loopInterval)
      if (this.loop) this.loop.interval = this.loopInterval
    },

    nPoints: {
      handler() {
        this.beatPoints = []
        for (let i = 0; i < this.nPoints; i++) {
          const { x, y } = this.getPolygonPointInArc(
            i,
            this.nPoints,
            this.rInner,
            0,
            Math.PI * 2
          )
          this.beatPoints.push({ x, y })
        }
      },
      immediate: true, // run on first time, before even detecting a change
    },

    scale: {
      handler() {
        this.notePoints = []
        for (let i = 0; i < this.nScaleNotes; i++) {
          // notes
          const angMargin = Math.PI / 20
          const { x, y } = this.getNotePointInArc(
            i,
            this.nScaleNotes - 1,
            this.rOuter,
            this.noteArcAng1 + angMargin,
            this.noteArcAng2 - angMargin
          )
          // // volume
          // const { x, y } = this.getPointInArc(
          //   i,
          //   this.nScaleNotes,
          //   this.volumeArcAng1,
          //   this.volumeArcAng2,
          //   this.rOuter
          // )
          this.notePoints.push({ x, y })
        }
      },
      immediate: true, // run on first time, before even detecting a change
    },
  },

  created() {
    window.Scale = Scale
    window.Note = Note
    window.Tone = Tone

    this.player = new Tone.Synth().toDestination() // cannot be created in `data` after upgrading to vue3
  },

  mounted() {
    this.$el.style.setProperty('--color', this.color)

    const svg = this.$el.querySelector('svg')
    this.w = svg.clientWidth || svg.parentNode.clientWidth
    this.h = svg.clientHeight || svg.parentNode.clientHeight
    this.cx = this.w / 2
    this.cy = this.h / 2

    this.emitter.on('changeScene', (sceneIdx) => {
      if (this.isInstrumentSelected) this.setSelectedScene(sceneIdx)
    })

    this.emitter.on('togglePlay', () => {
      if (this.isInstrumentSelected) this.playing = !this.playing
    })

    this.emitter.on('toggleSettings', () => {
      if (this.isInstrumentSelected) this.toggleSettings()
    })
  },

  methods: {
    sceneHasNotes(sceneIdx) {
      for (let i = 0; i < this.nPoints; i++) {
        const data = this.instrument.scenes[sceneIdx]
        if (data[i][0] !== null) {
          return true
        }
      }
      return false
    },

    getArcPath(r, ang1, ang2) {
      const x1 = Math.sin(ang1) * r
      const y1 = Math.cos(ang1) * r
      const x2 = Math.sin(ang2) * r
      const y2 = Math.cos(ang2) * r
      return `M ${x1} ${y1} A ${r} ${r} 0 0 0 ${x2} ${y2}`
    },

    getPolygonPointInArc(idx, steps, r, ang1, ang2) {
      // changing cos and sin and subtracting Math.PI / 2 because need idx as 0 on top and increasing clockwise
      const step = (ang2 - ang1) / steps
      const angle = idx * step + ang1 - Math.PI / 2
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r
      return { x, y }
    },

    getNotePointInArc(idx, steps, r, ang1, ang2) {
      const step = (ang2 - ang1) / steps
      const angle = idx * step + ang1
      const x = Math.sin(angle) * r
      const y = Math.cos(angle) * r
      return { x, y }
    },

    addNote(idx) {
      console.log('adding note', idx)

      // update current beat
      this.selectedBeatIdx = idx

      // skip, if there is already an added note
      if (this.data[idx][0] !== null) return

      // add beat
      this.$nextTick(() => {
        this.data[idx][0] = this.selectedNoteIdx
        console.log('added note', idx, this.selectedNoteIdx)
      })
    },

    selectNote(idx) {
      // skip, if there is no note yet
      if (this.selectedNoteIdx === null) return

      // update current beat to note
      this.selectedNoteIdx = idx
      this.data[this.selectedBeatIdx][0] = idx

      // playback
      const note = this.scaleNotes[idx]
      this.playNoteWrap(note)

      console.log('selectNote', idx, note)
    },

    removeNote(idx) {
      console.log('removing note', idx)
      this.data[idx] = [null, defaults.noteVolume]
    },

    setSelectedInstrument() {
      if (!this.isInstrumentSelected) {
        this.$store.commit('setSelectedInstrument', this.channel)
      }
    },

    toggleSettings() {
      this.setSelectedInstrument()
      this.$store.commit('toggleSettings')
    },

    toggleSendMidi() {
      this.$store.commit('toggleSendMidi', this.channel)
    },

    selectScene(idx) {
      if (!this.$store.getters.anyInstrumentPlaying) {
        this.selectedSceneIdx = idx
      } else {
        this.nextSceneIdx = idx
      }
    },

    play() {
      console.log('play')

      let counter = 0

      // if there is another instrument playing, then wait for next measure to start...
      const start = this.$store.getters.instrumentsPlayingCount <= 1 ? 0 : '@1m'
      console.log('start', start)

      this.loop = new Tone.Loop(() => {
        let idx = counter++ % this.nPoints

        // if starting from beginning and there is a next scene
        if (idx === 0 && this.nextSceneIdx !== null) {
          this.selectedSceneIdx = this.nextSceneIdx
          this.nextSceneIdx = null
        }

        this.playNote(idx)
        console.log(Tone.Transport.position)
      }, this.loopInterval).start(start)

      // this.$emitter.$emit('play', this.channel)

      Tone.Transport.start()
      Tone.start() // force the audio context to start (was not automatically being started on Chrome)
    },

    playNote(idx) {
      this.playingNoteIdx = idx
      console.log('playing inst:', this.channel, idx)

      const noteData = this.data[idx]
      if (noteData[0] === null) return

      const vol = map(noteData[1], 0, 127, -60, -6)
      const note = this.scaleNotes[noteData[0]]
      console.log(note, vol)
      this.player.volume.value = vol
      console.log('vol', this.player.volume.value)

      this.playNoteWrap(note)
    },

    playNoteWrap(note) {
      if (!this.sendMidi) {
        // play synth
        this.player.triggerAttackRelease(note, this.loopInterval)
      } else {
        // send MIDI
        let output = WebMidi.outputs[0]
        let channel = output.channels[1]
        channel.playNote(note)
      }
    },

    stop() {
      console.log('stop')
      this.playingNoteIdx = null
      this.loop.stop()
    },
  },
}
</script>

<style lang="scss">
.instrument {
  display: grid;
  grid-template-columns: 1fr 11fr;
  grid-gap: 10px;
  .label {
    text-anchor: middle;
  }
  &.right {
    grid-template-columns: 11fr 1fr;
    .scenes {
      order: 2;
    }
    .buttons {
      svg {
        left: 0;
      }
      .send-midi {
        left: 20px;
      }
    }
  }
}

.scenes {
  display: grid;
  background-color: var(--fg);
  padding: 10px;
  grid-gap: 2px;
  border: 2px solid var(--fg);
  &.active {
    border: 2px solid var(--white);
    border-radius: 2px;
  }
  .scene {
    font-size: 12px;
    font-weight: bold;
    display: flex;
    color: var(--fg);
    width: 20px;
    height: 20px;
    align-items: center;
    justify-content: center;
    background-color: var(--bg);
    &.active {
      background: var(--color);
      color: black;
    }
    &.pending {
      background: blue;
      color: red;
    }
  }
}

.points-circle {
  fill: none;
  stroke: whitesmoke;
  stroke-width: 3px;
}

.sequence {
  position: relative;
  .svg {
    width: 100%;
    background-color: var(--fg);
    position: relative;
    height: 100%;
    fill: var(--color);
    stroke: var(--color);
    border: 2px solid var(--fg);
    .point {
      stroke: var(--fg);
      &.playing {
        fill: red !important;
        stroke: red;
      }
    }
    circle,
    polygon {
      stroke-width: 2px;
    }
    text {
      text-align: center;
      z-index: 1000;
      stroke-width: 0.5;
      // stroke: var(--color);
      font-size: 13px;
    }
    &.active {
      border: 2px solid var(--white);
      border-radius: 2px;
    }
  }
}

.arc {
  fill: none;
  stroke: var(--white);
  stroke-width: 3px;
}

.buttons {
  svg {
    color: var(--bg);
    position: absolute;
    right: 0;
    margin: 10px;
    &.active {
      color: var(--color);
    }
    transform: scale(0.8);
  }
  .play {
    top: 0;
  }

  .settings {
    bottom: 0;
  }

  .send-midi {
    bottom: 0;
    right: 20px;
  }
}

.colored {
  color: var(--color);
}
</style>
