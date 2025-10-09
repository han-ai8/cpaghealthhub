import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // If using React plugin

export default defineConfig({
  plugins: [react()], // Add your plugins here
  server: {
    port: 5173, // Default Vite port
    proxy: {
      '/api': {
        target: 'http://localhost:4000', // Your backend URL
        changeOrigin: true, // Changes the origin of the host header to the target URL
        secure: false, // For local dev (ignore SSL if needed)
        rewrite: (path) => path.replace(/^\/api/, '/api'), // Optional: Keep /api prefix if your routes expect it
      },
    },
  },
});