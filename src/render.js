// ===============================================================================
// Main app function to run the GL shader
// ===============================================================================

import * as twgl from 'twgl.js'
import Handlebars from 'handlebars'
import Alpine from 'alpinejs'
import Toastify from 'toastify-js'

import vertShader from './shaders/base.glsl.vert?raw'
import vertShaderPost from './shaders/post.glsl.vert?raw'
import boilerPlate from './shaders/boilerplate.glsl?raw'

import { getGl, resize } from '../lib/gl.js'
import { addErrorLine, clearErrors, resizeEditor, selector, getPostCode, getShaderCode } from './editor.js'
import { getAnalyser } from './audio.js'
import { getTexture } from './midi.js'
import * as rand from './rand-noise.js'
import { cfg } from './config.js'

let looping = false
let paused = false
let lastTime = 0
let elapsedTime = 0
let fps = 0
let stream
let mediaRecorder
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
    const code = getShaderCode().trim()
    if (!code || code.length === 0) {
      Alpine.store('error', "No shader code! That's not going to work...")
      return
    }

    const postCode = getPostCode().trim()
    if (!postCode || postCode.length === 0) {
      Alpine.store('error', "No post-processing code! That's not going to work...")
      return
    }

    execShader(code, postCode)
  }, 50)
}

/**
 * Compile and run the shader, including the main inner render loop
 * Called only from execPressed()
 * @param {string} shaderCode - The fragment shader code
 */
function execShader(shaderCode, postCode) {
  const gl = getGl(selector, false)
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.BLEND)

  clearErrors()

  const ANALYSER_BINS = cfg().ANALYSER_FFT_SIZE / 2
  const progInfo = compileShader(gl, { ANALYSER_BINS }, vertShader, shaderCode)

  if (!progInfo) {
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
  const postProgInfo = compileShader(gl, { ANALYSER_BINS }, vertShaderPost, postCode)

  statusUpdate()

  /**
   * Inner function to render the shader
   * @param {number} time
   */
  function render(time) {
    fps = 1000 / (time - lastTime)

    // Audio and frequency data
    const dataArray = new Uint8Array(ANALYSER_BINS)
    const analyser = getAnalyser()
    if (analyser) {
      analyser.getByteFrequencyData(dataArray)
    }

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

    const uniforms = {
      u_time: elapsedTime,
      u_delta: deltaTime,
      u_resolution: [gl.canvas.width, gl.canvas.height],
      u_aspect: [gl.canvas.clientWidth / gl.canvas.clientHeight],
      u_analyser: dataArray,
      u_midi_tex: getTexture(gl, twgl),
      u_rand_tex: randomTex,
      u_noise_tex: noiseTex,
      u_noise_tex3: noise3Tex,
      u_mouse: [Alpine.store('mouseX'), Alpine.store('mouseY'), Alpine.store('mouseBut')],
    }

    const postPassUniforms = {
      image: postFrameBuff.attachments[0],
      ...uniforms,
    }

    twgl.bindFramebufferInfo(gl, postFrameBuff)

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // Draw the fullscreen quad using the shader
    gl.useProgram(progInfo.program)
    twgl.setBuffersAndAttributes(gl, progInfo, bufferInfo)
    twgl.setUniforms(progInfo, uniforms)
    twgl.drawBufferInfo(gl, bufferInfo)

    // Post processing 2nd pass
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
 * @param {any} templateContext
 * @param {*} vertShaderCode
 * @param {*} shaderCode
 * @returns
 */
function compileShader(gl, templateContext, vertShaderCode, shaderCode) {
  const template = Handlebars.compile(boilerPlate)

  // Add extra & boilerplate code to the fragment shader
  shaderCode = template(templateContext) + shaderCode

  // Count the number of lines in the boilerplate
  const boilerplateLines = boilerPlate.split('\n').length - 1

  const progInfo = twgl.createProgramInfo(gl, [vertShaderCode, shaderCode], (errMessage) => {
    let niceErr = 'Error compiling shader:\n\n'
    for (const line of errMessage.split('\n')) {
      if (line.includes('^^^ ERROR')) {
        const lineNum = line.match(/ERROR: \d+:(\d+):/)[1]
        const message = line.match(/ERROR: \d+:\d+:(.*)$/)[1]

        niceErr += `Line:${lineNum - boilerplateLines} ${message}\n`

        addErrorLine(lineNum - boilerplateLines, message)
      }
    }

    Alpine.store('error', niceErr)

    console.error('💥 Failed to compile shader!')
    console.error(errMessage)
  })

  return progInfo
}
