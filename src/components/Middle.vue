<template>
  <div class="middle">
    <div class="buttons">
      <div class="save"></div>
      <div class="open"></div>
    </div>
    <Component :is="showSettings ? 'Settings' : 'Sphere'" />
    <div class="grid-footer">
      <h1 class="title">Políssonos</h1>
      <div class="authors">
        <!-- <div class="text-end">Créditos Rui Penha</div> -->
        <!-- <div>Ported to the web by Nuno Hespanhol</div> -->
      </div>
    </div>
  </div>
</template>

<script>
import Settings from '@/components/Settings'
import Sphere from '@/components/Sphere'
import { mapState } from 'vuex'

export default {
  components: {
    Settings,
    Sphere,
  },

  computed: {
    ...mapState(['showSettings']),
  },
}
</script>

<style lang="scss">
.grid-footer {
  position: absolute;
  bottom: 0;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  bottom: 0;
  color: var(--white);
  .title {
    font-size: 50px;
    margin: 0;
  }
  .authors {
    position: relative;
    text-align: left;
    font-size: 11px;
    div {
      position: absolute;
      bottom: 0;
    }
  }
}

.middle {
  position: relative;
  .buttons {
    float: right;
    width: 90px;
    height: 45px;
    background: var(--fg);
  }
}
</style>
