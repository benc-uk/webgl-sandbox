import { fetchShaders, initShaderProgram, resizeCanvasToDisplaySize, setOverlay, oscillate } from '../lib/gl-utils.mjs'
import * as mat4 from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/mat4.js'

let canvas = null

//
// Start here :D
//
window.onload = async () => {
  canvas = document.querySelector('canvas')
  resizeCanvasToDisplaySize(canvas)
  const gl = canvas.getContext('webgl2')

  // If we don't have a GL context, give up now
  if (!gl) {
    setOverlay('Unable to initialize WebGL. Your browser or machine may not support it!')
    return
  }
  // Load shaders from external files
  const { vertShaderSource, fragShaderSource } = await fetchShaders('./vert.glsl', './frag.glsl')

  // Initialize a shader program; this is where all the lighting for the vertices and so forth is established.
  let shaderProgram = null
  try {
    shaderProgram = initShaderProgram(gl, vertShaderSource, fragShaderSource)
  } catch (err) {
    setOverlay(err.message)
    return
  }

  // Collect all the info needed to use the shader program.
  // Look up which attributes & uniforms our shader program is using
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      hueShift: gl.getUniformLocation(shaderProgram, 'uHueShift'),
    },
  }

  // Here's where we call the routine that builds all the objects we'll be drawing.
  const buffers = initBuffers(gl)

  // Draw the scene every time the screen is refreshed.
  requestAnimationFrame((now) => {
    drawScene(gl, programInfo, buffers, now)
  })
}

//
// initBuffers - does nearly all the setup work
//
function initBuffers(gl) {
  // Create a buffer for the square's vertex positions.
  const positionBuffer = gl.createBuffer()

  // Select the positionBuffer as the one to operate on
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

  // Create an array of positions for the 2D square, basically the corners
  const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0]

  // Now pass the list of positions into WebGL to build the shape
  // Convert to a Float32Array then upload it to the GPU
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

  // Now set up the colors for the four vertices
  // prettier-ignore
  var colors = [
    0.0, 0.0, 1.0, 1.0, // blue
    0.0, 1.0, 0.0, 1.0, // green
    1.0, 0.0, 0.0, 1.0, // red
    1.0, 1.0, 1.0, 1.0, // white
  ]

  // Same as above, but for the colors
  const colorBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)

  return {
    position: positionBuffer,
    color: colorBuffer,
  }
}

//
// Draw the scene.
//
function drawScene(gl, programInfo, buffers, now) {
  now *= 0.001

  // Used for full screen canvas with resizing
  resizeCanvasToDisplaySize(canvas)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

  // Create a perspective matrix for the camera
  const projectionMatrix = mat4.create()
  {
    const fieldOfView = (45 * Math.PI) / 180 // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
    const zNear = 0.1
    const zFar = 100.0
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar)
  }

  // Set the drawing position to the "identity" point, which is the center of the scene.
  const modelViewMatrix = mat4.create()
  // We create a simple animation here; we'll animate the square's position over time
  const dist = oscillate(now * 2.5, -8, -3)
  mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, dist])

  // Tell WebGL how to pull out the positions from the position buffer into the vertexPosition attribute
  {
    const numComponents = 2 // 2d object with vertex x,y pairs
    const type = gl.FLOAT
    const normalize = false
    const stride = 0
    const offset = 0
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, numComponents, type, normalize, stride, offset)
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition)
  }

  // Tell WebGL how to pull out the colors from the color buffer into the vertexColor attribute.
  {
    const numComponents = 4 // colors have 4 parts, RGBA
    const type = gl.FLOAT
    const normalize = false
    const stride = 0
    const offset = 0
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color)
    gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, numComponents, type, normalize, stride, offset)
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor)
  }

  // Tell WebGL to use our program when drawing
  gl.useProgram(programInfo.program)

  // Set the shader uniforms, two are matrixes for projection and model view
  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix)
  gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix)
  // This uniform is a scalar float used to shift the hue of the colors
  gl.uniform1f(programInfo.uniformLocations.hueShift, now * 2)

  // EVERYTHING comes down to this drawArrays call which does the actual rendering
  {
    const offset = 0
    const vertexCount = 4
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount)
  }

  // Call drawScene again next frame
  requestAnimationFrame((now) => {
    drawScene(gl, programInfo, buffers, now)
  })
}
