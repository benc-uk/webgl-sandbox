import '../css/style.css'
import '../lib/fontawesome/css/solid.css'
import '../lib/fontawesome/css/fontawesome.css'

import { getGl, resize } from '../lib/gl.js'
import { $, $$, onClick, hide, show, onKeyDownWithCode, onFullscreenChange, onChange } from '../lib/dom.js'
import { pause, runPressed, stop, hideError, showError } from './app.js'
import { initEditor, selector, editor, resizeEditor } from './editor.js'
import { getShaderText, loadSample } from './storage.js'
import { initAudio, listInputDevices } from './audio.js'

// Entry point for the whole app
window.addEventListener('DOMContentLoaded', async () => {
  console.log('🚦 Initialising...')
  getGl(selector) // We call this early to make sure we have a GL context, but we don't need it yet
  getShaderText() // Load the shader text from local storage
  hideError()

  show('#audio-dialog')

  const devices = await listInputDevices()
  if (devices === null) {
    $('#audio-devices').disabled = true
    $('#audio-devices').innerHTML = '<option>Input audio access denied</option>'
  } else {
    for (const device of devices) {
      const option = document.createElement('option')
      option.text = device.label
      option.value = device.deviceId
      $('#audio-devices').add(option)
    }

    onClick('#audio-in-open', async () => {
      const deviceId = $('#audio-devices').value
      const smoothing = parseFloat($('#audio-smoothing').value)
      const gain = parseFloat($('#audio-gain').value)
      const output = $('#audio-output').checked

      await initAudio(deviceId, output, smoothing, gain)
      hide('#audio-dialog')
    })
  }

  onClick('#run', runPressed)

  onClick('#stop', stop)

  onClick('#pause', pause)

  onClick('#load', () => {
    hideError()
    show('#file-dialog')
  })

  onClick('#fullscreen', () => {
    $('#output').requestFullscreen()
    setTimeout(() => {
      resize()
      resizeEditor()
    }, 200)
  })

  onClick('#audio', () => {
    hideError()
    show('#audio-dialog')
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

  $$('.file').forEach((fileEl) => {
    // A file loader, fetches file from the public/samples folder
    fileEl.addEventListener('click', async () => {
      try {
        const shaderText = await loadSample(fileEl.dataset.file)
        editor.setValue(shaderText)
        hide('#file-dialog')
        //$('#run').click()
        runPressed()
      } catch (err) {
        hide('#file-dialog')
        showError(err.message)
      }
    })
  })

  onKeyDownWithCode('#output', 'Space', pause)

  // Initialise the Monaco text editor, and then run the shader when it's ready
  initEditor(runPressed)

  initAudio()
})
