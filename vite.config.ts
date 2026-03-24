import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      watch: {
        ignored: ['**/.agent/**', '**/.gemini/**', '**/supabase/**', '**/node_modules/**'],
      },
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-motion': ['framer-motion'],
          },
        },
      },
    },
    define: {
      // 'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY), // Removed to prevent Netlify secrets error
      // 'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY), // Removed to prevent Netlify secrets error
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      }
    }
  };
});
