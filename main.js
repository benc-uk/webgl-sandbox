import './css/style.css'
import { getGl } from './lib/gl.js'

import * as twgl from 'twgl.js'

import vertShader from './shaders/base.glsl.vert?raw'
import defaultShader from './shaders/default.glsl.frag?raw'

let gl
let running = false
let paused = false
let editor
const selector = 'canvas'

// Main function to run the shader
function run(fragShader) {
  if (!fragShader) {
    showError('No fragment shader provided')
    return
  }

  hideError()
  gl = getGl(selector)

  const canvas = gl.canvas
  const aspectRatio = canvas.clientWidth / canvas.clientHeight

  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.BLEND)

  // Add extra & boilerplate code to the fragment shader
  // fragShader =
  //   `#version 300 es
  // precision highp float;
  // uniform vec2 u_resolution;
  // uniform float u_time;
  // uniform float u_aspect;
  // out vec4 fragColor;
  // ` + fragShader

  const progInfo = twgl.createProgramInfo(gl, [vertShader, fragShader], (msg) => {
    showError(msg)
  })

  if (!progInfo) {
    console.error('Failed to compile shader')
    return
  }

  gl.useProgram(progInfo.program)

  // Add a single quad to be rendered
  const arrays = {
    position: {
      numComponents: 2,
      data: [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1],
    },
  }

  const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays)
  twgl.setBuffersAndAttributes(gl, progInfo, bufferInfo)

  let totalTime = 0
  let lastTime = 0

  // Render loop
  function render(time) {
    // get the time delta between frames
    const deltaTime = time - lastTime
    lastTime = time

    // If paused, don't update the time
    if (!paused) {
      totalTime += deltaTime / 1000
    }

    // When running is false, clear the screen and exit render loop
    if (!running) {
      gl.clearColor(0.0, 0.0, 0.0, 1.0)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      return
    }

    const uniforms = {
      u_time: totalTime,
      u_resolution: [canvas.width, canvas.height],
      u_aspect: aspectRatio,
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
  console.log('🚀 Initialising...')
  hideError()

  document.getElementById('stop').addEventListener('click', stop)
  document.getElementById('pause').addEventListener('click', pause)
  document.getElementById('run').addEventListener('click', () => {
    running = false
    paused = false

    // This trick allows the render loop to catch the running flag and exit
    // Without this you get a lot of WebGL errors
    setTimeout(() => {
      run(editor.getValue())
    }, 50)
  })

  // Crap needed for Monaco editor
  require.config({
    paths: {
      vs: '/monaco/min/vs',
      bithero: '/monaco/plugins', // Custom GLS plugin
    },
  })

  // Load the Monaco editor
  require(['vs/editor/editor.main'], function () {
    require(['bithero/glsl'], function () {})

    editor = monaco.editor.create(document.getElementById('shaderCode'), {
      value: defaultShader, //localStorage.getItem('shaderText') || defaultShader,
      theme: 'vs-dark',
      language: 'glsl',
      minimap: { enabled: false },
      automaticLayout: true,
    })

    editor.focus()

    editor.onDidChangeModelContent(() => {
      localStorage.setItem('shaderText', editor.getValue())
    })

    // Run the shader when the editor is loaded
    run(editor.getValue())
  })
})
