import { defineConfig } from 'vite';

export default defineConfig({
  // Base path for GitHub Pages (repo name)
  base: '/sentinel/',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
