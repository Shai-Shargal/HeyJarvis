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
        
        // Fix popup.html - copy from dist/public if it exists and fix paths
        const publicPopupPath = resolve(distDir, 'public/popup.html');
        const rootPopupPath = resolve(distDir, 'popup.html');
        
        if (existsSync(publicPopupPath)) {
          // Copy the built popup.html from public to root and fix paths
          let popupContent = readFileSync(publicPopupPath, 'utf8');
          // Replace absolute paths with relative paths
          popupContent = popupContent.replace(/src="\/assets\//g, 'src="./assets/');
          writeFileSync(rootPopupPath, popupContent);
        } else if (existsSync(rootPopupPath)) {
          // Fix paths in existing popup.html
          let popupContent = readFileSync(rootPopupPath, 'utf8');
          // Find the actual built file in assets
          const assetsDir = resolve(distDir, 'assets');
          if (existsSync(assetsDir)) {
            const { readdirSync } = require('fs');
            const files = readdirSync(assetsDir);
            const popupFile = files.find((f: string) => f.startsWith('popup-') && f.endsWith('.js'));
            if (popupFile) {
              // Replace source paths with built asset paths
              popupContent = popupContent.replace(/src="[^"]*"/g, `src="./assets/${popupFile}"`);
            }
          }
          // Also fix any absolute asset paths
          popupContent = popupContent.replace(/src="\/assets\//g, 'src="./assets/');
          writeFileSync(rootPopupPath, popupContent);
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
