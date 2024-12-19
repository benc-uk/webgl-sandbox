import { getGl, resize } from '../lib/gl.js'
import { show, hide, setText } from '../lib/dom.js'
import { editor, selector, resizeEditor } from './editor.js'

import * as twgl from 'twgl.js'

import vertShader from './shaders/base.glsl.vert?raw'
import boilerPlate from './shaders/boilerplate.glsl?raw'

let running = false
let paused = false

export function runPressed() {
  running = false
  paused = false

  // Resize everything here, only place it really works
  resize()
  resizeEditor()

  // This trick allows the render loop to catch the running flag and exit
  // Without this you get a lot of WebGL errors, don't ask, it works...
  setTimeout(() => {
    run(editor.getValue())
  }, 50)
}

/**
 * Start the shader, including the main inner render loop
 * @param {string} shaderCode - The fragment shader code
 */
function run(shaderCode) {
  shaderCode = shaderCode.trim()
  if (!shaderCode) {
    showError("No fragment shader code! That's not going to work...")
    return
  }

  hideError()
  running = true

  const gl = getGl(selector)
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.BLEND)
  const canvas = gl.canvas

  // Add extra & boilerplate code to the fragment shader
  shaderCode = boilerPlate + shaderCode

  const progInfo = twgl.createProgramInfo(gl, [vertShader, shaderCode], (errMessage) => {
    let niceErr = ''
    for (let line of errMessage.split('\n')) {
      if (line.includes('^^^ ERROR')) niceErr += line + '\n'
    }
    niceErr = niceErr.replaceAll('^^^', '⚠️')

    showError(niceErr)
    console.error('💥 Failed to compile shader!')
    console.error(errMessage)
  })

  if (!progInfo) {
    return
  }

  console.log('🚦 Shader compiled successfully!')

  gl.useProgram(progInfo.program)

  // Add a single quad to be rendered
  const arrays = {
    position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
  }

  const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays)
  twgl.setBuffersAndAttributes(gl, progInfo, bufferInfo)

  let totalTime = 0
  let lastTime = 0

  /**
   * Inner function to render the shader
   * @param {number} time
   */
  function render(time) {
    const deltaTime = time - lastTime
    lastTime = time

    // When running is false, clear the screen and exit render loop
    if (!running) {
      gl.clearColor(0.0, 0.0, 0.0, 1.0)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      return
    }

    const uniforms = {
      u_time: paused ? totalTime : (totalTime += deltaTime / 1000),
      u_resolution: [canvas.width, canvas.height],
      u_aspect: [canvas.clientWidth / canvas.clientHeight],
    }

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    twgl.setUniforms(progInfo, uniforms)
    twgl.drawBufferInfo(gl, bufferInfo)

    // Loop
    requestAnimationFrame(render)
  }

  // It's all about this one line of code
  requestAnimationFrame(render)
}

// Stop the shader
export function stop() {
  running = false
  showError('🚫 Shader stopped')
}

// Pause the shader
export function pause() {
  paused = !paused
}

// Hide the error message
export function hideError() {
  hide('#error')
}

/**
 * Show an error message
 * @param {string} errMessage
 */
export function showError(errMessage = '') {
  setText('#error', errMessage)
  show('#error')
}
