import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: ['jspdf', 'jspdf-autotable'],
  },
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'por-penalty-diving-stan.trycloudflare.com',  // Your specific tunnel URL
      '.trycloudflare.com'  // Wildcard for any trycloudflare.com subdomain
    ],
    hmr: {
      clientPort: 443  // Important for HMR to work through tunnels
    }
  }
})
