import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // Use the key provided by the user if the environment variable is not set
    const apiKey = env.GEMINI_API_KEY || "AIzaSyBNBJQEP5J6C6y6gCSSh7sZkEYW-iX1rho";
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // Proxy API requests to the backend to avoid CORS and connect cleanly
        proxy: {
          '/api': {
            target: 'http://localhost:5000',
            changeOrigin: true,
            secure: false,
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});