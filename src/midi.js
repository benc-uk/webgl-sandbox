// ===============================================================================
// MIDI input handling and wrapper around the Web MIDI API library in lib/midi.js
// ===============================================================================

import * as midi from '../lib/midi.js'

/** @type {string} */
let activeDeviceId

// MIDI is fixed to 16 channels * 128 notes or CC values
const CHANNELS = 16
const NOTES = 128

// Array of 16 channels * 128 notes * 4 values RGBA
// Will be used as a texture
const midiData = new Uint8Array(NOTES * CHANNELS * 4)

/**
 * Initialize MIDI input for the given device ID
 * @param {string} deviceId
 */
export async function initInput(deviceId) {
  console.log('🥁 Opening MIDI device:', deviceId)

  const device = midi.getInputDevice(deviceId)
  if (!device) {
    return
  }

  activeDeviceId = deviceId
  midiData.fill(0)
  device.addEventListener('midimessage', messageHandler)
}

/**
 * Handle MIDI messages
 * @param {MIDIMessageEvent} rawMidiMsg
 * @returns {void}
 */
function messageHandler(rawMidiMsg) {
  const msg = midi.decodeMessage(rawMidiMsg)

  // Need to store in 1D array for GLSL
  const offset = msg.channel * NOTES * 4 + msg.data1 * 4

  // Note on and off messages go in the red channel
  if (msg.type === 'Note on' || msg.type === 'Note off') {
    // Need to double the value from 0-127 to 0-255
    let velo = msg.data2 * 2
    if (msg.type === 'Note off') {
      velo = 0
    }

    // Red
    midiData[offset + 0] = velo
  }

  // Control change messages go in the green channel
  if (msg.type === 'Control change') {
    // Green, also need to double the value to go from 0-127 to 0-255
    midiData[offset + 1] = msg.data2 * 2
  }
}

/**
 * Return both note and control change data as a texture
 * @returns {WebGLTexture}
 * @param {WebGLRenderingContext} gl -
 * @param {Object} twgl - The twgl.js library
 */
export function getTexture(gl, twgl) {
  return twgl.createTexture(gl, {
    min: gl.NEAREST,
    mag: gl.NEAREST,
    src: midiData,
    width: NOTES,
    height: CHANNELS,
    wrap: gl.CLAMP_TO_EDGE,
  })
}

export function getActiveDeviceId() {
  return activeDeviceId
}

export function getActiveDeviceName() {
  if (!activeDeviceId) {
    return null
  }

  return midi.getInputDevice(activeDeviceId).name
}

export async function listInputDevices() {
  // Check if MIDI access is allowed
  const perms = await navigator.permissions.query({
    name: 'midi',
  })

  // If MIDI access is not allowed, request it and reload the page
  if (perms.state === 'prompt') {
    await navigator.requestMIDIAccess()
    window.location.reload()
  }

  // Well sheeeit, MIDI access is denied, not much we can do here
  if (perms.state === 'denied') {
    return null
  }

  // Calling this requests MIDI access
  await midi.getAccess()
  const devices = midi.getInputDevices()

  /**
   * @typedef {Object} Device
   * @property {string} id - The device ID used to reference the device
   * @property {string} name - The device name
   */

  /** @type {Device[]}*/
  const deviceList = []
  devices.forEach((device) => {
    deviceList.push({
      id: device.id,
      name: device.name,
    })
  })

  return deviceList
}
