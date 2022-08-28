import { fetchShaders, setOverlay, oscillate } from '../lib/gl-utils.mjs'
import * as twgl from 'https://cdnjs.cloudflare.com/ajax/libs/twgl.js/4.19.5/twgl-full.module.js'
import * as mat4 from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/mat4.js'

let canvas = null
let animOffset = 0.0

//
// Start here :D
//
window.onload = async () => {
  canvas = document.querySelector('canvas')
  const gl = canvas.getContext('webgl2')
  let instanceData = []

  document.querySelector('#sphereCount').addEventListener('change', (e) => {
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

  const bufferInfo = twgl.primitives.createSphereBufferInfo(gl, 1, 36, 24)

  instanceData = setupInstances(250)

  // Draw the scene repeatedly every frame
  var prevTime = 0
  async function render(now) {
    now *= 0.001
    const deltaTime = now - prevTime // Get smoothed time difference
    prevTime = now

    drawScene(gl, programInfo, bufferInfo, deltaTime, instanceData)
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
    const x = Math.random() * 30
    const y = Math.random() * 20
    const z = Math.random() * 80
    const scale = Math.random() * 1.2 + 0.3
    const color = [Math.random(), Math.random(), Math.random(), 1.0]
    instanceData.push({ color, scale, x, y, z })
  }
  return instanceData
}
//
// Draw the scene.
//
function drawScene(gl, programInfo, bufferInfo, deltaTime, instanceData) {
  twgl.resizeCanvasToDisplaySize(gl.canvas)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  // Create a perspective matrix for the camera
  const projectionMatrix = mat4.create()
  mat4.perspective(projectionMatrix, (45 * Math.PI) / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 1, 100)

  for (let instance of instanceData) {
    const modelViewMatrix = mat4.create()
    mat4.translate(modelViewMatrix, modelViewMatrix, [-15 + instance.x, -10 + instance.y, -90 + instance.z])
    mat4.scale(modelViewMatrix, modelViewMatrix, [instance.scale, instance.scale, instance.scale])

    const worldMatrix = mat4.create()
    mat4.translate(worldMatrix, worldMatrix, [0, 0, oscillate(animOffset * 16, -15, 50)])

    // The inverse-transpose of the modelViewMatrix is used to transform normals
    // The reason this works & is needed, are WAY beyond the scope of this code!
    const normalMatrix = mat4.create()
    mat4.invert(normalMatrix, modelViewMatrix)
    mat4.transpose(normalMatrix, normalMatrix)

    gl.useProgram(programInfo.program)
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo)
    twgl.setUniforms(programInfo, {
      u_modelViewMatrix: modelViewMatrix,
      u_projectionMatrix: projectionMatrix,
      u_normalMatrix: normalMatrix,
      u_worldMatrix: worldMatrix,
      u_lightWorldPos: [17, 16, 5],
      u_lightColor: [1, 1, 1],
      u_lightAmbient: [0.1, 0.1, 0.1],
      u_sphereColor: instance.color,
    })

    twgl.drawBufferInfo(gl, bufferInfo)
  }

  animOffset += deltaTime
  setOverlay(`Rendering ${instanceData.length} Spheres &nbsp;&nbsp;&nbsp; (FPS: ${Math.round(1 / deltaTime)})`)
}
