import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

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
        const manifestSource = resolve(__dirname, 'public/manifest.json');
        const manifestDest = resolve(distDir, 'manifest.json');
        
        if (existsSync(manifestSource)) {
          copyFileSync(manifestSource, manifestDest);
        } else {
          console.warn('Warning: public/manifest.json not found, skipping copy');
        }
        
        // Fix popup.html script paths to be relative
        const popupPath = resolve(distDir, 'popup.html');
        if (existsSync(popupPath)) {
          let popupContent = readFileSync(popupPath, 'utf8');
          // Replace absolute paths with relative paths
          popupContent = popupContent.replace(/src="\/assets\//g, 'src="./assets/');
          writeFileSync(popupPath, popupContent);
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
