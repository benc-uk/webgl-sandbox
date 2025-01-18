// @ts-nocheck
// ===============================================================================
// Library for MIDI access and message sending and many other MIDI related things
// ===============================================================================

/**
 * @typedef {Object} DecodedMidiMessage
 * @property {Date} timestamp - The timestamp of the message
 * @property {string} type - The type of the message
 * @property {number} channel - The channel of the message
 * @property {number} command - The command of the message
 * @property {number} data1 - The first data byte of the message
 * @property {number} data2 - The second data byte of the message
 * @property {boolean} isSystem - Whether the message is a system message
 */

/** @type {MIDIAccess} */
let access
let logLevel = 3

export const MSG_STATUS_SYSTEM = 15

// System common messages
export const MSG_SYSEX_START = 0x0
export const MSG_MTC = 0x1
export const MSG_SONG_POSITION = 0x2
export const MSG_SONG_SELECT = 0x3
export const MSG_TUNE_REQUEST = 0x6
export const MSG_SYSEX_END = 0x7

// System real time
export const MSG_CLOCK = 0x8
export const MSG_START = 0xa
export const MSG_CONTINUE = 0xb
export const MSG_STOP = 0xc
export const MSG_ACTIVE_SENSE = 0xe
export const MSG_RESET = 0xf

// Channel voice messages, with data values
export const MSG_NOTE_OFF = 0x8
export const MSG_NOTE_ON = 0x9
export const MSG_POLY_AFTERTOUCH = 0xa
export const MSG_CONTROL_CHANGE = 0xb
export const MSG_PROG_CHANGE = 0xc
export const MSG_CHAN_AFTERTOUCH = 0xd
export const MSG_PITCH_BEND = 0xe

// Used internally in output messages
const MSG_OUT_CONTROL_CHANGE = 0xb0
const MSG_OUT_PROG_CHANGE = 0xc0
const MSG_OUT_NOTE_ON = 0x90
const MSG_OUT_NOTE_OFF = 0x80
const MSG_OUT_SYSTEM = 0xf0

// Special MIDI CC numbers used for bank and NRPN messages
const CC_BANK_SELECT_MSB = 0
const CC_BANK_SELECT_LSB = 32
const CC_DATA_ENTRY_LSB = 38
const CC_NRPM_LSB = 98
const CC_NRPM_MSB = 99
const CC_DATA_ENTRY_MSB = 6

// ===============================================================================
// Attempt to get MIDI access and hold it globally
// ===============================================================================
export async function getAccess(stateChangeCallback, midiOptions) {
  try {
    if (!access) {
      access = await navigator.requestMIDIAccess(midiOptions)
    }

    if (stateChangeCallback) access.onstatechange = () => stateChangeCallback()

    log(LOG_LEVEL.INFO, 'MIDI getAccess succeeded,', access.outputs.size, 'outputs and', access.inputs.size, 'inputs')

    return access
  } catch (err) {
    log(LOG_LEVEL.ERROR, 'MIDI getAccess failed', err)
  }
}

// ===============================================================================
// Direct access to MIDI access inputs map https://tinyurl.com/394y49b8
// ===============================================================================
export function getInputDevices() {
  if (!access) {
    log(LOG_LEVEL.ERROR, 'MIDI getInputDevices failed: no access')
    return null
  }

  return access.inputs
}

// ===============================================================================
// Direct access to MIDI access outputs map https://tinyurl.com/394y49b8
// ===============================================================================
export function getOutputDevices() {
  if (!access) {
    log(LOG_LEVEL.ERROR, 'MIDI getOutputDevices failed: no access')
    return null
  }

  return access.outputs
}

// ===============================================================================
// Helper to get MIDI output device by id
// ===============================================================================
export function getOutputDevice(deviceId) {
  if (!access) {
    log(LOG_LEVEL.ERROR, 'MIDI access not available')
    return null
  }

  if (!deviceId) {
    return null
  }

  if (!access.outputs.get(deviceId)) {
    log(LOG_LEVEL.WARN, `MIDI output device ${deviceId} not available`)
    return null
  }

  return access.outputs.get(deviceId)
}

