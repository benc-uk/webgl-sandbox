// ===== gl.ts ==========================================================
// Interactions with the GL context, as a global singleton
// Ben Coleman, 2023
// ======================================================================

// Memoized global WebGL2 context
let glContext

/**
 * Get the WebGL2 context, if it doesn't exist it will be created for the provided canvas element, and memoized
 * @returns {WebGL2RenderingContext} - Global WebGL2 context
 * @param {boolean} aa - Enable antialiasing
 * @param {string} selector - CSS selector for locating the canvas element
 */
export function getGl(selector = 'canvas', aa = true) {
  if (glContext) {
    return glContext
  }

  console.info(`🖌️ Creating new WebGL2 context for '${selector}'`)

  const canvasElement = document.querySelector(selector)
  if (!canvasElement) {
    console.error(`💥 FATAL! Unable to find element with selector: '${selector}'`)
    return undefined
  }

  if (canvasElement && canvasElement.tagName !== 'CANVAS') {
    console.error(`💥 FATAL! Element with selector: '${selector}' is not a canvas element`)
    return undefined
  }

  const canvas = canvasElement
  if (!canvas) {
    console.error(`💥 FATAL! Unable to find canvas element with selector: '${selector}'`)
    return undefined
  }

  glContext = canvas.getContext('webgl2', { antialias: aa }) ?? undefined

  if (!glContext) {
    console.error(`💥 Unable to create WebGL2 context, maybe it's not supported on this device`)
    return undefined
  }

  console.info(
    `📐 Internal: ${canvas.width} x ${canvas.height}, display: ${canvas.clientWidth} x ${canvas.clientHeight}`,
  )

  return glContext
}
