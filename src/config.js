// @ts-check
// ===============================================================================
// Configuration WIP
// There's no UI for this yet, so it's for very advanced users
// ===============================================================================

/**
 * @typedef {Object} Config
 * @property {number} RAND_SIZE
 * @property {number} NOISE_SIZE
 * @property {number} NOISE_3D_SIZE
 * @property {number} ANALYSER_FFT_SIZE
 * @property {number} STATE_SIZE
 */

/** @type {Config} */
let conf
const defaults = {
  RAND_SIZE: 512,
  NOISE_SIZE: 512,
  NOISE_3D_SIZE: 128,
  ANALYSER_FFT_SIZE: 1024,
  STATE_SIZE: 256,
}

export function loadConfig() {
  const storedCfg = localStorage.getItem('config')
  conf = storedCfg ? JSON.parse(storedCfg) : { ...defaults }
  localStorage.setItem('config', JSON.stringify(conf))
}

export function cfg() {
  if (!conf) {
    loadConfig()
  }

  return conf
}

// Not used
export function saveConfig() {
  localStorage.setItem('config', JSON.stringify(conf))
}
