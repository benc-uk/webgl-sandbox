import { $ } from '../lib/dom.js'
import { getShaderText, saveShaderText, loadSample } from './storage.js'

export let editor
export const selector = '#output'

export function initEditor() {
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

    const shaderText = getShaderText()
    if (shaderText === null) {
      shaderText = await loadSample('raytracer')
    }

    editor = monaco.editor.create($('#code'), {
      value: shaderText,
      theme: 'vs-dark',
      language: 'glsl',
      minimap: { enabled: false },
      automaticLayout: true,
      scrollBeyondLastLine: false,
    })

    editor.focus()

    // Trap Ctrl+S to run the shader and prevent the browser from saving the file
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      $('#run').click()
    })

    editor.onDidChangeModelContent(() => {
      saveShaderText(editor.getValue())
    })
  })
}

// Resize the editor to fit properly under the canvas
export function resizeEditor() {
  console.log('📐 Resizing editor')

  const width = window.innerWidth - 0
  const height = window.innerHeight - $(selector).height - 80

  $('#code').style.height = `${height}px`
  $('#code').style.width = `${width}px`
}