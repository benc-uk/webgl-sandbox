// ===============================================================================
// Handles the code editor which is based on Monaco
// ===============================================================================

import { execPressed } from './render.js'
import defaultPostShader from './shaders/post.glsl.frag?raw'
import defaultStateShader from './shaders/state.glsl.frag?raw'

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

import { glslLangTokenProvider } from './lang-glsl.js'

// Used everywhere, selector for the GL canvas
export const selector = '#output'

// Global reference to the Monaco editor
let editor
let decorations

// Which mode are we in, state, main or post-processing
/** @type Mode */
let modeKey = 'main'

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
    await loadExample(forceFileLoad)
    code = getCode('main')
  } else {
    const tmpCode = getCode('main')

    // Load default
    if (tmpCode === null) {
      console.log('No shader code found, loading default...')

      await loadExample('raytracer')
      code = getCode('main')
    }
  }

  // Default for post-processing code
  if (getCode('post') === null) {
    console.log('No post-processing code found, loading default...')

    localStorage.setItem('postCode', defaultPostShader)
  }

  // Default for state-processing code
  if (getCode('state') === null) {
    localStorage.setItem(`stateCode`, defaultStateShader)
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
    localStorage.setItem(`${modeKey}Code`, editor.getValue())
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
  const mainCode = await fetchTextFile(`samples/${name}/main.glsl.frag`)
  localStorage.setItem('mainCode', mainCode)
  if (editor) editor.setValue(mainCode)
  modeKey = 'main'

  try {
    const postCode = await fetchTextFile(`samples/${name}/post.glsl.frag`)
    localStorage.setItem('postCode', postCode)
    // eslint-disable-next-line no-unused-vars
  } catch (e) {
    localStorage.setItem('postCode', defaultPostShader)
  }

  try {
    const stateCode = await fetchTextFile(`samples/${name}/state.glsl.frag`)
    localStorage.setItem('stateCode', stateCode)
    // eslint-disable-next-line no-unused-vars
  } catch (e) {
    localStorage.setItem('stateCode', defaultStateShader)
  }
}

/**
 * Get the current shader code from local storage
 * @param {Mode} mode
 * @returns {string | null}
 */
export function getCode(mode) {
  return localStorage.getItem(`${mode}Code`)
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
 * @param {Mode} mode
 */
export function switchMode(mode) {
  modeKey = mode
  clearErrors()
  editor.setValue(localStorage.getItem(`${mode}Code`))
}

export function getMode() {
  return modeKey
}
