// ===============================================================================
// Handles the code editor which is based on Monaco
// ===============================================================================

import { execPressed } from './render.js'
import defaultPostShader from './shaders/post.glsl.frag?raw'

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

import { glslLangTokenProvider } from './lang-glsl.js'

// Used everywhere, selector for the GL canvas
export const selector = '#output'

// Local storage keys
const KEY_SHADER_CODE = 'shaderCode'
const KEY_POST_CODE = 'postCode'

// Global reference to the Monaco editor
let editor
let decorations

// Which mode are we in, shader or post-processing
let modeKey = KEY_SHADER_CODE

/**
 * Initialize the Monaco editor
 * @param {(codeEditor: monaco.editor.ICodeEditor) => void} doneCallback - Callback to call when the editor is ready
 * @param {string | null} forceFileLoad - Force load a specific example file
 */
export async function initEditor(doneCallback, forceFileLoad) {
  if (editor) return

  if (doneCallback) {
    monaco.editor.onDidCreateEditor(doneCallback)
  }

  let code
  if (forceFileLoad) {
    code = await fetchTextFile(`samples/${forceFileLoad}.glsl.frag`)
  } else {
    code = getShaderCode()

    // Load default
    if (code === null) {
      console.log('No shader code found, loading default...')

      code = await fetchTextFile(`samples/raytracer.glsl.frag`)
      localStorage.setItem(KEY_SHADER_CODE, code)
    }
  }

  // Default for post-processing code
  if (getPostCode() === null) {
    localStorage.setItem(KEY_POST_CODE, defaultPostShader)
  }

  monaco.languages.register({ id: 'glsl' })
  // @ts-ignore
  monaco.languages.setMonarchTokensProvider('glsl', glslLangTokenProvider)

  monaco.editor.defineTheme('custom', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      {
        foreground: '#be92ea',
        token: 'keyword',
      },
      {
        foreground: '#ff5874',
        token: 'builtin',
      },
      {
        foreground: '#55aa66',
        token: 'entity.name.function',
      },
      {
        foreground: '#7184ff',
        token: 'entity.name.type',
      },
      {
        foreground: '#888888',
        token: 'comment',
      },
    ],
    colors: {},
  })

  /** @type {HTMLDivElement | null} */
  const codeDiv = document.querySelector('#code')
  if (!codeDiv) return

  editor = monaco.editor.create(codeDiv, {
    value: code,
    theme: 'custom',
    language: 'glsl',
    minimap: { enabled: false },
    automaticLayout: true,
    scrollBeyondLastLine: false,
    glyphMargin: true,
    fontSize: 16,
  })

  editor.focus()

  // Trap Ctrl+S to run the shader and prevent the browser from saving the file
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    execPressed()
  })

  editor.onDidChangeModelContent(() => {
    localStorage.setItem(modeKey, editor.getValue())
  })

  decorations = editor.createDecorationsCollection()
}

/**
 * Add an error to the editor on a given line
 * @param {number} lineNum - Line number to add the error to
 * @param {string} msg - Error message to display
 */
export function addErrorLine(lineNum, msg) {
  decorations.append([
    {
      range: new monaco.Range(lineNum, 1, lineNum, 1),
      options: {
        isWholeLine: true,
        className: 'editor-error',
        marginClassName: 'editor-error',
        glyphMarginClassName: 'glyph-error',
        glyphMarginHoverMessage: { value: msg },
        hoverMessage: { value: msg },
      },
    },
  ])
}

// Clear all errors from the editor
export function clearErrors() {
  decorations.clear()
}

// Resize the editor to fit properly under the canvas
export function resizeEditor() {
  const width = window.innerWidth - 0

  /** @type {HTMLCanvasElement | null} */
  const canvas = document.querySelector(selector)
  if (!canvas) return

  /** @type {HTMLDivElement | null} */
  const codeDiv = document.querySelector('#code')
  if (!codeDiv) return

  const height = window.innerHeight - canvas.height - 80 // 80 is a magic number that works

  codeDiv.style.height = `${height}px`
  codeDiv.style.width = `${width}px`
}

/**
 * Load an example shader from the samples directory
 * Switches to shader mode
 * @param {string} name - The name of the example shader file to load without the extension
 * @returns {Promise<void>}
 */
export async function loadExample(name) {
  modeKey = KEY_SHADER_CODE
  const code = await fetchTextFile(`samples/${name}.glsl.frag`)
  localStorage.setItem('shaderCode', code)
  editor.setValue(code)
}

/**
 * Get the current shader code from local storage
 * @returns {string | null}
 */
export function getShaderCode() {
  return localStorage.getItem(KEY_SHADER_CODE)
}

/**
 * Get the current post-processing code from local storage
 * @returns {string | null}
 */
export function getPostCode() {
  return localStorage.getItem(KEY_POST_CODE)
}

/**
 * Fetch a text file from a URL
 * @param {string} url - The URL to fetch
 * @returns {Promise<string>}
 */
async function fetchTextFile(url) {
  const resp = await fetch(url)
  if (!resp.ok || resp.status !== 200) {
    throw new Error(`Failed to load: ${url}`)
  }

  return await resp.text()
}

/**
 * Switch between shader and post-processing code
 */
export function switchMode() {
  modeKey = modeKey === KEY_SHADER_CODE ? KEY_POST_CODE : KEY_SHADER_CODE

  clearErrors()
  editor.setValue(localStorage.getItem(modeKey))
}

export function getMode() {
  return modeKey
}
