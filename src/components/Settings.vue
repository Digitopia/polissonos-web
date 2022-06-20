<template>
  <div class="controls" @click.stop="">
    <Setting
      name="name"
      :options="[
        'piano',
        'guitar',
        'vibraphone',
        'bass',
        'electric',
        'harp',
        'drums',
        'e. piano',
      ]"
      :translate="false"
    />

    <Setting
      name="root"
      :options="[
        'C#',
        'G#',
        'D#',
        'A#',
        'F',
        'C',
        'G',
        'D',
        'A',
        'E',
        'B',
        'F#',
      ]"
      :translate="true"
    />

    <Setting
      name="scale"
      :options="['pentatonic', 'dorian', 'mixolydian', 'major']"
      :translate="true"
    />

    <Setting
      name="beats"
      :options="[3, 4, 5]"
      prepend-text="bpm x "
      :translate="false"
    />

    <Setting
      name="subdivisions"
      :options="[1, 2, 3, 4, 5]"
      prepend-text="bpm ÷ "
      :translate="false"
    />
  </div>
</template>

<script>
import Setting from '@/components/Setting.vue'

export default {
  components: {
    Setting,
  },
}
</script>

<style lang="scss">
.controls {
  border: 2px solid var(--white);
  border-radius: 2px;
  background: var(--fg);
  // width: 150px;
  margin: 0 auto;
  padding: 10px;
  position: absolute;
  top: 30%;
  margin: 0 auto;
  width: 50%;
  left: 0;
  right: 0;
}
</style>
