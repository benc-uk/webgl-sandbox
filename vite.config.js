import { defineConfig } from 'vite'
import version from 'vite-plugin-package-version'

export default defineConfig({
  plugins: [version()],

  server: {
    port: 3000,
  },

  appType: 'mpa',
})
