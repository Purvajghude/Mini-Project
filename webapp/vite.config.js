import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The production build is copied into the Spring Boot jar and served from the same
// origin as the API, so the client calls a relative /api path. The dev proxy below
// makes that identical path work while running against `mvnw spring-boot:run`.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
