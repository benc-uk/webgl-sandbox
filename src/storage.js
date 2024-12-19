/**
 * @param {string} name
 * @returns {Promise<string>}
 */
export async function loadSample(name) {
  try {
    const resp = await fetch(`samples/${name}.glsl.frag`)
    if (!resp.ok || resp.status !== 200) {
      throw new Error(`Failed to load shader file: ${name}`)
    }

    const shaderText = await resp.text()
    localStorage.setItem('shaderText', shaderText)
    return shaderText
  } catch (e) {
    showError(e)
    return
  }
}

/**
 * @returns {string}
 */
export function getShaderText() {
  return localStorage.getItem('shaderText')
}

export function saveShaderText(shaderText) {
  localStorage.setItem('shaderText', shaderText)
}
