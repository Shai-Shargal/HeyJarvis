import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, existsSync, mkdirSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-manifest',
      closeBundle() {
        const distDir = resolve(__dirname, 'dist');
        if (!existsSync(distDir)) {
          mkdirSync(distDir, { recursive: true });
        }
        copyFileSync(
          resolve(__dirname, 'public/manifest.json'),
          resolve(distDir, 'manifest.json')
        );
        
        // Fix popup.html script paths to be relative
        const popupPath = resolve(distDir, 'popup.html');
        if (existsSync(popupPath)) {
          const fs = require('fs');
          let popupContent = fs.readFileSync(popupPath, 'utf8');
          // Replace absolute paths with relative paths
          popupContent = popupContent.replace(/src="\/assets\//g, 'src="./assets/');
          fs.writeFileSync(popupPath, popupContent);
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'public/popup.html'),
        background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Keep popup.html at root of dist
          if (assetInfo.name === 'popup.html') {
            return 'popup.html';
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },
    },
  },
});
