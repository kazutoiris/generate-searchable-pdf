import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import topLevelAwait from 'vite-plugin-top-level-await';
import wasm from "vite-plugin-wasm";
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/mupdf/dist/*.wasm',
          dest: 'node_modules/.vite/deps'
        }
      ]
    }),
    react(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        worker: 'src/workers/mupdf.worker.ts'
      }
    },
  },
  worker: {
    format: 'es'
  },
  base: './',
})
