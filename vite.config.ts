import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  base: (process.env.ELECTRON === '1' || process.env.ELECTRON === 'true') 
    ? './' 
    : (process.env.BASE_PATH || '/'),
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        'quick-search': resolve(__dirname, 'quick-search.html'),
        'year-countdown-widget': resolve(__dirname, 'year-countdown-widget.html'),
      },
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false, // 如果端口被占用，自动使用下一个可用端口
  },
});