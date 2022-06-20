<template>
  <div class="control" :class="`settings-${name}`">
    <svg>
      <polygon
        points="10,0 0,5 10,10"
        class="arrow"
        :class="{ disabled: idx === 0 }"
        @click="change(name, -1)"
      ></polygon>
    </svg>
    <div>
      {{
        `${prependText ? prependText : ''}${
          translate ? $t(`${name}.${value}`) : value
        }`
      }}
    </div>
    <svg>
      <polygon
        points="0,0 10,5 0,10"
        class="arrow"
        :class="{ disabled: idx === options.length - 1 }"
        @click="change(name, 1)"
      ></polygon>
    </svg>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  props: {
    name: {
      required: true,
      type: String,
    },

    options: {
      required: true,
      type: Array,
    },

    prependText: {
      required: false,
      type: String,
      default: null,
    },

    translate: {
      required: false,
      type: Boolean,
      default: false,
    },
  },

  computed: {
    ...mapGetters({
      instrument: 'getSelectedInstrument',
    }),

    value() {
      return this.instrument[this.name]
    },

    idx() {
      return this.options.indexOf(this.value)
    },

    color() {
      if (!this.instrument) return null
      return this.instrument.color
    },
  },

  watch: {
    color() {
      this.updateColor()
    },
  },

  mounted() {
    this.updateColor()
  },

  methods: {
    updateColor() {
      this.$el.style.setProperty('--color', this.color)
    },

    change(name, dir) {
      if (dir !== 1 && dir !== -1) return
      const newIdx = this.idx + dir
      if (newIdx >= this.options.length || newIdx <= -1) return
      const newValue = this.options[newIdx]
      const payload = {
        idx: this.$store.state.selectedInstrument,
        name: this.name,
        value: newValue,
      }
      this.$store.commit('setInstrumentSetting', payload)
    },
  },
}
</script>

<style lang="scss">
.control {
  svg {
    width: 10px;
    height: 10px;
  }
  height: 18px;
  font-size: 13px;
  font-weight: bold;
  background: var(--color);
  margin: 3px auto;
  div {
    display: inline-block;
    width: 80%;
  }
  .arrow {
    fill: black;
    &.disabled {
      opacity: 0.3;
    }
  }
}
</style>
