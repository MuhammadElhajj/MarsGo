



// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   plugins: [react({
//     fastRefresh: true,
//     include: "**/*.jsx",
//   })],
// })


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({
    fastRefresh: true,
    include: "**/*.jsx",
  })],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'charts': ['recharts'],
          'router': ['react-router-dom'],
          'vendor': ['react', 'react-dom'],
        }
      }
    },
    chunkSizeWarningLimit: 500,
    cssCodeSplit: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      }
    }
  }
})

// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   plugins: [react({
//     fastRefresh: true,
//     include: "**/*.jsx",
//   })],
//   build: {
//     rollupOptions: {
//       output: {
//         manualChunks(id) {
//           // تقسيم المكتبات الكبيرة إلى ملفات منفصلة
//           if (id.includes('node_modules')) {
//             // Firebase
//             if (id.includes('firebase')) {
//               return 'firebase';
//             }
//             // React ومكتباته
//             if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
//               return 'react';
//             }
//             // واجهات المستخدم (UI)
//             if (id.includes('recharts') || id.includes('react-hot-toast') || id.includes('react-icons')) {
//               return 'ui';
//             }
//             // Axios
//             if (id.includes('axios')) {
//               return 'axios';
//             }
//             // أي مكتبة أخرى غير مصنفة (اختياري)
//             return 'vendor';
//           }
//           // الملفات الخاصة بالتطبيق تبقى في المقطع الرئيسي
//         },
//       },
//     },
//   },
// })