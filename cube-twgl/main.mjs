import { fetchShaders, setOverlay } from '../lib/gl-utils.mjs'
import * as twgl from 'https://cdnjs.cloudflare.com/ajax/libs/twgl.js/4.19.5/twgl-full.module.js'
import * as mat4 from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/mat4.js'

let canvas = null
let cubeRotation = 0.0

//
// Start here :D
//
window.onload = async () => {
  canvas = document.querySelector('canvas')
  const gl = canvas.getContext('webgl2')

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

  const faceColors = [
    [0.0, 1.0, 1.0, 1.0], // Front face: cyan
    [1.0, 0.0, 0.0, 1.0], // Back face: red
    [0.0, 1.0, 0.0, 1.0], // Top face: green
    [0.0, 0.0, 1.0, 1.0], // Bottom face: blue
    [1.0, 1.0, 0.0, 1.0], // Right face: yellow
    [1.0, 0.0, 1.0, 1.0], // Left face: purple
  ]
  // duplicate the colors for each vertex, four per face
  let color = []
  for (var face = 0; face < faceColors.length; ++face) {
    const c = faceColors[face]
    color = color.concat(c, c, c, c)
  }

  // prettier-ignore
  const arrays = {
    position: [ 1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1 ],
    normal: [ 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1 ],
    indices: [ 0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23 ],
    color,
  }
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays)

  // Draw the scene repeatedly every frame
  var prevTime = 0
  async function render(now) {
    now *= 0.001
    const deltaTime = now - prevTime // Get smoothed time difference
    prevTime = now

    drawScene(gl, programInfo, bufferInfo, deltaTime)
    requestAnimationFrame(render)
  }

  // Start the render loop first time
  requestAnimationFrame(render)
}

//
// Draw the scene.
//
function drawScene(gl, programInfo, bufferInfo, deltaTime) {
  // Used for full screen canvas with resizing
  twgl.resizeCanvasToDisplaySize(gl.canvas)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

  gl.enable(gl.DEPTH_TEST)
  //gl.enable(gl.CULL_FACE)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  // Create a perspective matrix for the camera
  const projectionMatrix = mat4.create()
  {
    const fieldOfView = (45 * Math.PI) / 180 // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
    const zNear = 0.1
    const zFar = 100
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar)
  }

  const modelViewMatrix = mat4.create()
  mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -6])
  mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * -0.93, [0, 1, 0])
  mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * 0.72, [1, 0, 0])
  mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * 0.11, [0, 0, 1])

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
    u_lightWorldPos: [7, 2, 8],
    u_lightColor: [1, 1, 1],
    u_lightAmbient: [0.2, 0.2, 0.2],
  })
  gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0)

  cubeRotation += deltaTime
  setOverlay(`TWGL Simple Lit Cube &nbsp;&nbsp;&nbsp; (FPS: ${Math.round(1 / deltaTime)})`)
}
