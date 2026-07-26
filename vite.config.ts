import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const isCapacitor = process.env.CAPACITOR_BUILD === 'true';
  
  // Load standard Vite env variables if they exist
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // FORCE Vite to inject your AI Studio Secrets into the frontend
    define: {
      'import.meta.env.VITE_CENTRAL_SUPABASE_URL': JSON.stringify(process.env.VITE_CENTRAL_SUPABASE_URL || env.VITE_CENTRAL_SUPABASE_URL),
      'import.meta.env.VITE_CENTRAL_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_CENTRAL_SUPABASE_ANON_KEY || env.VITE_CENTRAL_SUPABASE_ANON_KEY)
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});