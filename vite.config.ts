import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {cwd} from 'node:process';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({command, mode}) => {
  if (command === 'build' && mode === 'vercel') {
    const env = loadEnv(mode, cwd(), 'VITE_');
    if (!env.VITE_SUPABASE_URL?.trim() ||
        !(env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || env.VITE_SUPABASE_ANON_KEY?.trim())) {
      throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) in the Vercel deployment environment.');
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
