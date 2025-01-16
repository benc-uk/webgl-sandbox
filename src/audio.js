// ===============================================================================
// Input audio processing and spectrum analysis
// ===============================================================================

import { cfg } from './config.js'

/** @type {AudioContext | null} */
let ctx

/** @type {MediaStreamAudioSourceNode | null} */
let inputSource

/** @type {AnalyserNode} */
let analyser

/** @type {MediaDeviceInfo | null} */
let activeDevice

/** @type {Uint8Array} */
let spectrumData

/**
 * Initialize the audio input
 * @param {MediaDeviceInfo} deviceInfo
 * @param {boolean} output
 * @param {number} smoothing
 * @param {number} gain
 * @returns
 */
export async function initInput(deviceInfo, output = false, smoothing = 0.5, gain = 1.0) {
  if (!deviceInfo) {
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
      deviceId: { exact: deviceInfo.deviceId },
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  })

  console.log('🎛️ Created stream for input device:', deviceInfo.label)

  // Create an audio source from the device media stream
  inputSource = ctx.createMediaStreamSource(stream)

  const gainNode = ctx.createGain()
  gainNode.gain.value = gain

  // Create an analyser node
  analyser = ctx.createAnalyser()
  analyser.fftSize = cfg().ANALYSER_FFT_SIZE
  analyser.smoothingTimeConstant = smoothing

  spectrumData = new Uint8Array(analyser.frequencyBinCount)

  console.log('🔬 Analyser created with FFT size', analyser.fftSize)

  // Connect the source to the analyser

  inputSource?.connect(gainNode)
  gainNode.connect(analyser)

  if (output) {
    // Connect the analyser to the output
    analyser.connect(ctx.destination)
  }

  activeDevice = deviceInfo
}

export function stopInput() {
  analyser.disconnect()
  inputSource?.disconnect()
  inputSource = null
  activeDevice = null
}

export function getActiveDevice() {
  return activeDevice
}

/**
 * List the available audio input devices
 * @returns {Promise<MediaDeviceInfo[] | null>}
 */
export async function listInputDevices() {
  const perms = await navigator.permissions.query({
    // @ts-ignore
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

  /** @type {MediaDeviceInfo[]} */
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

/**
 * Return analyser data as a texture
 * @returns {WebGLTexture | null}
 * @param {WebGL2RenderingContext} gl - WebGL context
 * @param {Object} twgl - The twgl.js library
 */
export function getTexture(gl, twgl) {
  if (!analyser) {
    return null
  }

  analyser.getByteFrequencyData(spectrumData)

  // Don't use RGBA as we just have one set of values, just a plain 1D array
  // So we use RED format with internal format R8
  return twgl.createTexture(gl, {
    min: gl.NEAREST,
    mag: gl.NEAREST,
    src: spectrumData,
    width: getBinCount(),
    format: gl.RED,
    internalFormat: gl.R8,
    wrap: gl.CLAMP_TO_EDGE,
  })
}

export function getBinCount() {
  if (!analyser) {
    return 0
  }

  return analyser.frequencyBinCount
}

/**
 * Create a fake device for use in the UI
 * @param {string} label
 * @returns {MediaDeviceInfo}
 */
export function fakeDevice(label) {
  return {
    label,
    deviceId: '-1',
    groupId: '-1',
    kind: 'audioinput',
    toJSON: () => {},
  }
}
