
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Équivalent à 0.0.0.0, permet l'accès réseau
    port: 5173
  },
  define: {
    'process.env': process.env
  }
});
