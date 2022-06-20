import { createStore } from 'vuex'

export const defaults = {
  nScenes: 9,
  root: 'C',
  scale: 'pentatonic',
  beats: 4,
  subdivisions: 2,
  noteVolume: 127,
  instruments: [
    {
      name: 'piano',
      color: 'rgb(255, 127, 0)',
    },
    {
      name: 'vibraphone',
      color: 'rgb(0, 160, 198)',
    },
    {
      name: 'bass',
      color: 'rgb(125, 255, 0)',
    },
    {
      name: 'e. piano',
      color: 'rgb(255, 255, 0)',
    },
    {
      name: 'harp',
      color: 'rgb(255, 88, 144)',
    },
    {
      name: 'drums',
      color: 'rgb(255, 0, 0)',
    },
  ],
}

const instruments = defaults.instruments.map((instrument) => {
  return {
    name: instrument.name,
    color: instrument.color,
    root: defaults.root,
    scale: defaults.scale,
    beats: defaults.beats,
    subdivisions: defaults.subdivisions,
    playing: false,
    loop: null, // will need to sync between
    sendMidi: false,
    // scenes: Array(9).fill([]), // this doesn't work for whatever reason
  }
})

// init scenes
instruments.forEach((instrument) => {
  instrument.scenes = []
  for (let i = 0; i < defaults.nScenes; i++) {
    instrument.scenes[i] = []
    for (let j = 0; j < 5 * 5; j++) {
      instrument.scenes[i][j] = [null, defaults.noteVolume]
    }
  }
})

export default createStore({
  state: {
    bpm: 80,
    lang: 'pt',
    instruments: instruments,
    selectedInstrument: null,
    showSettings: false,
    playing: false,
    currentTick: null,
    help: 'scene', // which keyword to show from the help messages
  },

  getters: {
    anyInstrumentPlaying: (state, getters) =>
      getters.instrumentsPlayingCount >= 1,

    instrumentsPlayingCount: (state) =>
      state.instruments.filter((instrument) => instrument.playing).length,

    getSelectedInstrument: (state) =>
      state.instruments[state.selectedInstrument],

    getInstrumentByChannel: (state) => (channel) => state.instruments[channel],
  },

  mutations: {
    setSelectedInstrument(state, idx) {
      state.showSettings = false
      state.selectedInstrument = idx
    },

    setLanguage(state, lang) {
      state.lang = lang
    },

    setInstrumentSetting(state, { idx, name, value }) {
      state.instruments[idx][name] = value
    },

    setHelp(state, keyword) {
      state.help = keyword
    },

    clearHelp(state) {
      state.help = ''
    },

    toggleSettings(state) {
      state.showSettings = !state.showSettings
    },

    toggleSendMidi(state, channel) {
      state.instruments[channel].sendMidi = !state.instruments[channel].sendMidi
    },

    togglePlaying(state) {
      state.playing = !state.playing
    },

    forwardCycleSelectedInstrument(state) {
      const newIdx =
        state.selectedInstrument === null
          ? 0
          : (state.selectedInstrument + 1) % state.instruments.length
      state.showSettings = false
      state.selectedInstrument = newIdx
    },
  },
})
