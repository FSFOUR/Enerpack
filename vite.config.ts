import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY for the Gemini Service so it works in the browser build
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Prevent crash if other process.env fields are accessed by dependencies
      'process.env': {}
    },
    build: {
      outDir: 'dist',
    }
  };
});