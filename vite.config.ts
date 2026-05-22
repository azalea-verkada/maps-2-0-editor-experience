import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/maps-2-0-editor-experience/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
