// ===============================================================================
// Main app function to run the GL shader
// ===============================================================================

import * as twgl from 'twgl.js'
import Alpine from 'alpinejs'
import Toastify from 'toastify-js'

import vertShader from './shaders/base.glsl.vert?raw'
import vertShaderPost from './shaders/post.glsl.vert?raw'
import vertShaderState from './shaders/state.glsl.vert?raw'
import boilerPlate from './shaders/boilerplate.glsl?raw'

import { getGl, resize } from '../lib/gl.js'
import { addErrorLine, clearErrors, resizeEditor, selector, getCode } from './editor.js'
import { getTexture as getAudioTexture, getBinCount } from './audio.js'
import { getTexture as getMIDITexture } from './midi.js'
import { getTexture as getKeysTexture, getMouseData } from './inputs.js'
import * as rand from './rand-noise.js'
import { cfg } from './config'

let looping = false
let paused = false
let lastTime = 0
let elapsedTime = 0
let fps = 0

/** @type {MediaStream | null} */
let stream

/** @type {MediaRecorder} */
let mediaRecorder

/** @type {twgl.FramebufferInfo} */
let postFrameBuff

/**
 * Wrapper function to execute the shader when the button is pressed
 * This is the main entry point for the shader execution
 */
export function execPressed() {
  looping = false

  Toastify({
    text: 'Starting shader execution...',
    duration: 2000,
  }).showToast()

  // Resize everything here, only place it really works
  Alpine.store('error', '')
  resizeAll()

  // This trick allows the render loop to catch the running flag and exit
  // Without this you get a lot of WebGL errors, don't ask, it works...
  setTimeout(() => {
    const mainCode = getCode('main')
    if (!mainCode || mainCode.length === 0) {
      Alpine.store('error', "No shader code! That's not going to work...")
      return
    }

    const postCode = getCode('post')
    if (!postCode || postCode.length === 0) {
      Alpine.store('error', "No post-processing code! That's not going to work...")
      return
    }

    const stateCode = getCode('state')
    if (!stateCode || stateCode.length === 0) {
      Alpine.store('error', "No state code! That's not going to work...")
      return
    }

    execShader(mainCode.trim(), postCode.trim(), stateCode.trim())
  }, 50)
}

/**
 * Compile and run the shaders, including the main inner render loop
 * Called only from execPressed()
 * @param {string} mainCode - The fragment shader code
 * @param {string} postCode - The post-processing shader code
 * @param {string} stateCode - The state shader code
 */
function execShader(mainCode, postCode, stateCode) {
  const gl = getGl(selector, false)
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.BLEND)

  clearErrors()

  const mainProgInfo = compileShader(gl, vertShader, mainCode)

  if (!mainProgInfo) {
    return
  }

  console.log('🚦 Shader compiled successfully!')

  const { noiseTex, randomTex, noise3Tex } = rand.createTextures(gl, twgl)

  // Create a fullscreen quad buffer
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
    position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
  })

  // Stuff required for 2nd pass
  const postBufferInfo = twgl.createBufferInfoFromArrays(gl, {
    position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
    img_coord: [0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1],
  })
  postFrameBuff = twgl.createFramebufferInfo(gl, undefined, gl.canvas.width, gl.canvas.height)
  const postProgInfo = compileShader(gl, vertShaderPost, postCode)

  const stateBufferInfo = twgl.createBufferInfoFromArrays(gl, {
    position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
    state_coord: [0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1],
  })

  const stateSize = cfg().STATE_SIZE
  const stateTex = twgl.createTexture(gl, {
    src: new Uint8Array(stateSize * stateSize * 4),
    format: gl.RGBA,
    wrap: gl.CLAMP_TO_EDGE,
    min: gl.NEAREST, // Really important to use NEAREST here
    mag: gl.NEAREST, // Really important to use NEAREST here
    width: stateSize,
    height: stateSize,
  })

  const stateFrameBuff = twgl.createFramebufferInfo(gl, undefined, stateSize, stateSize)

  const stateProgInfo = compileShader(gl, vertShaderState, stateCode)

  statusUpdate()

  /**
   * Inner function to render the shader
   * @param {number} time
   */
  function render(time) {
    fps = 1000 / (time - lastTime)

    // Advance time
    let deltaTime = 0
    if (!paused) {
      deltaTime = (time - lastTime) / 1000
      elapsedTime += deltaTime
    }

    // When running is false, clear the screen and exit render loop
    if (!looping) {
      gl.clearColor(0.0, 0.0, 0.0, 1.0)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      return
    }

    const commonUniforms = {
      u_time: elapsedTime,
      u_delta: deltaTime,
      u_resolution: [gl.canvas.width, gl.canvas.height],
      u_aspect: gl.canvas.width / gl.canvas.height,
      u_analyser_tex: getAudioTexture(gl),
      u_analyser_size: getBinCount(),
      u_midi_tex: getMIDITexture(gl),
      u_rand_tex: randomTex,
      u_noise_tex: noiseTex,
      u_noise_tex3: noise3Tex,
      u_mouse: getMouseData(),
      u_keys_tex: getKeysTexture(gl),
    }

    // Pre-render pass
    // State handling pre-pass, only writes to the state texture
    const stateUniforms = {
      u_state_tex: stateTex,
      ...commonUniforms,
    }

    twgl.bindFramebufferInfo(gl, stateFrameBuff)
    gl.useProgram(stateProgInfo.program)
    twgl.setBuffersAndAttributes(gl, stateProgInfo, stateBufferInfo)
    twgl.setUniforms(stateProgInfo, stateUniforms)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)
    twgl.drawBufferInfo(gl, stateBufferInfo)

    // Copy the state framebuffer back to the state texture
    gl.bindTexture(gl.TEXTURE_2D, stateTex)
    gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, stateSize, stateSize, 0)

    // Pass 1
    // Main pass renders to the post-processing framebuffer
    const mainUniforms = {
      u_state_tex: stateTex,
      ...commonUniforms,
    }

    twgl.bindFramebufferInfo(gl, postFrameBuff)
    gl.useProgram(mainProgInfo.program)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    twgl.setBuffersAndAttributes(gl, mainProgInfo, bufferInfo)
    twgl.setUniforms(mainProgInfo, mainUniforms)
    twgl.drawBufferInfo(gl, bufferInfo)

    // Pass 2
    // Post processing which renders to the screen
    const postPassUniforms = {
      image: postFrameBuff.attachments[0],
      ...commonUniforms,
    }

    gl.useProgram(postProgInfo.program)
    twgl.setUniforms(postProgInfo, postPassUniforms)
    twgl.setBuffersAndAttributes(gl, postProgInfo, postBufferInfo)
    twgl.bindFramebufferInfo(gl, null) // Draw to the screen
    twgl.drawBufferInfo(gl, postBufferInfo)

    // Update status every 150ms
    if (time % 150 < 30) {
      Alpine.store('fps', fps.toFixed(1))
      Alpine.store('elapsedTime', elapsedTime.toFixed(1))
    }

    // Loop and update the time
    lastTime = time
    requestAnimationFrame(render)
  }

  // It's all about this one line of code
  console.log('🚀 Starting render loop')
  looping = true
  requestAnimationFrame(render)
}

