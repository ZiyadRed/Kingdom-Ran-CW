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
          // Glossary tables and the 10-row role roster are small Guide inputs.
          // Leaving either in the broad 'data' chunk forces /guide to download
          // the entire character dataset, so let Rollup place them normally.
          if (
            normalized.includes('/data/glossary/') ||
            normalized.endsWith('/data/souha_role_skills.json')
          ) return undefined
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
