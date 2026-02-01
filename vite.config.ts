
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Sur une VM, on peut définir API_KEY dans .env ou en variable système
  const apiKey = env.API_KEY || process.env.API_KEY;

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        }
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false
    },
    define: {
      // Injection de la clé API pour le code client lors du build
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  };
});
