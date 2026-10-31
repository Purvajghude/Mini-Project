import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// The page is same-origin with Vite, but Spring's CORS sees the forwarded Origin against Host=localhost:8080.
// Map a Cloudflare Quick Tunnel origin to the local one so the existing MESH_ALLOWED_ORIGINS default accepts it.
const TUNNEL_ORIGIN = /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/;

// MESH web client. Runs beside the legacy client in /src without sharing any of its code.
// /api goes to the Spring Boot API; /sync goes to the whiteboard sync server (web/server).
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    allowedHosts: ['.trycloudflare.com'], // demo tunnel only, see web/TUNNEL_DEMO.md
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        configure: (proxy) => proxy.on('proxyReq', (req) => {
          if (TUNNEL_ORIGIN.test(String(req.getHeader('origin') ?? ''))) req.setHeader('origin', 'http://localhost:5173');
        }),
      },
      '/sync': { target: 'http://localhost:5858', ws: true },
    },
  },
  build: { outDir: 'dist', emptyOutDir: true },
});
