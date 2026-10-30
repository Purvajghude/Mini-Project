import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// MESH web client. Runs beside the legacy client in /src without sharing any of its code.
// /api goes to the Spring Boot API; /sync goes to the whiteboard sync server (web/server).
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/sync': { target: 'http://localhost:5858', ws: true },
    },
  },
  build: { outDir: 'dist', emptyOutDir: true },
});
