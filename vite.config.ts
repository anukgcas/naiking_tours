import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';
import {createAiSuggestHandler} from './server/aiSuggest';

// Serves /api/ai-suggest from the Vite dev and preview servers so the Gemini key never reaches the browser.
const aiSuggestPlugin = (apiKey: string | undefined): Plugin => {
  const handler = createAiSuggestHandler(apiKey);
  return {
    name: 'ai-suggest-api',
    configureServer(server) {
      server.middlewares.use('/api/ai-suggest', handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/ai-suggest', handler);
    },
  };
};

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss(), aiSuggestPlugin(env.GEMINI_API_KEY)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
