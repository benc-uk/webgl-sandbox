import './css/style.css'
import { getGl, resize } from './lib/gl.js'

import * as twgl from 'twgl.js'

import vertShader from './shaders/base.glsl.vert?raw'
import boilerPlate from './shaders/boilerplate.glsl?raw'

let gl
let editor
let running = false
let paused = false
const selector = 'canvas'

const $ = document.querySelector.bind(document)
const overlay = $('#overlay')
const error = $('#error')

/**
 * Start the shader, including the main inner render loop
 * @param {string} shaderCode - The fragment shader code
 */
function startRun(shaderCode) {
  shaderCode = shaderCode.trim()
  if (!shaderCode) {
    showError("No fragment shader code! That's not going to work...")
    return
  }

  hideError()
  running = true
  overlay.style.display = 'none'

  gl = getGl(selector)
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

    requestAnimationFrame(render)
  }

  // It's all about this one line of code
  requestAnimationFrame(render)
}

// Stop the shader
function stop() {
  running = false
  overlay.style.display = 'block'
}

// Pause the shader
function pause() {
  paused = !paused
}

// Hide the error message
function hideError() {
  error.style.display = 'none'
  resizeEditor()
}

/**
 * Show an error message
 * @param {string} errMessage
 */
function showError(errMessage = '') {
  error.innerText = errMessage
  error.style.display = 'block'
  resizeEditor()
}

// Resize the editor to fit properly under the canvas
function resizeEditor() {
  const editor = $('#shader-code')
  const canvas = $(selector)

  const width = window.innerWidth - 0
  const height = window.innerHeight - canvas.height - 80

  editor.style.height = `${height}px`
  editor.style.width = `${width}px`
}

/**
 * @param {string} name
 * @returns {Promise<string>}
 */
async function loadSample(name) {
  try {
    const resp = await fetch(`samples/${name}.glsl.frag`)
    if (!resp.ok || resp.status !== 200) {
      throw new Error(`Failed to load shader file: ${name}`)
    }

    const shaderText = await resp.text()
    localStorage.setItem('shaderText', shaderText)
    return shaderText
  } catch (e) {
    showError(e)
    return
  }
}

// Entry point for the whole app
window.addEventListener('DOMContentLoaded', async () => {
  console.log('🚦 Initialising...')
  hideError()

  $('#fullscreen').addEventListener('click', () => {
    const gl = getGl(selector)
    gl.canvas.requestFullscreen()

    setTimeout(() => {
      resize()
      resizeEditor()
    }, 200)
  })

  $('#output').addEventListener('fullscreenchange', (e) => {
    resize()
    resizeEditor()
  })

  window.addEventListener('resize', () => {
    resize()
    resizeEditor()
  })

  $('#load-cancel').addEventListener('click', () => {
    $('#file-sel').style.display = 'none'
  })

  $('#load').addEventListener('click', () => {
    $('#file-sel').style.display = 'block'
  })

  $('#stop').addEventListener('click', stop)

  $('#pause').addEventListener('click', pause)

  $('#run').addEventListener('click', () => {
    running = false
    paused = false

    // This trick allows the render loop to catch the running flag and exit
    // Without this you get a lot of WebGL errors, don't ask, it works...
    setTimeout(() => {
      startRun(editor.getValue())
    }, 50)
  })

  // Click on a shader file to load it, these are in li elements
  document.querySelectorAll('.file').forEach((fileEl) => {
    fileEl.addEventListener('click', async () => {
      const shaderText = await loadSample(fileEl.dataset.file)
      editor.setValue(shaderText)
      $('#file-sel').style.display = 'none'
      $('#run').click()
    })
  })

  $('#output').addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      pause()
    }
  })

  // Crap needed for Monaco editor
  require.config({
    paths: {
      vs: 'monaco/min/vs',
      bithero: 'monaco/plugins', // Custom GLS plugin
    },
  })

  // Load the Monaco editor, it still uses some funky old school AMD loader
  require(['vs/editor/editor.main'], async function () {
    require(['bithero/glsl'], function () {})

    let shaderText = localStorage.getItem('shaderText')
    if (shaderText === null) {
      shaderText = await loadSample('raytracer')
    }

    editor = monaco.editor.create($('#shader-code'), {
      value: shaderText,
      theme: 'vs-dark',
      language: 'glsl',
      minimap: { enabled: false },
      automaticLayout: true,
      scrollBeyondLastLine: false,
    })

    editor.focus()

    // Trap Ctrl+S to run the shader and prevent the browser from saving the file
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      $('#run').click()
    })

    editor.onDidChangeModelContent(() => {
      localStorage.setItem('shaderText', editor.getValue())
    })

    // Run the shader when the editor is loaded
    startRun(editor.getValue())
  })

  setTimeout(() => {
    resize()
    resizeEditor()
  }, 200)
})
