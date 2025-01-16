// ===============================================================================
// Noise and random textures
// ===============================================================================

import { createNoise2D, createNoise3D } from 'simplex-noise'
import { cfg } from './config'

const RAND_SIZE = cfg().RAND_SIZE
const NOISE_SIZE = cfg().NOISE_SIZE
const NOISE_SIZE_3D = cfg().NOISE_3D_SIZE

/**
 * Create the noise and random textures
 * @param {WebGL2RenderingContext} gl
 * @param {Object} twgl - The twgl.js library
 * @returns {{noiseTex: WebGLTexture, randomTex: WebGLTexture, noise3Tex: WebGLTexture}}
 */
export function createTextures(gl, twgl) {
  const noiseTex = twgl.createTexture(gl, {
    min: gl.LINEAR, // Use LINEAR for smoother noise
    mag: gl.LINEAR, // Use LINEAR for smoother noise
    src: simplex2Data(NOISE_SIZE),
    width: NOISE_SIZE,
    height: NOISE_SIZE,
    wrap: gl.REPEAT,
  })

  // Random RGB texture, used for pseudo random number generation
  const randData = new Uint8Array(RAND_SIZE * RAND_SIZE * 4)
  for (let i = 0; i < RAND_SIZE * RAND_SIZE * 4; i++) {
    randData[i] = Math.floor(Math.random() * 255)
  }

  const randomTex = twgl.createTexture(gl, {
    min: gl.NEAREST,
    mag: gl.NEAREST,
    src: randData,
    width: RAND_SIZE,
    height: RAND_SIZE,
    wrap: gl.REPEAT,
  })

  // 3D noise texture
  const noise3Tex = twgl.createTexture(gl, {
    min: gl.LINEAR, // Use LINEAR for smoother noise
    mag: gl.LINEAR, // Use LINEAR for smoother noise
    src: simplex3Data(NOISE_SIZE_3D),
    width: NOISE_SIZE_3D,
    height: NOISE_SIZE_3D,
    depth: NOISE_SIZE_3D,
    wrap: gl.REPEAT,
    target: gl.TEXTURE_3D, // ! Specify that this is a 3D texture
  })

  return { noiseTex, randomTex, noise3Tex }
}

/**
 * Create a Uint8Array of Simplex noise data
 * @param {number} size
 */
function simplex2Data(size) {
  // Maybe use a seed based PRNG here?
  const noise2D = createNoise2D(() => {
    return Math.random()
  })

  const noise = new Uint8Array(size * size * 4)
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      // Normalize to 0-1 and then scale to 0-255
      const value = (noise2D(x, y) * 0.5 + 0.5) * 255
      const index = (x + y * size) * 4

      noise[index + 0] = value
      noise[index + 1] = value
      noise[index + 2] = value
      noise[index + 3] = 255
    }
  }

  return noise
}

function simplex3Data(size) {
  // Maybe use a seed based PRNG here?
  const noise3D = createNoise3D(() => {
    return Math.random()
  })

  const noise = new Uint8Array(size * size * size * 4)
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        // Normalize to 0-1 and then scale to 0-255
        const value = (noise3D(x, y, z) * 0.5 + 0.5) * 255
        const index = (x + y * size + z * size * size) * 4

        noise[index + 0] = value
        noise[index + 1] = value
        noise[index + 2] = value
        noise[index + 3] = 255
      }
    }
  }

  return noise
}
