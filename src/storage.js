/**
 * @param {string} name - The name of the shader file to load without the extension
 * @returns {Promise<string>}
 */
export async function loadSample(name) {
  const resp = await fetch(`samples/${name}.glsl.frag`)
  if (!resp.ok || resp.status !== 200) {
    throw new Error(`Failed to load shader file: ${name}`)
  }

  const shaderText = await resp.text()
  localStorage.setItem('shaderText', shaderText)
  return shaderText
}

/**
 * Get the shader text from local storage or memoized value
 * @returns {string}
 */
export function getShaderText() {
  return localStorage.getItem('shaderText')
}

export function saveShaderText(text) {
  localStorage.setItem('shaderText', text)
}
