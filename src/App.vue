<template>
  <div @click="deselectActiveInstrument">
    <div class="app-grid">
      <Instrument :channel="0" />
      <Grid />
      <Instrument :channel="3" scene-selector-position="right" />

      <Instrument :channel="1" />
      <Middle id="middle" />
      <Instrument :channel="4" scene-selector-position="right" />

      <Instrument :channel="2" />
      <Instrument :channel="5" scene-selector-position="right" />
    </div>

    <div class="footer">
      <div class="help">{{ $t(`${$store.state.help}`) }}</div>
      <div class="lang-chooser">
        <div
          v-for="l in langs"
          :key="l.code"
          class="lang"
          :class="{ active: lang === l.code }"
          @click.stop="$store.commit('setLanguage', l.code)"
        >
          {{ l.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { WebMidi } from 'webmidi'
import * as Tone from 'tone'
import Instrument from '@/components/Instrument.vue'
import Grid from '@/components/Grid.vue'
import Middle from '@/components/Middle.vue'
import { mapState } from 'vuex'

export default {
  name: 'App',

  components: {
    Instrument,
    Grid,
    Middle,
  },

  data() {
    return {
      langs: [
        { code: 'pt', name: 'Portugês' },
        { code: 'en', name: 'English' },
      ],
    }
  },

  computed: {
    ...mapState(['lang']),
  },

  watch: {
    lang() {
      this.$i18n.locale = this.lang
    },

    '$store.getters.anyInstrumentPlaying'(val) {
      console.log('anyInstrumentPlaying is now', val)
    },
  },

  created() {
    Tone.Transport.bpm.value = this.$store.state.bpm

    this.initMidi()
    this.initKeyboardShortcuts()
  },

  methods: {
    initMidi() {
      WebMidi.enable()
        .then(() => {
          console.log('WebMidi enabled!')
        })
        .catch((err) => alert(err))
    },

    initKeyboardShortcuts() {
      window.onkeydown = (key) => {
        switch (key.key) {
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
          case '7':
          case '8':
          case '9':
            this.emitter.emit('changeScene', parseInt(key.key) - 1)
            break

          case ' ':
            this.emitter.emit('togglePlay')
            break

          case 's':
            this.emitter.emit('toggleSettings')
            break

          case 'Tab':
            this.$store.commit('forwardCycleSelectedInstrument')
            break
        }
      }
    },

    deselectActiveInstrument() {
      this.$store.commit('setSelectedInstrument', null)
    },

    clicked() {
      // console.log('clicked app')
    },
  },
}
</script>

<style lang="scss">
@import 'styles/globals';

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  // margin-top: 60px;
  // border: 1px solid black;
  padding: 20px 20px 0;
  max-width: 1200px;
  // max-height: 695px;
  margin: 0 auto;
}

.app-grid {
  display: grid;
  grid-template-columns: 4fr 5fr 4fr;
  grid-gap: 20px;
}

#middle {
  grid-row: span 2;
}

.footer {
  display: grid;
  grid-template-columns: 10fr 2fr;
  text-align: left;
  margin: 10px 0;
  font-size: 13px;
  color: var(--white);
  .lang-chooser {
    display: inline;
    text-align: right;
    .lang {
      color: var(--fg);
      display: inline;
      &.active {
        color: var(--white);
        font-weight: bold;
      }
      &:first-child {
        margin-right: 5px;
      }
    }
  }
}
</style>
