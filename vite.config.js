import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/')
          // Glossary tables are small, static reference text used only by the
          // Guide route. Leaving them in the broad 'data' chunk forced /guide to
          // download the entire character dataset alongside them, so they are
          // left unassigned and land in whichever route chunk imports them.
          if (normalized.includes('/data/glossary/')) return undefined
          if (normalized.includes('/data/')) return 'data'
          if (normalized.includes('node_modules')) {
            if (
              normalized.includes('react') ||
              normalized.includes('react-dom') ||
              normalized.includes('react-router-dom')
            ) return 'react'
            return 'vendor'
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@data': path.resolve(__dirname, './data'),
    },
  },
})
