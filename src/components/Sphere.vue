<template>
  <div class="sphere"><canvas class="canvas"></canvas></div>
</template>

<script>
import * as Three from 'three'

export default {
  mounted() {
    this.init()
  },

  methods: {
    init() {
      var scene = new Three.Scene()

      var camera = new Three.PerspectiveCamera(75, 1, 0.1, 1000)

      var renderer = new Three.WebGLRenderer({
        canvas: this.$el.querySelector('.canvas'),
        antialias: true,
        alpha: true,
      })
      renderer.setSize(400, 400)

      // var geometry = new Three.BoxGeometry(1, 1, 1)
      var geometry = new Three.SphereGeometry(2.5, 15, 15)
      var material = new Three.MeshBasicMaterial({
        color: 'rgb(48, 48, 48)',
        wireframe: true,
      })
      var cube = new Three.Mesh(geometry, material)
      scene.add(cube)

      camera.position.z = 5

      var animate = function () {
        requestAnimationFrame(animate)
        cube.rotation.x += 0.0009
        cube.rotation.y += 0.003
        renderer.render(scene, camera)
      }
      animate()
    },
  },
}
</script>