// ===============================================================================
// Helper to get MIDI input device by id
// ===============================================================================
export function getInputDevice(deviceId) {
  if (!access) {
    log(LOG_LEVEL.ERROR, 'MIDI access not available')
    return null
  }

  if (!deviceId) {
    return null
  }

  if (!access.inputs.get(deviceId)) {
    log(LOG_LEVEL.WARN, `MIDI input device ${deviceId} not available`)
    return null
  }

  return access.inputs.get(deviceId)
}

/**
 * Tries to decode a MIDI message into a standard object
 * @param {MIDIMessageEvent} msg - The MIDI message to decode from midimessage event hander
 * @returns {DecodedMidiMessage} - The decoded MIDI message
 */
export function decodeMessage(msg) {
  /** @type {DecodedMidiMessage} */
  const output = {
    timestamp: new Date(),
    type: '',
    channel: 0,
    command: null,
    data1: null,
    data2: null,
    isSystem: false,
  }

  const status = byteToNibbles(msg.data[0])
  output.command = status[0]
  output.channel = status[1]

  // System common messages (clock, stop, start, etc)
  // Note. Here the channel nibble actually denotes message *sub-type* NOT the channel, as these messages are global
  if (output.command == MSG_STATUS_SYSTEM) {
    output.isSystem = true

    switch (output.channel) {
      // Common
      case MSG_SYSEX_START:
        output.type = 'SysEx start'
        break
      case MSG_MTC:
        output.type = 'MTC'
        break
      case MSG_SONG_POSITION:
        output.type = 'Song position'
        output.data1 = msg.data[1]
        output.data2 = msg.data[2]
        break
      case MSG_SONG_SELECT:
        output.type = 'Song select'
        break
      case MSG_TUNE_REQUEST:
        output.type = 'Tune request'
        break
      case MSG_SYSEX_END:
        output.type = 'SysEx end'
        break
      // Real time
      case MSG_CLOCK:
        output.type = 'Clock'
        break
      case MSG_START:
        output.type = 'Start'
        break
      case MSG_CONTINUE:
        output.type = 'Continue'
        break
      case MSG_STOP:
        output.type = 'Stop'
        break
      case MSG_ACTIVE_SENSE:
        output.type = 'Active sense'
        break
      case MSG_RESET:
        output.type = 'Reset'
        break
    }

    return output
  }

  switch (output.command) {
    case MSG_NOTE_ON:
      output.type = 'Note on'
      break
    case MSG_NOTE_OFF:
      output.type = 'Note off'
      break
    case MSG_CONTROL_CHANGE:
      output.type = 'Control change'
      break
    case MSG_PROG_CHANGE:
      output.type = 'Program change'
      break
    case MSG_CHAN_AFTERTOUCH:
      output.type = 'Channel aftertouch'
      break
    case MSG_PITCH_BEND:
      output.type = 'Pitch bend'
      break
    case MSG_POLY_AFTERTOUCH:
      output.type = 'Poly aftertouch'
      break
  }

  output.data1 = msg.data[1]
  output.data2 = msg.data[2]

  return output
}

// ===============================================================================
// Send a single note on message
// ===============================================================================
export function sendNoteOnMessage(deviceId, channel, noteNum, velocity) {
  if (!validMessageParameters(channel, noteNum, velocity)) return

  const device = getOutputDevice(deviceId)
  if (device) {
    device.send([MSG_OUT_NOTE_ON | channel, noteNum, velocity])
    log(LOG_LEVEL.DEBUG, `Sent note on message: ${noteNumberToName(noteNum)} (${noteNum}) on channel: ${channel}`)
  }
}

