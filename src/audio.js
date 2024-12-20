let ctx
let inputSource
let analyser

// Warning changing this value will require changing the shader boilerplate
export const ANALYSER_BUFFER_SIZE = 512
const FFT_SIZE = 1024

export async function initAudio(deviceId, output = false, smoothing = 0.5, gain = 1.0) {
  if (!deviceId) {
    return
  }

  if (inputSource) {
    inputSource.disconnect()
  }

  // Start or create the audio context
  if (ctx && ctx.state === 'suspended') {
    await ctx.resume()
  } else {
    ctx = new window.AudioContext()
  }

  console.log('🎙️ Requesting audio device:', deviceId)
  console.log(`🎛️ Settings: output=${output}, smoothing=${smoothing}, gain=${gain}`)

  // Get the audio stream from the selected device
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: { exact: deviceId },
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  })

  console.log('🔊 Got media stream:', stream.id)

  // Create an audio source from the device media stream
  inputSource = ctx.createMediaStreamSource(stream)

  const gainNode = ctx.createGain()
  gainNode.gain.value = gain

  // Create an analyser node
  analyser = ctx.createAnalyser()
  analyser.fftSize = FFT_SIZE
  analyser.smoothingTimeConstant = smoothing

  // Connect the source to the analyser
  inputSource.connect(gainNode)
  gainNode.connect(analyser)

  if (output) {
    // Connect the analyser to the output
    analyser.connect(ctx.destination)
  }
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
