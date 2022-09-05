// #########################################################################
// gl-utils - Am ES5 module to some of the boilerplate out of using WebGL
// Ben Coleman, 2022
// #########################################################################

// ====================================================================================
// Initialize a WebGL program, so WebGL knows how to draw our data
// ====================================================================================
export function initShaderProgram(gl, vsSource, fsSource) {
  // Load the two shaders from the source code strings
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource)
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource)

  // Create the shader program
  const prog = gl.createProgram()

  gl.attachShader(prog, vertexShader)
  gl.attachShader(prog, fragmentShader)
  gl.linkProgram(prog)

  // If creating the program failed
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(`Unable to initialize the WebGL program: ${gl.getProgramInfoLog(prog)}`)
  }

  return prog
}

// ====================================================================================
// Load shader sources from external files using fetch, return both sources as strings
// ====================================================================================
export async function fetchShaders(vertPath, fragPath) {
  const vsResp = await fetch(vertPath)
  const fsResp = await fetch(fragPath)

  if (!vsResp.ok || !fsResp.ok) {
    throw new Error(`Fetch failed - vertex: ${vsResp.statusText}, fragment: ${fsResp.statusText}`)
  }

  const vsText = await vsResp.text()
  const fsText = await fsResp.text()

  return { vertex: vsText, fragment: fsText }
}

// ====================================================================================
// Creates a shader of the given type compiling it from the given source
// ====================================================================================
export function loadShader(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)

  // Compile the shader program
  gl.compileShader(shader)

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const reason = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`Error compiling shader: ${reason}`)
  }

  return shader
}

// ====================================================================================
// Helper to show text on the screen
// ====================================================================================
export function setOverlay(message) {
  const overlay = document.getElementById('overlay')
  if (!overlay) return
  overlay.style.display = 'block'
  overlay.innerHTML = message
}

// ====================================================================================
// Resize a canvas to fill it's display area, useful with a full window sized canvas
// ====================================================================================
export function resizeCanvasToDisplaySize(canvas) {
  // Lookup the size the browser is displaying the canvas in CSS pixels.
  const displayWidth = canvas.clientWidth
  const displayHeight = canvas.clientHeight

  // Check if the canvas is not the same size.
  const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight

  if (needResize) {
    // Make the canvas the same size
    canvas.width = displayWidth
    canvas.height = displayHeight
  }

  return needResize
}

// ================================================================================
// Helper function to bounce a value between two limits
// ================================================================================
export function oscillate(input, min, max) {
  let range = max - min
  return min + Math.abs(((input + range) % (range * 2)) - range)
}
