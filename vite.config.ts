import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

const isHmrDisabled =
  process.env.DISABLE_HMR === 'true' ||
  Boolean(process.env.K_SERVICE) ||
  Boolean(process.env.APPLET_ID);

function disableHmrClientPlugin(): Plugin {
  return {
    name: 'disable-hmr-client',
    apply: 'serve',
    transform(code, id) {
      if (isHmrDisabled && (id.includes('vite/dist/client/client.mjs') || id.endsWith('/client/client.mjs'))) {
        return {
          code: code
            .replace('transport.connect(createHMRHandler(handleMessage));', '/* hmr connection disabled */')
            .replace('console.debug("[vite] connecting...");', '/* hmr disabled */'),
          map: null,
        };
      }
      return null;
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      disableHmrClientPlugin(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio container environments to avoid WebSocket connection failures.
      hmr: !isHmrDisabled,
      // Disable file watching when HMR is disabled to save CPU.
      watch: isHmrDisabled ? null : {},
    },
  };
});

