

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
      include: '**/*.jsx',
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/functions'],
          'charts': ['recharts'],
          'router': ['react-router-dom'],
          'vendor': ['react', 'react-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
    cssCodeSplit: true,
    minify: 'terser',
    sourcemap: false,
    target: 'es2020',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});