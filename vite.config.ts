import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './src/core'),
      '@sim': path.resolve(__dirname, './src/simulation'),
      '@render': path.resolve(__dirname, './src/render'),
      '@graph': path.resolve(__dirname, './src/graph'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
});
