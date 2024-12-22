import * as midi from '../lib/midi.js'

/** @type {string} */
let activeDeviceId

// 1D array of 16 channels * 128 notes
let channelNotes = new Array(16 * 128).fill(0)
let channelCC = new Array(16 * 128).fill(0)

/**
 * Initialize MIDI input for the given device ID
 * @param {string} deviceId
 */
export async function initInput(deviceId) {
  const device = midi.getInputDevice(deviceId)
  if (!device) {
    return
  }

  activeDeviceId = deviceId

  device.addEventListener('midimessage', messageHandler)
}

/**
 * Handle MIDI messages
 * @param {MIDIMessageEvent} rawMidiMsg
 * @returns {void}
 */
function messageHandler(rawMidiMsg) {
  let msg = midi.decodeMessage(rawMidiMsg)

  if (msg.type === 'Note on') {
    // Need to store in 1D array for GLSL, so we need to calculate the index, there are 16 channels
    channelNotes[msg.channel * 16 + msg.data1] = msg.data2
  }

  if (msg.type === 'Note off') {
    channelNotes[msg.channel * 16 + msg.data1] = 0
  }

  if (msg.type === 'Control change') {
    channelCC[msg.channel * 16 + msg.data1] = msg.data2
  }
}

/**
 * Return all 16 channels of notes each with 128 notes (0-127) and -1 if note is off
 * @returns {number[]}
 */
export function getNotes() {
  return channelNotes
}

/**
 * Return all 16 channels of CCs each with 128 CCs (0-127) and -1 if CC is off
 * @returns {number[]}
 */
export function getCC() {
  return channelCC
}

export function getActiveDeviceId() {
  return activeDeviceId
}

export async function listInputDevices() {
  const perms = await navigator.permissions.query({
    name: 'midi',
  })

  if (perms.state === 'prompt') {
    await navigator.requestMIDIAccess()
    window.location.reload()
  }

  if (perms.state === 'denied') {
    return null
  }

  // Calling this requests MIDI access
  await midi.getAccess()
  const devices = midi.getInputDevices()

  const deviceList = []
  devices.forEach((device) => {
    deviceList.push({
      id: device.id,
      name: device.name,
    })
  })

  return deviceList
}
