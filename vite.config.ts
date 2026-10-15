import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

// In development the SPA and the API must be same-site (refresh cookie is sameSite=lax):
// /api is proxied to the backend, so keep VITE_API_BASE_URL=/api/v1.
export default defineConfig({
  plugins: [react(), tailwindcss()] as any,
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    proxy: { '/api': { target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:3000', changeOrigin: true } },
  },
  build: { chunkSizeWarningLimit: 700 },
  test: { environment: 'jsdom', globals: true, setupFiles: './src/test/setup.ts', css: false },
});
