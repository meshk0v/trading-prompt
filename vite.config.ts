import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// BASE_PATH lets the same build run in a sub-folder, e.g. "/trading-prompt" on GitHub Pages.
const basePath = process.env.BASE_PATH ? `${process.env.BASE_PATH.replace(/\/$/, '')}/` : '/'

export default defineConfig({
  base: basePath,
  plugins: [react()],
  build: {
    // flag-icons ships ~540 SVG flags; serve them as files instead of inlining all of them into the CSS.
    assetsInlineLimit: file => (file.endsWith('.svg') ? false : undefined),
    rolldownOptions: {
      output: {
        // Keep third-party code in its own long-cached file. The indicator library stays with
        // buildPrompt, which is loaded only when a prompt is built.
        codeSplitting: { groups: [{ name: 'vendor', test: /node_modules\/(?!trading-signals)/ }] },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  server: {
    port: 8443,
    // The PHP API runs separately in development (see DEPLOY.md); override with API_PROXY.
    proxy: {
      '/api': process.env.API_PROXY || 'http://localhost:8090',
    },
  },
})
