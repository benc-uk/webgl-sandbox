import '../css/style.css'
import '../lib/fontawesome/css/solid.css'
import '../lib/fontawesome/css/fontawesome.css'

import { getGl, resize } from '../lib/gl.js'
import { $, $$, onClick, hide, show, onKeyDownWithCode, onFullscreenChange } from '../lib/dom.js'
import { pause, runPressed, stop, hideError, showError } from './app.js'
import { initEditor, selector, editor, resizeEditor } from './editor.js'
import { loadSample } from './storage.js'

// Entry point for the whole app
window.addEventListener('DOMContentLoaded', async () => {
  console.log('🚦 Initialising...')
  getGl(selector) // We call this early to make sure we have a GL context, but we don't need it yet
  hideError()

  onClick('#fullscreen', () => {
    $('#output').requestFullscreen()
    setTimeout(() => {
      resize()
      resizeEditor()
    }, 200)
  })

  onFullscreenChange('#output', () => {
    resize()
    resizeEditor()
  })

  window.addEventListener('resize', () => {
    resize()
    resizeEditor()
  })

  onClick('#load-cancel', () => {
    hide('#file-sel')
  })

  onClick('#load', () => {
    hideError()
    show('#file-sel')
  })

  onClick('#stop', stop)

  onClick('#pause', pause)

  onClick('#run', runPressed)

  $$('.file').forEach((fileEl) => {
    // A file loader, fetches file from the public/samples folder
    fileEl.addEventListener('click', async () => {
      try {
        const shaderText = await loadSample(fileEl.dataset.file)
        editor.setValue(shaderText)
        hide('#file-sel')
        $('#run').click()
      } catch (err) {
        hide('#file-sel')
        showError(err.message)
      }
    })
  })

  onKeyDownWithCode('#output', 'Space', pause)

  // Initialise the Monaco text editor
  initEditor()

  // Resize everything & start the shader
  setTimeout(() => {
    runPressed()
  }, 200)

  // TEMP CODE HERE
  // const ctx = new AudioContext()
  // let wavSource
  // let audioData

  // // let started = false
  // fetch('sample.wav')
  //   .then((response) => response.arrayBuffer())
  //   .then((arrayBuffer) => ctx.decodeAudioData(arrayBuffer))
  //   .then((decodedAudio) => {
  //     audioData = decodedAudio
  //   })

  // $('#temp').addEventListener('click', () => {
  //   if (wavSource) {
  //     wavSource.stop()
  //     wavSource = null
  //     return
  //   }

  //   wavSource = ctx.createBufferSource()
  //   wavSource.buffer = audioData

  //   const gainNode = ctx.createGain()
  //   gainNode.gain.value = 0.5

  //   const analyserNode = ctx.createAnalyser()
  //   analyserNode.fftSize = 128

  //   const bufferLength = analyserNode.frequencyBinCount
  //   const dataArray = new Uint8Array(bufferLength)
  //   analyserNode.getByteTimeDomainData(dataArray)

  //   console.log(bufferLength)

  //   for (let i = 0; i < bufferLength; i++) {
  //     const v = dataArray[i]
  //     console.log(v)
  //   }

  //   wavSource.connect(gainNode)
  //   gainNode.connect(analyserNode)
  //   analyserNode.connect(ctx.destination)

  //   wavSource.start()
  // })
})
