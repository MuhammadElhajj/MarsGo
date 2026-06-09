import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})


// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   server: {
//     proxy: {
//       '/api': {
//         target: 'https://gate.whapi.cloud',
//         changeOrigin: true,
//         rewrite: (path) => path.replace(/^\/api/, '')
//       }
//     }
//   }
// })

// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
// import path from 'path';

// export default defineConfig({
//   plugins: [react()],
//   resolve: {
//     alias: {
//       '@': path.resolve(__dirname, './src'),
//       '@components': path.resolve(__dirname, './src/components'),
//       '@context': path.resolve(__dirname, './src/context'),
//       '@hooks': path.resolve(__dirname, './src/hooks'),
//       '@utils': path.resolve(__dirname, './src/utils'),
//     },
//   },
//   build: {
//     rollupOptions: {
//       output: {
//         manualChunks: {
//           'react-vendor': ['react', 'react-dom', 'react-router-dom'],
//           'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
//           'ui-vendor': ['react-hot-toast', 'react-icons', 'react-intersection-observer'],
//         },
//       },
//     },
//     chunkSizeWarningLimit: 1000,
//     minify: 'esbuild',
//     target: 'es2020',
//   },
//   server: {
//     open: true,
//     proxy: {
//       '/api': {
//         target: 'https://gate.whapi.cloud',
//         changeOrigin: true,
//         rewrite: (path) => path.replace(/^\/api/, ''),
//       },
//     },
//   },
// });