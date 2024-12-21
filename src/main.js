import '../css/style.css'
import '../lib/fontawesome/css/solid.css'
import '../lib/fontawesome/css/fontawesome.css'

import { getGl, resize } from '../lib/gl.js'
import { $, $$, onClick, hide, show, onKeyDownWithCode, onFullscreenChange, onChange, disable, enable, floatValue } from '../lib/dom.js'
import { pauseOrResume, execPressed, rewind, hideError, showError } from './app.js'
import { initEditor, selector, editor, resizeEditor } from './editor.js'
import { getShaderText, loadSample } from './storage.js'
import { getActiveAudioDevice, initInputAudio, listInputDevices, stopInputAudio } from './audio.js'

// Entry point for the whole app
window.addEventListener('DOMContentLoaded', async () => {
  console.log('🚦 Initialising...')
  getGl(selector) // We call this early to make sure we have a GL context, but we don't need it yet
  getShaderText() // Load the shader text from local storage
  hideError()

  $('#version').innerText = `v${import.meta.env.PACKAGE_VERSION}`

  onClick('#exec', execPressed)

  onClick('#pause', pauseOrResume)

  onClick('#rewind', rewind)

  onClick('#load', () => {
    hideError()
    hide('#audio-dialog')
    show('#file-dialog')
  })

  onClick('#fullscreen', () => {
    $('#output').requestFullscreen()
    setTimeout(() => {
      resize()
      resizeEditor()
    }, 200)
  })

  onClick('#audio', async () => {
    hideError()
    hide('#file-dialog')

    const devices = await listInputDevices()
    if (devices === null) {
      disable('#audio-devices')
      $('#audio-devices').innerHTML = '<option>Input audio access denied</option>'
    } else {
      $('#audio-devices').innerHTML = '<option value="none">--- Select Device ---</option>'
      const activeDevice = getActiveAudioDevice()

      if (!activeDevice) {
        disable('#audio-in-close')
      }

      for (const device of devices) {
        const option = document.createElement('option')
        option.text = device.label
        option.value = device.deviceId

        if (activeDevice && activeDevice.deviceId === device.deviceId) {
          option.selected = true
        }

        $('#audio-devices').add(option)
      }

      $('#audio-in-open').onclick = async () => {
        const device = devices.find((d) => d.deviceId === $('#audio-devices').value)

        const smoothing = floatValue('#audio-smoothing')
        const gain = floatValue('#audio-gain')
        const output = $('#audio-output').checked

        await initInputAudio(device, output, smoothing, gain)
        enable('#audio-in-close')
        hide('#audio-dialog')
      }
    }

    show('#audio-dialog')
  })

  onChange('#audio-devices', () => {
    enable('#audio-in-open')
  })

  onClick('#audio-in-close', () => {
    hide('#audio-dialog')
    stopInputAudio()
  })

  onClick('#toggle', () => {
    const codeEl = $('#code')
    if (codeEl.style.display === 'none') {
      codeEl.style.display = 'block'
      $('#output-wrap').style.height = `${window.innerHeight - window.innerHeight / 2.6}px`
      resize()
      resizeEditor()
    } else {
      codeEl.style.display = 'none'
      $('#output-wrap').style.height = `${window.innerHeight - 60}px`
      resize()
    }
  })

  onFullscreenChange('#output', () => {
    resize()
    resizeEditor()
  })

  window.addEventListener('resize', () => {
    resize()
    resizeEditor()
  })

  new MutationObserver(() => {
    resize()
    resizeEditor()
  }).observe($('#output-wrap'), { attributes: true })

  onClick('#load-cancel', () => {
    hide('#file-dialog')
  })

  onClick('#audio-cancel', () => {
    hide('#audio-dialog')
  })

  // A file loader, fetches file from the public/samples folder
  $$('.file').forEach((fileEl) => {
    fileEl.addEventListener('click', async () => {
      try {
        const shaderText = await loadSample(fileEl.dataset.file)
        editor.setValue(shaderText)
        hide('#file-dialog')
        rewind()
        execPressed()
      } catch (err) {
        hide('#file-dialog')
        showError(err.message)
      }
    })
  })

  // Spacebar to pause or resume
  onKeyDownWithCode('#output', 'Space', pauseOrResume)

  // Fullscreen mode when double clicking
  $('#output').ondblclick = function () {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      $('#output').requestFullscreen()
    }
  }

  // Capture double tap on mobile
  let lastTap = 0
  window.ontouchend = function (event) {
    const currentTime = new Date().getTime()
    const tapLength = currentTime - lastTap
    if (tapLength < 500 && tapLength > 0) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        $('#output').requestFullscreen()
      }
      event.preventDefault()
    }
    lastTap = currentTime
  }

  // Initialise the Monaco text editor, and then run the shader when it's ready
  initEditor(execPressed)
})
