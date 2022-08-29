import { fetchShaders, setOverlay, resizeCanvasToDisplaySize } from '../lib/gl-utils.mjs'
import * as twgl from 'https://cdnjs.cloudflare.com/ajax/libs/twgl.js/4.19.5/twgl-full.module.js'
import * as mat4 from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/mat4.js'

let speed = 40

//
// Start here :D
//
window.onload = async () => {
  const gl = document.querySelector('canvas').getContext('webgl2')
  let instanceData = []

  document.querySelector('#count').addEventListener('change', (e) => {
    instanceData = setupInstances(e.target.value)
  })
  document.querySelector('#speed').addEventListener('change', (e) => {
    speed = e.target.value
  })

  // If we don't have a GL context, give up now
  if (!gl) {
    setOverlay('Unable to initialize WebGL. Your browser or machine may not support it!')
    return
  }

  // Load shaders from external files
  const { vertShaderSource, fragShaderSource } = await fetchShaders('./vert.glsl', './frag.glsl')

  // Use TWLG to set up the shaders and program
  let programInfo = null
  try {
    programInfo = twgl.createProgramInfo(gl, [vertShaderSource, fragShaderSource])
  } catch (err) {
    setOverlay(err.message)
    return
  }

  // Randomize the color of the cube
  let color = []
  for (var face = 0; face < 6; ++face) {
    const c1 = [Math.random(), Math.random(), Math.random(), 1.0]
    const c2 = [Math.random(), Math.random(), Math.random(), 1.0]
    const c3 = [Math.random(), Math.random(), Math.random(), 1.0]
    const c4 = [Math.random(), Math.random(), Math.random(), 1.0]
    color = color.concat(c1, c2, c3, c4)
  }

  const bufferInfo = twgl.primitives.createSphereBufferInfo(gl, 1, 36, 24)

  instanceData = setupInstances(1500)

  const uniforms = {
    u_worldInverseTranspose: mat4.create(),
    u_worldViewProjection: mat4.create(),

    // Move light somewhere in the world
    u_lightWorldPos: [10, 14, 3],
    u_lightColor: [1, 1, 1, 1],
    u_lightAmbient: [0.1, 0.1, 0.1],

    u_diffuseMult: [1, 1, 1, 1],
    u_specular: [1, 1, 1, 1],
    u_shininess: 23,
    u_specularFactor: 0.8,
  }

  const camera = mat4.create()
  mat4.targetTo(camera, [0, 0, 1], [0, 0, 0], [0, 1, 0])
  const view = mat4.create()
  mat4.invert(view, camera)
  uniforms.u_viewInverse = camera // Add the view inverse to the uniforms, we need it for shading

  // Draw the scene repeatedly every frame
  var prevTime = 0
  async function render(now) {
    now *= 0.001
    const deltaTime = now - prevTime // Get smoothed time difference
    prevTime = now

    drawScene(gl, programInfo, bufferInfo, uniforms, view, deltaTime, instanceData)
    requestAnimationFrame(render)
  }

  // Start the render loop first time
  requestAnimationFrame(render)
}

//
// Create the instance data for the objects
//
function setupInstances(count) {
  let instanceData = []
  for (let i = 0; i < count; ++i) {
    addInstance(instanceData, 300)
  }
  return instanceData
}

//
// Draw the scene.
//
function drawScene(gl, programInfo, bufferInfo, uniforms, view, deltaTime, instanceData) {
  twgl.resizeCanvasToDisplaySize(gl.canvas)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

  // Do this in every frame since the window and therefore the aspect ratio of projection matrix might change
  const perspective = mat4.create()
  mat4.perspective(perspective, (50 * Math.PI) / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 300)
  const viewProjection = mat4.create()
  mat4.multiply(viewProjection, perspective, view)

  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  for (let i in instanceData) {
    const instance = instanceData[i]
    uniforms.u_sphereColor = instance.color

    // Move object into the world
    const world = mat4.create()

    mat4.translate(world, world, [instance.x, instance.y, instance.z])
    mat4.scale(world, world, [instance.scale, instance.scale, instance.scale])
    uniforms.u_world = world

    // Populate u_worldInverseTranspose - used for normals & shading
    mat4.invert(uniforms.u_worldInverseTranspose, world)
    mat4.transpose(uniforms.u_worldInverseTranspose, uniforms.u_worldInverseTranspose)

    // Populate u_worldViewProjection which is pretty fundamental
    mat4.multiply(uniforms.u_worldViewProjection, viewProjection, world)

    gl.useProgram(programInfo.program)
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo)
    twgl.setUniforms(programInfo, uniforms)

    twgl.drawBufferInfo(gl, bufferInfo)

    instance.z += deltaTime * speed
  }

  for (let i in instanceData) {
    const instance = instanceData[i]
    if (instance.z > 2) {
      instanceData.splice(i, 1)
      addInstance(instanceData)
    }
  }

  setOverlay(`${instanceData.length} Spheres &nbsp;&nbsp;&nbsp; (FPS: ${Math.round(1 / deltaTime)})`)
}

function addInstance(instanceData, spread = 40) {
  const x = -50 + Math.random() * 100
  const y = -40 + Math.random() * 80
  const z = -300 + Math.random() * spread
  const scale = Math.random() * 1.4 + 0.2
  const color = [Math.random(), Math.random(), Math.random(), 1.0]
  instanceData.push({ color, scale, x, y, z })
}