/**
 * Reset the shader time to zero
 */
export function rewind() {
  Toastify({
    text: 'Rewinding time...',
    duration: 2000,
  }).showToast()

  elapsedTime = 0
  lastTime = performance.now()
  statusUpdate()
}

/**
 * Pause or resume the shader
 */
export function pauseOrResume() {
  paused = !paused

  Toastify({
    text: paused ? 'Shader paused' : 'Shader resumed',
    duration: 2000,
  }).showToast()

  statusUpdate()
}

/**
 * Capture the video output of the shader
 * @param {HTMLCanvasElement} outputEl - The canvas element to capture
 */
export function videoCapture(outputEl) {
  if (stream) {
    console.log('📽️ Stopping video capture')

    Toastify({
      text: 'Stopping video capture, saving to file...',
      duration: 2000,
    }).showToast()

    mediaRecorder.stop()
  }

  Toastify({
    text: 'Starting video capture...',
    duration: 2000,
  }).showToast()

  stream = outputEl.captureStream(60)

  /** @type {Blob[]} */
  const recordedChunks = []
  mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/mp4' })

  mediaRecorder.ondataavailable = (e) => {
    console.log('🍗 Video data available')
    if (e.data.size > 0) recordedChunks.push(e.data)
  }

  mediaRecorder.onstop = () => {
    console.log('💽 Saving video to file')

    const blob = new Blob(recordedChunks, { type: 'video/mp4' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'shaderbox.mp4'
    document.body.appendChild(link)
    link.click()
    link.remove()
    stream = null
    Alpine.store('recording', false)
  }

  console.log('📽️ Starting video capture')
  mediaRecorder.start()

  Alpine.store('recording', true)
}

/**
 * Update the text on the status bar
 */
function statusUpdate() {
  let status = paused ? 'Paused' : 'Running'

  if (stream) {
    status = 'Capturing video...'
  }

  Alpine.store('status', status)
  Alpine.store('paused', paused)
}

/**
 * Resize the canvas, framebuffer and editor
 */
export function resizeAll() {
  resize()

  // We need to resize the post-processing framebuffer too!
  if (postFrameBuff) {
    const gl = getGl(selector, false)
    twgl.resizeFramebufferInfo(gl, postFrameBuff)
  }

  resizeEditor()
}

/**
 * Compile shader code and return the program info
 * @param {WebGL2RenderingContext} gl
 * @param {string} vertShaderCode
 * @param {string} shaderCode
 * @returns {twgl.ProgramInfo}
 */
function compileShader(gl, vertShaderCode, shaderCode) {
  // Add extra & boilerplate code to the fragment shader
  const code = boilerPlate + shaderCode

  // Count the number of lines in the boilerplate
  const boilerplateLines = boilerPlate.split('\n').length - 1

  // Create TWGL ProgramInfo, which compiles the shader with a custom error handler
  // This error handler will parse the error message
  const progInfo = twgl.createProgramInfo(gl, [vertShaderCode, code], (errMessage) => {
    let niceErr = 'Error compiling shader:<br>'
    for (const line of errMessage.split('\n')) {
      if (line.includes('^^^ ERROR')) {
        const lineNumMatch = line.match(/ERROR: \d+:(\d+):/)
        if (!lineNumMatch) {
          continue
        }
        const messageMatch = line.match(/ERROR: \d+:\d+:(.*)$/)
        if (!messageMatch) {
          continue
        }

        const lineNum = parseInt(lineNumMatch[1])
        const message = messageMatch[1].trim()

        niceErr += `Line:${lineNum - boilerplateLines} ${message}<br>`

        addErrorLine(lineNum - boilerplateLines, message)
      }
    }

    Alpine.store('error', niceErr)

    console.error('💥 Failed to compile shader!')
    console.error(errMessage)
  })

  return progInfo
}
