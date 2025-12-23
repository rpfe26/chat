
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      proxy: {
        // Redirige les appels /api vers le serveur Express tournant sur le port 3000
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        }
      }
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY)
    }
  };
});
