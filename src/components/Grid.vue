<template>
  <div class="root">
    <div class="timeline"><svg></svg></div>
    <FontAwesomeIcon
      :icon="!playing ? 'play' : 'pause'"
      class="play-grid"
      :class="{ playing: playing }"
      @click="$store.commit('togglePlaying')"
    />
    <div class="grid">
      <div
        v-for="col in 15 * 6"
        :key="col"
        class="grid-item"
        :class="{ active: (col - 1) % 15 === 3 }"
      ></div>
    </div>
    <div class="bpms"></div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  data: function () {
    return {
      state: [],
      row: 0,
    }
  },

  computed: {
    ...mapState(['playing']),
  },
}
</script>

<style lang="scss" scoped>
.root {
  color: black;
  display: grid;
  grid-template-columns: 11fr 1fr;
  background-color: var(--fg);
  grid-gap: 10px;
  padding: 10px;
}

.timeline {
  background: var(--bg);
  height: 20px;
}

.play-grid {
  color: var(--bg);
  &.playing {
    color: var(--white);
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(15, 1fr);
  grid-gap: 5px;
  .grid-item {
    background: var(--bg);
    width: 20px;
    height: 20px;
    &.active {
      border: 2px solid darkgrey;
      border-radius: 2px;
    }
    &:hover {
      cursor: pointer;
    }
  }
}

.bpms {
  background: var(--bg);
}
</style>
