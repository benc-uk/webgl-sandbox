import './css/style.css'
import { getGl } from './lib/gl.js'

import * as twgl from 'twgl.js'

import vertShader from './shaders/base.glsl.vert?raw'
import defaultShader from './shaders/default.glsl.frag?raw'
import boilerPlate from './shaders/boilerplate.glsl?raw'

let gl
let running = false
let paused = false
let editor
const selector = 'canvas'

// Main function to run the shader
function startRun(fragShader) {
  if (!fragShader) {
    showError('No fragment shader provided')
    return
  }

  hideError()
  gl = getGl(selector)
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.BLEND)
  const canvas = gl.canvas

  // Add extra & boilerplate code to the fragment shader
  fragShader = boilerPlate + fragShader

  const progInfo = twgl.createProgramInfo(gl, [vertShader, fragShader], (msg) => {
    let niceMessage = ''
    for (let line of msg.split('\n')) {
      if (line.includes('^^^ ERROR')) niceMessage += line + '\n'
    }

    showError(niceMessage)
    console.error('💥 Failed to compile shader!')
    console.error(msg)
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

  // Render loop
  function render(time) {
    twgl.resizeCanvasToDisplaySize(gl.canvas)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
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

  running = true
  requestAnimationFrame(render)
}

function stop() {
  running = false
}

function pause() {
  paused = !paused
}

function hideError() {
  document.getElementById('error').style.display = 'none'
}

function showError(errMessage = '') {
  document.getElementById('error').innerText = errMessage
  document.getElementById('error').style.display = 'block'
}

// Startup everything when the DOM is ready
window.addEventListener('DOMContentLoaded', async () => {
  console.log('🚦 Initialising...')
  hideError()

  document.getElementById('fullscreen').addEventListener('click', () => {
    const gl = getGl(selector)
    gl.canvas.requestFullscreen()
    setTimeout(() => {
      twgl.resizeCanvasToDisplaySize(gl.canvas)
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

      resizeEditor()
    }, 200)
  })

  document.getElementById('stop').addEventListener('click', stop)
  document.getElementById('pause').addEventListener('click', pause)
  document.getElementById('run').addEventListener('click', () => {
    running = false
    paused = false

    // This trick allows the render loop to catch the running flag and exit
    // Without this you get a lot of WebGL errors
    setTimeout(() => {
      startRun(editor.getValue())
    }, 50)
  })

  window.addEventListener('resize', resizeEditor)

  // Crap needed for Monaco editor
  require.config({
    paths: {
      vs: 'monaco/min/vs',
      bithero: 'monaco/plugins', // Custom GLS plugin
    },
  })

  // Load the Monaco editor, it still uses some funky old school AMD loader
  require(['vs/editor/editor.main'], function () {
    require(['bithero/glsl'], function () {})

    editor = monaco.editor.create(document.getElementById('shader-code'), {
      value: localStorage.getItem('shaderText') || defaultShader,
      theme: 'vs-dark',
      language: 'glsl',
      minimap: { enabled: false },
      automaticLayout: true,
      scrollBeyondLastLine: false,
    })

    editor.focus()

    editor.onDidChangeModelContent(() => {
      localStorage.setItem('shaderText', editor.getValue())
    })

    // Run the shader when the editor is loaded
    startRun(editor.getValue())
  })

  setTimeout(() => {
    resizeEditor()
  }, 200)
})

function resizeEditor() {
  const editor = document.getElementById('shader-code')
  const canvas = document.getElementById('output')

  const width = window.innerWidth - 0
  const height = window.innerHeight - canvas.height - 80
  console.log(`innerHeight: ${window.innerHeight}`)
  console.log(`canvas size: ${canvas.height}`)

  editor.style.height = `${height}px`
  editor.style.width = `${width}px`
}
