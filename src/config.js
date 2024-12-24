// ===============================================================================
// Configuration WIP
// ===============================================================================

/**
 * @typedef {Object} Config
 * @property {number} RAND_SIZE
 * @property {number} NOISE_SIZE
 * @property {number} NOISE_3D_SIZE
 */

/** @type {Config} */
let conf

export function loadConfig() {
  const cfgString = localStorage.getItem('cfg')
  conf = cfgString
    ? JSON.parse(cfgString)
    : {
        RAND_SIZE: 512,
        NOISE_SIZE: 512,
        NOISE_3D_SIZE: 128,
      }

  localStorage.setItem('cfg', JSON.stringify(conf))
}

export function cfg() {
  if (!conf) {
    loadConfig()
  }

  return conf
}
