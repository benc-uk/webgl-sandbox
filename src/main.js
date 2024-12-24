// ===============================================================================
// App entry point and initialisation of all DOM to JS bindings
// ===============================================================================

import '../css/style.css'
import '../lib/fontawesome/css/solid.css'
import '../lib/fontawesome/css/fontawesome.css'

import * as audio from './audio.js'
import * as midi from './midi.js'

// prettier-ignore
import { $, $$, closeDialog, disable, enable, floatValue, 
         onChange, onClick, onFullscreenChange, onKeyDownCode, showDialog } from '../lib/dom.js'
import { getGl, resize } from '../lib/gl.js'
import { execPressed, pauseOrResume, rewind, videoCapture } from './render.js'
import { editor, initEditor, resizeEditor, selector } from './editor.js'
import { loadExample } from './storage.js'
import { showError, hideError, deviceUpdate } from './events.js'
import { cfg, loadConfig } from './config.js'

// Entry point for the whole app
window.addEventListener('DOMContentLoaded', async () => {
  console.log('🚦 Initialising...')
  getGl(selector) // We call this early to make sure we have a GL context, but we don't need it yet
  hideError()

  loadConfig()

  console.dir(cfg)
  $('#version').innerText = `v${import.meta.env.PACKAGE_VERSION}`

  onClick('#exec', execPressed)

  onClick('#pause', pauseOrResume)

  onClick('#rewind', rewind)

  onClick('#load', () => {
    hideError()
    showDialog('#file-dialog')
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

    const devices = await audio.listInputDevices()
    if (devices === null) {
      disable('#audio-devices')
      $('#audio-devices').innerHTML = '<option>Input audio access denied</option>'
    } else {
      $('#audio-devices').innerHTML = '<option value="none">--- Select Device ---</option>'
      const activeDevice = audio.getActiveDevice()

      if (activeDevice) {
        enable('#audio-in-close')
      }

      for (const device of devices) {
        const option = document.createElement('option')
        option.text = device.label
        option.value = device.deviceId

        if (activeDevice && activeDevice.deviceId === device.deviceId) {
          option.selected = true
          disable('#audio-in-open')
        }

        $('#audio-devices').add(option)
      }

      onClick('#audio-in-open', async () => {
        const device = devices.find((d) => d.deviceId === $('#audio-devices').value)

        const smoothing = floatValue('#audio-smoothing')
        const gain = floatValue('#audio-gain')
        const output = $('#audio-output').checked

        await audio.initInput(device, output, smoothing, gain)
        deviceUpdate()
        closeDialog('#audio-dialog')
      })
    }

    showDialog('#audio-dialog')
  })

  onChange('#audio-devices', (e) => {
    if (e.target.selectedIndex === 0) {
      disable('#audio-in-open')
    } else {
      enable('#audio-in-open')
    }
  })

  onClick('#audio-in-close', async () => {
    audio.stopInput()
    closeDialog('#audio-dialog')
    disable('#audio-in-close')
    disable('#audio-in-open')
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
    closeDialog('#file-dialog')
  })

  onClick('#audio-cancel', () => {
    closeDialog('#audio-dialog')
  })

  // A file loader, fetches file from the public/samples folder
  $$('.file').forEach((fileEl) => {
    fileEl.addEventListener('click', async () => {
      try {
        const code = await loadExample(fileEl.dataset.file)
        editor.setValue(code)
        closeDialog('#file-dialog')
        rewind()
        execPressed()
      } catch (err) {
        closeDialog('#file-dialog')
        showError(err.message)
      }
    })
  })

  // Spacebar to pause or resume
  onKeyDownCode('#output', 'Space', pauseOrResume)

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

  onClick('#midi', async () => {
    hideError()

    const devices = await midi.listInputDevices()
    if (devices === null) {
      disable('#midi-devices')
      $('#midi-devices').innerHTML = '<option>MIDI access denied</option>'
    } else {
      $('#midi-devices').innerHTML = '<option value="none">--- Select Device ---</option>'
      const activeDeviceId = midi.getActiveDeviceId()

      showDialog('#midi-dialog')

      for (const device of devices) {
        const option = document.createElement('option')
        option.text = device.name
        option.value = device.id

        if (activeDeviceId && activeDeviceId === device.id) {
          option.selected = true
          disable('#midi-in-open')
        }

        $('#midi-devices').add(option)
      }

      onClick('#midi-in-open', async () => {
        const deviceId = $('#midi-devices').value
        await midi.initInput(deviceId)
        deviceUpdate()
        closeDialog('#midi-dialog')
      })
    }
  })

  onChange('#midi-devices', (e) => {
    if (e.target.selectedIndex === 0) {
      disable('#midi-in-open')
    } else {
      enable('#midi-in-open')
    }
  })

  onClick('#midi-cancel', () => {
    closeDialog('#midi-dialog')
  })

  onClick('#rec', async () => {
    const started = videoCapture($('#output'))
    if (started) {
      $('#rec').classList.add('recording')
    } else {
      $('#rec').classList.remove('recording')
    }
  })

  // get 'f' from the URL query string to force load a file
  const urlParams = new URLSearchParams(window.location.search)
  const fileLoad = urlParams.get('f')

  if (fileLoad) {
    window.history.replaceState({}, document.title, window.location.pathname)
  }

  // Initialise the Monaco text editor, and then run the shader when it's ready
  initEditor(execPressed, fileLoad)
})
