// ===============================================================================
// Storing and retrieving shader code from local storage
// ===============================================================================

/**
 * @param {string} name - The name of the example shader file to load without the extension
 * @returns {Promise<string>}
 */
export async function loadExampleCode(name) {
  const resp = await fetch(`samples/${name}.glsl.frag`)
  if (!resp.ok || resp.status !== 200) {
    throw new Error(`Failed to load shader file: ${name}`)
  }

  const code = await resp.text()
  localStorage.setItem('shaderCode', code)
  return code
}

/**
 * Get the shader code from local storage
 * @returns {string}
 */
export function getShaderCode() {
  return localStorage.getItem('shaderCode')
}

/**
 * Save the shader code to local storage
 * @param {string} codeString - The shader text to save
 */
export function saveShaderCode(codeString) {
  localStorage.setItem('shaderCode', codeString)
}
