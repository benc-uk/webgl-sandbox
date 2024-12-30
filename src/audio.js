// ===============================================================================
// Input audio processing and spectrum analysis
// ===============================================================================

import { cfg } from './config'

let ctx

/** @type {MediaStreamAudioSourceNode} */
let inputSource

/** @type {AnalyserNode} */
let analyser

/** @type {MediaDeviceInfo} */
let activeDevice

/**
 * Initialize the audio input
 * @param {MediaDeviceInfo} device
 * @param {boolean} output
 * @param {number} smoothing
 * @param {number} gain
 * @returns
 */
export async function initInput(device, output = false, smoothing = 0.5, gain = 1.0) {
  if (!device) {
    return
  }

  // Start or create the audio context
  if (ctx && ctx.state === 'suspended') {
    await ctx.resume()
  } else {
    ctx = new window.AudioContext()
  }

  if (inputSource) {
    analyser.disconnect()
    inputSource.disconnect()
    inputSource = null
  }

  /** @type {MediaStream} */
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: { exact: device.deviceId },
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  })

  console.log('🎛️ Created stream for input device:', device.label)

  // Create an audio source from the device media stream
  inputSource = ctx.createMediaStreamSource(stream)

  const gainNode = ctx.createGain()
  gainNode.gain.value = gain

  // Create an analyser node
  analyser = ctx.createAnalyser()
  analyser.fftSize = cfg().ANALYSER_FFT_SIZE
  analyser.smoothingTimeConstant = smoothing

  console.log('🔬 Analyser created with FFT size', analyser.fftSize)

  // Connect the source to the analyser
  inputSource.connect(gainNode)
  gainNode.connect(analyser)

  if (output) {
    // Connect the analyser to the output
    analyser.connect(ctx.destination)
  }

  activeDevice = device
}

export function stopInput() {
  analyser.disconnect()
  inputSource.disconnect()
  inputSource = null
  activeDevice = null
}

export function getActiveDevice() {
  return activeDevice
}

export function getAnalyser() {
  return analyser
}

export async function listInputDevices() {
  const perms = await navigator.permissions.query({
    name: 'microphone',
  })

  if (perms.state === 'prompt') {
    navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then(() => {
      window.location.reload()
    })
  }

  if (perms.state === 'denied') {
    return null
  }

  const deviceArray = []
  const devices = await navigator.mediaDevices.enumerateDevices()

  devices.forEach((device) => {
    if (device.kind === 'audioinput') {
      if (device.deviceId === 'default' || device.deviceId === 'communications') {
        return
      }

      deviceArray.push(device)
    }
  })

  // Sort by groupId and then by label
  deviceArray.sort((a, b) => {
    if (a.groupId < b.groupId) {
      return -1
    } else if (a.groupId > b.groupId) {
      return 1
    } else {
      return a.label.localeCompare(b.label)
    }
  })

  return deviceArray
}
