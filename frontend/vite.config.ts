import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward /api/* to the .NET backend during local development
      '/api': {
        target: 'http://localhost:5022',
        changeOrigin: true,
      },
    },
  },
})
