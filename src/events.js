// ===============================================================================
// UI status & state updates
// ===============================================================================

import { $, hide, setHtml, setText, show } from '../lib/dom.js'
import { getActiveDevice } from './audio.js'
import { getActiveDeviceName } from './midi.js'

export function statusUpdate(paused, stream) {
  const status = paused ? 'Paused' : 'Running'
  let statusText = `<b>Status:</b> ${status}`

  if (stream) {
    statusText = 'Capturing video...'
  }

  setHtml('#status', statusText)
  $('#pause').innerHTML = !paused ? '<i class="fa-fw fa-solid fa-pause"></i>' : '<i class="fa-fw fa-solid fa-play"></i>'
}

export function deviceUpdate() {
  if (getActiveDevice()) {
    $('#deviceAudio').innerHTML = `<b>Audio:</b> ${getActiveDevice().label}`
  }

  if (getActiveDeviceName()) {
    $('#deviceMIDI').innerHTML = `<b>MIDI:</b> ${getActiveDeviceName()}`
  }
}

export function renderUpdate(fps, elapsedTime) {
  setHtml('#renderStatus', `&nbsp;&nbsp;<b>FPS:</b> ${fps.toFixed(1)}<br><b>Time:</b> ${elapsedTime.toFixed(1)}`)
}

export function hideError() {
  hide('#error')
}

export function showError(message) {
  setText('#error', message)
  show('#error')
}
