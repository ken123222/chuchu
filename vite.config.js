import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// ✅ FIX: Replace this with your current computer IP (the one from ipconfig)
const NETWORK_IP = "10.244.209.27"; 

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // ✅ FIXED: This allows your phone/network to see the Vite server
    host: '0.0.0.0', 
    port: 5173,
    proxy: {
      '/api': {
        // ✅ FIXED: Point to the Network IP so other devices can reach the backend
        target: `http://${NETWORK_IP}:5000`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})