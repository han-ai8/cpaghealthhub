import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Backend server
        changeOrigin: true,
        secure: false,
        // REMOVED: Useless rewrite - proxy forwards /api/... directly to backend /api/...
        // If backend routes are at /api/auth, this works as-is
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying request:', req.method, req.url); // DEBUG: Log proxied requests
          });
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err); // DEBUG: Catch proxy issues
          });
        },
      },
    },
  },
});