// ===============================================================================
// Send a single note off message
// ===============================================================================
export function sendNoteOffMessage(deviceId, channel, noteNum) {
  if (!validMessageParameters(channel, noteNum)) return

  const device = getOutputDevice(deviceId)
  if (device) {
    device.send([MSG_OUT_NOTE_OFF | channel, noteNum, 0])
    log(LOG_LEVEL.DEBUG, `Sent note off message: ${noteNumberToName(noteNum)} (${noteNum}) on channel: ${channel}`)
  }
}

// ===============================================================================
// Send system message like clock or transport
// ===============================================================================
export function sendSystemMessage(deviceId, subType) {
  if (subType < 0 || subType > 15) {
    log(LOG_LEVEL.WARN, `Invalid MIDI system message subtype: ${subType} (should be 0 - 15)`)
    return
  }

  const device = getOutputDevice(deviceId)
  if (device) {
    device.send([MSG_OUT_SYSTEM | subType])
  }
}

// ===============================================================================
// Send a single controller change message
// ===============================================================================
export function sendCCMessage(deviceId, channel, cc, value) {
  if (!validMessageParameters(channel, cc, value)) return

  const device = getOutputDevice(deviceId)
  if (device) {
    device.send([MSG_OUT_CONTROL_CHANGE | channel, cc, value])
    log(LOG_LEVEL.DEBUG, `Sent CC message: ${ccNumberToName(cc)} (${cc}) value: ${value} on channel: ${channel}`)
  }
}

// ===============================================================================
// Send a NPRM with 3 or 4 MIDI messages
// ===============================================================================
export function sendNRPNMessage(deviceId, channel, numMsb, numLsb, valueMsb, valueLsb) {
  if (!validMessageParameters(channel, numMsb, numLsb, valueMsb)) return

  const device = getOutputDevice(deviceId)
  if (device) {
    sendCCMessage(deviceId, channel, CC_NRPM_LSB, numMsb)
    sendCCMessage(deviceId, channel, CC_NRPM_MSB, numLsb)
    sendCCMessage(deviceId, channel, CC_DATA_ENTRY_MSB, valueMsb)

    if (valueLsb >= 0) {
      sendCCMessage(deviceId, channel, CC_DATA_ENTRY_LSB, valueLsb)
    }
  }
}

// =================================================================================
// Send program change
// =================================================================================
export function sendPCMessage(deviceId, channel, value) {
  if (!validMessageParameters(channel, value)) return

  const device = getOutputDevice(deviceId)
  if (device) {
    device.send([MSG_OUT_PROG_CHANGE | channel, value])
  }
}

// =================================================================================
// Send bank change
// =================================================================================
export function sendBankMessage(deviceId, channel, msb, lsb) {
  if (!validMessageParameters(channel, msb, lsb)) return

  const device = getOutputDevice(deviceId)
  if (device) {
    sendCCMessage(deviceId, channel, CC_BANK_SELECT_MSB, msb)
    sendCCMessage(deviceId, channel, CC_BANK_SELECT_LSB, lsb)
  }
}

// =================================================================================
// Convert a two part (MSB, LSB) num to a 14 bit value
// =================================================================================
export function bytePairtoNumber(msb, lsb) {
  return (msb << 7) + lsb
}

// =================================================================================
// Convert MIDI CC number to a name
// =================================================================================
export function ccNumberToName(number) {
  const name = ccList[number]
  if (name) {
    return name
  }

  return 'Undefined'
}

