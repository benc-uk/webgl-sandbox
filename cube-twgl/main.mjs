import { fetchShaders, setOverlay } from '../lib/gl-utils.mjs'
import * as twgl from 'https://cdnjs.cloudflare.com/ajax/libs/twgl.js/4.19.5/twgl-full.module.js'
import * as mat4 from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/mat4.js'

let cubeRotation = 0.0

//
// Start here :D
//
window.onload = async () => {
  const gl = document.querySelector('canvas').getContext('webgl2')

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

  // prettier-ignore
  const arrays = {
    position: [ 1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1 ],
    normal: [ 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1 ],
    indices: [ 0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23 ],
    color,
  }
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays)

  const uniforms = {
    u_worldInverseTranspose: mat4.create(),
    u_worldViewProjection: mat4.create(),

    // Move light somewhere in the world
    u_lightWorldPos: [-33, 60, 40],
    u_lightColor: [1, 1, 1],
    u_lightAmbient: [0.2, 0.2, 0.2],
  }

  const camera = mat4.create()
  mat4.targetTo(camera, [0, 0, 5.5], [0, 0, 0], [0, 1, 0])
  const view = mat4.create()
  mat4.invert(view, camera)
  uniforms.u_viewInverse = camera // Add the view inverse to the uniforms, we need it for shading

  // Draw the scene repeatedly every frame
  var prevTime = 0
  async function render(now) {
    now *= 0.001
    const deltaTime = now - prevTime // Get smoothed time difference
    prevTime = now

    drawScene(gl, programInfo, bufferInfo, uniforms, view, deltaTime)
    requestAnimationFrame(render)
  }

  // Start the render loop first time
  requestAnimationFrame(render)
}

//
// Draw the scene.
//
function drawScene(gl, programInfo, bufferInfo, uniforms, view, deltaTime) {
  twgl.resizeCanvasToDisplaySize(gl.canvas)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

  const perspective = mat4.create()
  mat4.perspective(perspective, (50 * Math.PI) / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100)
  const viewProjection = mat4.create()
  mat4.multiply(viewProjection, perspective, view)

  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  // Move object into the world
  const world = mat4.create()
  mat4.translate(world, world, [0.0, 0.0, 0.0])
  mat4.rotate(world, world, cubeRotation * -0.93, [0, 1, 0])
  mat4.rotate(world, world, cubeRotation * 0.72, [1, 0, 0])
  mat4.rotate(world, world, cubeRotation * 0.11, [0, 0, 1])
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

  cubeRotation += deltaTime
  setOverlay(`TWGL Simple Lit Cube &nbsp;&nbsp;&nbsp; (FPS: ${Math.round(1 / deltaTime)})`)
}
