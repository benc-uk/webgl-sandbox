import { fetchShaders, initShaderProgram, resizeCanvasToDisplaySize, setOverlay } from '../lib/gl-utils.mjs'
import * as mat4 from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/mat4.js'

let canvas = null
let cubeRotation = 0.0

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

  // Draw the scene repeatedly every frame
  var prevTime = 0
  async function render(now) {
    now *= 0.001
    const deltaTime = now - prevTime // Get smoothed time difference
    prevTime = now

    drawScene(gl, programInfo, buffers, deltaTime)
    requestAnimationFrame(render)
  }

  // Start the render loop first time
  requestAnimationFrame(render)
}

//
// initBuffers - does nearly all the setup work
//
function initBuffers(gl) {
  // Create a buffer for the square's vertex positions.
  const positionBuffer = gl.createBuffer()

  // Select the positionBuffer as the one to operate on
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

  // Create an array of positions for the cube
  // prettier-ignore
  const positions = [
    // Front face
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,
  
    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,
  
    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,
  
    // Bottom face
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,
  
    // Right face
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,
  
    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0,
  ];

  // Now pass the list of positions into WebGL to build the shape
  // Convert to a Float32Array then upload it to the GPU
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

  // Now set up the colors for the sides of the cube
  // prettier-ignore
  const faceColors = [
    [0.0,  1.0,  1.0,  1.0],    // Front face: cyan
    [1.0,  0.0,  0.0,  1.0],    // Back face: red
    [0.0,  1.0,  0.0,  1.0],    // Top face: green
    [0.0,  0.0,  1.0,  1.0],    // Bottom face: blue
    [1.0,  1.0,  0.0,  1.0],    // Right face: yellow
    [1.0,  0.0,  1.0,  1.0],    // Left face: purple
  ];

  // duplicate the colors for each vertex, four per face
  let colors = []
  for (var face = 0; face < faceColors.length; ++face) {
    const c = faceColors[face]
    colors = colors.concat(c, c, c, c)
  }

  // Same as above, but for the colors
  const colorBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)

  // This array defines each face as two triangles, using the indices into the vertex array to
  // specify each triangle's position.
  // prettier-ignore
  const indices = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23,   // left
  ];

  // Now send the element array to GL, note the use of ELEMENT_ARRAY_BUFFER
  // See https://webglfundamentals.org/webgl/lessons/webgl-indexed-vertices.html
  const indexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)

  return {
    position: positionBuffer,
    color: colorBuffer,
    indices: indexBuffer,
  }
}

//
// Draw the scene.
//
function drawScene(gl, programInfo, buffers, deltaTime) {
  // Used for full screen canvas with resizing
  resizeCanvasToDisplaySize(canvas)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

  gl.clearColor(0.0, 0.0, 0.0, 1.0) // Clear to black, fully opaque
  gl.clearDepth(1.0) // Clear everything
  gl.enable(gl.DEPTH_TEST) // Enable depth testing
  gl.depthFunc(gl.LEQUAL) // Near things obscure far things

  // Create a perspective matrix for the camera
  const projectionMatrix = mat4.create()
  {
    const fieldOfView = (45 * Math.PI) / 180 // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
    const zNear = 0.1
    const zFar = 100
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar)
  }

  // Set the drawing position to the "identity" point, which is the center of the scene.
  const modelViewMatrix = mat4.create()
  mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -6])
  mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation, [0, 1, 0])
  mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * 0.8, [1, 0, 0])
  mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * 0.3, [0, 0, 1])

  // Tell WebGL how to pull out the positions from the position buffer into the vertexPosition attribute
  {
    const numComponents = 3 // 3d object with 3 part vertexes x,y,z
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

  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices)

  // Tell WebGL to use our program when drawing
  gl.useProgram(programInfo.program)

  // Set the shader uniforms, two are matrixes for projection and model view
  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix)
  gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix)

  // EVERYTHING comes down to this drawArrays call which does the actual rendering
  {
    const vertexCount = 36
    const type = gl.UNSIGNED_SHORT
    const offset = 0
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset)
  }

  cubeRotation += deltaTime
  setOverlay(`Simple Cube &nbsp;&nbsp;&nbsp; (FPS: ${Math.round(1 / deltaTime)})`)
}
