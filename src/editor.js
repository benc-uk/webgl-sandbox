// ===============================================================================
// Handles the code editor which is based on Monaco
// ===============================================================================

const $ = document.querySelector.bind(document)
import { execPressed } from './render.js'
import { getShaderCode, loadExampleCode, saveShaderCode } from './storage.js'

// Used everywhere, selector for the GL canvas
export const selector = '#output'

// Global reference to the Monaco editor
export let editor

// Editor decorations for errors
let decorations

/**
 * Initialize the Monaco editor
 * @param {function} doneCallback - Callback to call when the editor is ready
 * @param {string} forceFileLoad - Force load a specific example file
 */
export function initEditor(doneCallback, forceFileLoad) {
  if (editor) return

  // Crap needed for Monaco editor
  require.config({
    paths: {
      vs: 'monaco/min/vs',
      bithero: 'monaco/plugins', // Custom GLS plugin
    },
  })

  // Load the Monaco editor, it still uses some funky old school AMD loader
  require(['vs/editor/editor.main'], async function () {
    require(['bithero/glsl'], function () {})

    if (doneCallback) {
      monaco.editor.onDidCreateEditor(doneCallback)
    }

    let code
    if (forceFileLoad) {
      code = await loadExampleCode(forceFileLoad)
    } else {
      code = getShaderCode()
      if (code === null) {
        code = await loadExampleCode('raytracer')
      }
    }

    editor = monaco.editor.create($('#code'), {
      value: code,
      theme: 'vs-dark',
      language: 'glsl',
      minimap: { enabled: false },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      glyphMargin: true,
    })

    editor.focus()

    // Trap Ctrl+S to run the shader and prevent the browser from saving the file
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      execPressed()
    })

    editor.onDidChangeModelContent(() => {
      saveShaderCode(editor.getValue())
    })

    decorations = editor.createDecorationsCollection()
  })
}

/**
 * Add an error to the editor on a given line
 * @param {number} lineNum - Line number to add the error to
 * @param {*} msg - Error message to display
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
  const height = window.innerHeight - $(selector).height - 80 // 80 is a magic number that works

  $('#code').style.height = `${height}px`
  $('#code').style.width = `${width}px`
}
