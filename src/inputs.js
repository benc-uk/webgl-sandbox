// ===============================================================================
// Keyboard and mouse inputs
// ===============================================================================

import * as twgl from 'twgl.js'
import Alpine from 'alpinejs'

const keys = new Uint8Array(256)

/**
 * Capture key down events
 * @param {KeyboardEvent} evt
 */
export function keyDownHandler(evt) {
  // Yeah, keyCode is deprecated, but I don't care
  keys[evt.keyCode] = 255
}

/**
 * Capture key up events
 * @param {KeyboardEvent} evt
 */
export function keyUpHandler(evt) {
  // Yeah, keyCode is deprecated, but I don't care
  keys[evt.keyCode] = 0
}

/**
 * Return keyboard state as a texture
 * @returns {WebGLTexture | null}
 * @param {WebGL2RenderingContext} gl - WebGL context
 */
export function getTexture(gl) {
  // Don't use RGBA as we just have one set of values, just a plain 1D array
  // So we use RED format with internal format R8
  return twgl.createTexture(gl, {
    min: gl.NEAREST,
    mag: gl.NEAREST,
    src: keys,
    width: 256,
    format: gl.RED,
    internalFormat: gl.R8,
    wrap: gl.CLAMP_TO_EDGE,
  })
}

/**
 * Return mouse data as an array
 * @returns {number[]}
 */
export function getMouseData() {
  return [Alpine.store('mouseX'), Alpine.store('mouseY'), Alpine.store('mouseBut')]
}