// =================================================================================
// Helper to map a MIDI note number to a human readable name
// =================================================================================
export function noteNumberToName(number) {
  switch (number) {
    case 0:
      return 'C-2'
    case 1:
      return 'C#-2'
    case 2:
      return 'D-2'
    case 3:
      return 'D#-2'
    case 4:
      return 'E-2'
    case 5:
      return 'F-2'
    case 6:
      return 'F#-2'
    case 7:
      return 'G-2'
    case 8:
      return 'G#-2'
    case 9:
      return 'A-2'
    case 10:
      return 'A#-2'
    case 11:
      return 'B-2'
    case 12:
      return 'C-1'
    case 13:
      return 'C#-1'
    case 14:
      return 'D-1'
    case 15:
      return 'D#-1'
    case 16:
      return 'E-1'
    case 17:
      return 'F-1'
    case 18:
      return 'F#-1'
    case 19:
      return 'G-1'
    case 20:
      return 'G#-1'
    case 21:
      return 'A-1'
    case 22:
      return 'A#-1'
    case 23:
      return 'B-1'
    case 24:
      return 'C0'
    case 25:
      return 'C#0'
    case 26:
      return 'D0'
    case 27:
      return 'D#0'
    case 28:
      return 'E0'
    case 29:
      return 'F0'
    case 30:
      return 'F#0'
    case 31:
      return 'G0'
    case 32:
      return 'G#0'
    case 33:
      return 'A0'
    case 34:
      return 'A#0'
    case 35:
      return 'B0'
    case 36:
      return 'C1'
    case 37:
      return 'C#1'
    case 38:
      return 'D1'
    case 39:
      return 'D#1'
    case 40:
      return 'E1'
    case 41:
      return 'F1'
    case 42:
      return 'F#1'
    case 43:
      return 'G1'
    case 44:
      return 'G#1'
    case 45:
      return 'A1'
    case 46:
      return 'A#1'
    case 47:
      return 'B1'
    case 48:
      return 'C2'
    case 49:
      return 'C#2'
    case 50:
      return 'D2'
    case 51:
      return 'D#2'
    case 52:
      return 'E2'
    case 53:
      return 'F2'
    case 54:
      return 'F#2'
    case 55:
      return 'G2'
    case 56:
      return 'G#2'
    case 57:
      return 'A2'
    case 58:
      return 'A#2'
    case 59:
      return 'B2'
    case 60:
      return 'C3'
    case 61:
      return 'C#3'
    case 62:
      return 'D3'
    case 63:
      return 'D#3'
    case 64:
      return 'E3'
    case 65:
      return 'F3'
    case 66:
      return 'F#3'
    case 67:
      return 'G3'
    case 68:
      return 'G#3'
    case 69:
      return 'A3'
    case 70:
      return 'A#3'
    case 71:
      return 'B3'
    case 72:
      return 'C4'
    case 73:
      return 'C#4'
    case 74:
      return 'D4'
    case 75:
      return 'D#4'
    case 76:
      return 'E4'
    case 77:
      return 'F4'
    case 78:
      return 'F#4'
    case 79:
      return 'G4'
    case 80:
      return 'G#4'
    case 81:
      return 'A4'
    case 82:
      return 'A#4'
    case 83:
      return 'B4'
    case 84:
      return 'C5'
    case 85:
      return 'C#5'
    case 86:
      return 'D5'
    case 87:
      return 'D#5'
    case 88:
      return 'E5'
    case 89:
      return 'F5'
    case 90:
      return 'F#5'
    case 91:
      return 'G5'
    case 92:
      return 'G#5'
    case 93:
      return 'A5'
    case 94:
      return 'A#5'
    case 95:
      return 'B5'
    case 96:
      return 'C6'
    case 97:
      return 'C#6'
    case 98:
      return 'D6'
    case 99:
      return 'D#6'
    case 100:
      return 'E6'
    case 101:
      return 'F6'
    case 102:
      return 'F#6'
    case 103:
      return 'G6'
    case 104:
      return 'G#6'
    case 105:
      return 'A6'
    case 106:
      return 'A#6'
    case 107:
      return 'B6'
    case 108:
      return 'C7'
    case 109:
      return 'C#7'
    case 110:
      return 'D7'
    case 111:
      return 'D#7'
    case 112:
      return 'E7'
    case 113:
      return 'F7'
    case 114:
      return 'F#7'
    case 115:
      return 'G7'
    case 116:
      return 'G#7'
    case 117:
      return 'A7'
    case 118:
      return 'A#7'
    case 119:
      return 'B7'
    case 120:
      return 'C8'
    case 121:
      return 'C#8'
    case 122:
      return 'D8'
    case 123:
      return 'D#8'
    case 124:
      return 'E8'
    case 125:
      return 'F8'
    case 126:
      return 'F#8'
    case 127:
      return 'G8'
    default:
      return 'Unknown'
  }
}

