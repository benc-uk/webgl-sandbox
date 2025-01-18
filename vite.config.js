import { defineConfig } from 'vite'
import version from 'vite-plugin-package-version'
import monacoEditorEsmPlugin from 'vite-plugin-monaco-editor-esm'

export default defineConfig({
  plugins: [version(), monacoEditorEsmPlugin({})],

  server: {
    port: 3000,
  },

  appType: 'mpa',
})
