import { createNoise2D } from 'simplex-noise'

const RAND_SIZE = 256
const NOISE_SIZE = 256

export function createNoiseRand(gl, twgl) {
  const noiseTex = twgl.createTexture(gl, {
    min: gl.LINEAR,
    mag: gl.LINEAR,
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

  return { noiseTex, randomTex }
}

// Create a Uint8Array of rgb values for a simplex noise texture
function simplex2Data(size) {
  // Maybe use a seed based PRNG here?
  const noise2D = createNoise2D(() => {
    return Math.random()
  })

  const noise = new Uint8Array(size * size * 4)
  for (let i = 0; i < size * size; i++) {
    const x = i % size
    const y = Math.floor(i / size)

    // Value is in range -1 to 1
    let value = noise2D(x, y)
    value = value * 0.5 + 0.5 // Scale to 0 to 1

    // Create monochrome noise
    const color = Math.floor(value * 255)
    noise[i * 4] = color
    noise[i * 4 + 1] = color
    noise[i * 4 + 2] = color
    noise[i * 4 + 3] = 255
  }
  return noise
}
