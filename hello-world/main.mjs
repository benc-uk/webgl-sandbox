import { initShaderProgram, setOverlay } from '../lib/gl-utils.mjs'

//
// Start here :D
//
window.onload = () => {
  const canvas = document.querySelector('canvas')
  const gl = canvas.getContext('webgl2')

  // If we don't have a GL context, give up now
  if (!gl) {
    setOverlay('Unable to initialize WebGL. Your browser or machine may not support it!')
    return
  }

  // Two very simple shaders
  const vertShaderSource = `
    attribute vec4 aVertexPosition;
    void main(void) {
      // Simply output un-transformed raw vertex positions, you will never do this in a real shader!
      gl_Position = aVertexPosition;
    }`

  const fragShaderSource = `
    void main(void) {
      // Output only red pixels
      gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }`

  // Initialize a shader program from the given shader code
  let shaderProgram = null
  try {
    shaderProgram = initShaderProgram(gl, vertShaderSource, fragShaderSource)
  } catch (err) {
    setOverlay(err.message)
    return
  }

  // Create the vertex position buffer
  const positionBuffer = initBuffers(gl)

  // Invoke the main rendering function
  drawScene(gl, shaderProgram, positionBuffer)
}

//
// initBuffers - does nearly all the setup work
//
function initBuffers(gl) {
  // Create a buffer for the square's vertex positions.
  const positionBuffer = gl.createBuffer()

  // Select the positionBuffer as the one to operate on
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

  // Now pass the list of positions into WebGL to build the shape
  // Use a Float32Array then upload it to the GPU
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, 0.0, 0.5, -0.5, 0.5, 0.5]), gl.STATIC_DRAW)

  return positionBuffer
}

//
// Draw the scene.
//
function drawScene(gl, program, positionBuffer) {
  // NOTE: Normally you'd do this outside of the drawScene function
  const aVertexPositionLoc = gl.getAttribLocation(program, 'aVertexPosition')

  // Tell WebGL how to pull out the positions from the position buffer into the vertexPosition attribute
  {
    const numComponents = 2 // 2d object with vertex x,y pairs
    const type = gl.FLOAT
    const normalize = false
    const stride = 0
    const offset = 0
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.vertexAttribPointer(aVertexPositionLoc, numComponents, type, normalize, stride, offset)
    gl.enableVertexAttribArray(aVertexPositionLoc)
  }

  // Tell WebGL to use our program when drawing
  gl.useProgram(program)

  // EVERYTHING comes down to this drawArrays call which does the actual rendering
  {
    const offset = 0
    const vertexCount = 3
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount)
  }
}
