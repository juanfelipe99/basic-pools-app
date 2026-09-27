import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // IPv4 so tunnels and the backend's trusted proxy (127.0.0.1) see the same address
    host: '127.0.0.1',
    port: 5173,
    allowedHosts: ['.trycloudflare.com', '.ngrok-free.app'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Appends X-Forwarded-For so the backend limits votes by the voter's IP, not the proxy's
        xfwd: true,
      },
    },
  },
})
