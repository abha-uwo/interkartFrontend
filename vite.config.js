import { defineConfig } from 'vite';

export default defineConfig({
  // Expose env variables to frontend (VITE_ prefix required)
  define: {
    __API_BASE__: JSON.stringify(process.env.VITE_API_URL || '')
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/webhook': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
});
