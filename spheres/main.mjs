import { fetchShaders, setOverlay, resizeCanvasToDisplaySize } from '../lib/gl-utils.mjs'
import * as twgl from 'https://cdnjs.cloudflare.com/ajax/libs/twgl.js/4.19.5/twgl-full.module.js'
import * as mat4 from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/mat4.js'

let increaser = 0
let xMoveAmount = Math.random() * 2
let yMoveAmount = Math.random() * 2

const FOV = 45
const FAR_CLIP = 700
const SPHERE_DIV = 12

//
// Start here :D
//
window.onload = async () => {
  const gl = document.querySelector('canvas').getContext('webgl2')

  let instanceData = []

  // For UI controls to allow some values to be changed
  document.querySelector('#count').addEventListener('change', (e) => {
    instanceData = setupInstances(e.target.value)
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

  const bufferInfo = twgl.primitives.createSphereBufferInfo(gl, 1, SPHERE_DIV, SPHERE_DIV)
  instanceData = setupInstances(1500)

  const uniforms = {
    u_worldInverseTranspose: mat4.create(),
    u_worldViewProjection: mat4.create(),

    // Move light somewhere in the world
    u_lightWorldPos: [document.querySelector('#light').value, 14, 3],
    u_lightColor: [1, 1, 1, 1],

    u_diffuseMult: [0.8, 0.8, 0.8, 1],
    u_lightAmbient: [0.1, 0.1, 0.1, 1],
    u_specular: [1, 1, 1, 1],
    u_shininess: 50,
    u_specularFactor: 0.8,
  }

  const camera = mat4.create()
  mat4.targetTo(camera, [0, 0, 1], [0, 0, 0], [0, 1, 0])
  const view = mat4.create()
  mat4.invert(view, camera)
  uniforms.u_viewInverse = camera // Add the view inverse to the uniforms, we need it for shading

  const frameTimes = []
  let frameCursor = 0
  let numFrames = 0
  const maxFrames = 20
  let totalFPS = 0

  // Draw the scene repeatedly every frame
  var prevTime = 0
  async function render(now) {
    now *= 0.001
    const deltaTime = now - prevTime // Get smoothed time difference
    prevTime = now

    // All of this is FPS calculation
    const fps = 1 / deltaTime
    totalFPS += fps - (frameTimes[frameCursor] || 0)
    frameTimes[frameCursor++] = fps
    numFrames = Math.max(numFrames, frameCursor)
    frameCursor %= maxFrames
    const averageFPS = totalFPS / numFrames
    setOverlay(`${instanceData.length} Spheres! &nbsp;&nbsp;&nbsp; (FPS: ${Math.round(averageFPS)})`)

    drawScene(gl, programInfo, bufferInfo, uniforms, view, deltaTime, instanceData)
    requestAnimationFrame(render)
  }

  // Start the render loop first time
  requestAnimationFrame(render)
}

//
// Draw the scene.
//
function drawScene(gl, programInfo, bufferInfo, uniforms, view, deltaTime, instanceData) {
  increaser += deltaTime
  const speed = document.querySelector('#speed').value
  uniforms.u_lightWorldPos = [document.querySelector('#light').value, 14, 3]

  twgl.resizeCanvasToDisplaySize(gl.canvas)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

  // Do this in every frame since the window and therefore the aspect ratio of projection matrix might change
  const perspective = mat4.create()
  mat4.perspective(perspective, (FOV * Math.PI) / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, FAR_CLIP)
  const viewProjection = mat4.create()
  mat4.multiply(viewProjection, perspective, view)

  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  // Add some movement
  const yMove = Math.sin(increaser * yMoveAmount) * 4
  const xMove = Math.sin(increaser * xMoveAmount) * 15

  for (let instance of instanceData) {
    uniforms.u_sphereColor = instance.color

    // Move object into the world
    const world = mat4.create()
    mat4.translate(world, world, [instance.x, instance.y, instance.z])
    mat4.translate(world, world, [xMove, yMove, 0])

    const reScale = document.querySelector('#size').value / 50
    mat4.scale(world, world, [instance.scale * reScale, instance.scale * reScale, instance.scale * reScale])
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

  // Remove spheres that are past the near clip plane
  for (let i in instanceData) {
    const instance = instanceData[i]
    if (instance.z > 0.1) {
      instanceData.splice(i, 1)
      addInstance(instanceData)

      // Uncomment this for exponential sphere growth!
      //addInstance(instanceData)
    }
  }
}

//
// Add a new instance to the array,
// spread is used to determine the range of z position
//
function addInstance(instanceData, spread = 40) {
  const x = -50 + Math.random() * 100
  const y = -40 + Math.random() * 80
  const z = -FAR_CLIP + Math.random() * spread
  const scale = Math.random() * 1.4 + 0.2
  const color = [Math.random(), Math.random(), Math.random(), 1.0]
  instanceData.push({ color, scale, x, y, z })
}

//
// Create the instance data for the objects
//
function setupInstances(count) {
  let instanceData = []
  for (let i = 0; i < count; ++i) {
    addInstance(instanceData, FAR_CLIP)
  }
  return instanceData
}