// =================================================================================
// Map of MIDI CC names, this is the most official/complete list I could find
// =================================================================================
export const ccList = {
  0: 'Bank Select MSB',
  1: 'Modulation Wheel',
  2: 'Breath Controller',
  4: 'Foot Controller',
  5: 'Portamento Time',
  6: 'Data Entry',
  7: 'Channel Volume',
  8: 'Balance',
  10: 'Pan Position',
  11: 'Expression Controller',
  12: 'Effect Control 1',
  13: 'Effect Control 2',
  16: 'General Purpose 1',
  17: 'General Purpose 2',
  18: 'General Purpose 3',
  19: 'General Purpose 4',
  32: 'Bank Select LSB',
  64: 'Sustain Pedal',
  65: 'Portamento',
  66: 'Sostenuto',
  67: 'Soft Pedal',
  68: 'Legato Footswitch',
  69: 'Hold 2',
  70: 'Sound 1 (Variation)',
  71: 'Sound 2 (Resonance)',
  72: 'Sound 3 (Release)',
  73: 'Sound 4 (Attack)',
  74: 'Sound 5 (Cutoff)',
  75: 'Sound 6',
  76: 'Sound 7',
  77: 'Sound 8',
  78: 'Sound 9',
  79: 'Sound 10',
  80: 'General Purpose 5',
  81: 'General Purpose 6',
  82: 'General Purpose 7',
  83: 'General Purpose 8',
  84: 'Portamento Control',
  91: 'Effects 1 (Reverb)',
  92: 'Effects 2 (Tremolo)',
  93: 'Effects 3 (Chorus)',
  94: 'Effects 4 (Celeste)',
  95: 'Effects 5 (Phaser)',
  96: 'Data Increment',
  97: 'Data Decrement',
  98: 'NRPN LSB',
  99: 'NRPN MSB',
  100: 'RPN LSB',
  101: 'RPN MSB',
  120: 'All Sound Off',
  121: 'All Controllers Off',
  122: 'Local Keyboard',
  123: 'All Notes Off',
  124: 'Omni Mode Off',
  125: 'Omni Mode On',
  126: 'Mono Operation',
  127: 'Poly Operation',
}

// ---------------- LOGGING --------------------------------------------------------

export const LOG_LEVEL = {
  NONE: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4,
}

export function setLogLevel(level) {
  if (level < 0 || level > 4) {
    console.warn(`Invalid log level: ${level} (should be 0 - 4)`)
    return
  }

  logLevel = level
}

function log(level, ...args) {
  if (level <= logLevel) {
    if (level === LOG_LEVEL.ERROR) {
      console.error(...args)
    } else if (level === LOG_LEVEL.WARN) {
      console.warn(...args)
    } else {
      console.log(...args)
    }
  }
}

// ---------------- PRIVATE -------------------------------------------------------

// ================================================================================
// Internal helper to try to validate parameters
// ================================================================================
function validMessageParameters(channel, ...inputs) {
  const chanNum = parseInt(channel)
  if (isNaN(chanNum)) {
    log(LOG_LEVEL.WARN, 'MIDI channel must be a number:', channel)
    return false
  }

  if (channel > 15 || channel < 0) {
    log(LOG_LEVEL.WARN, 'Invalid MIDI channel number:', channel)
    return false
  }

  for (const input of inputs) {
    if (input < 0 || input > 127) {
      log(LOG_LEVEL.WARN, 'Number out of range for MIDI message:', input)
      return false
    }
  }

  return true
}

// =================================================================================
// Helper to split a byte into two nibbles
// =================================================================================
function byteToNibbles(byte) {
  const high = byte & 0xf
  const low = byte >> 4
  return [low, high]
}
