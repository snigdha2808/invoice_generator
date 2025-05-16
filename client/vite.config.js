import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // string shorthand: /api -> http://localhost:5001/api
      '/api': {
        target: 'http://localhost:5001', // Your backend server
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '') // Uncomment if your backend doesn't expect /api prefix
      }
    }
  }
})
