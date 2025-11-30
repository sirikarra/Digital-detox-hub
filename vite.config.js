import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import topLevelAwait from 'vite-plugin-top-level-await';
// ADDED: Import the CommonJS plugin
import commonjs from '@rollup/plugin-commonjs'; 

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Add the CommonJS plugin FIRST to ensure dependencies are processed correctly
    commonjs({
        include: /node_modules/, // Process all node_modules as CommonJS
    }), 
    react(),
    topLevelAwait({
      promiseExportName: "__tla",
      promiseImportName: i => `__tla_${i}`
    })
  ],
  // CRITICAL: Configure the server/build for Wasm compatibility
  server: {
    fs: {
      allow: ['..'], 
    },
  },
  build: {
    target: 'esnext', 
  },
  optimizeDeps: {
    // Explicitly exclude Mesh dependencies to prevent Vite from optimizing them 
    exclude: ['@meshsdk/core', '@meshsdk/connector', '@meshsdk/react'], 
  }
});