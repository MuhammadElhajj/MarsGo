

// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// export default defineConfig({
//   plugins: [
//     react({
//       fastRefresh: true,
//       include: '**/*.jsx',
//     }),
//   ],
//   build: {
//     rollupOptions: {
//       output: {
//         manualChunks: {
//           'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/functions'],
//           'charts': ['recharts'],
//           'router': ['react-router-dom'],
//           'vendor': ['react', 'react-dom'],
//         },
//       },
//     },
//     chunkSizeWarningLimit: 500,
//     cssCodeSplit: true,
//     minify: 'terser',
//     sourcemap: false,
//     target: 'es2020',
//     terserOptions: {
//       compress: {
//         drop_console: true,
//         drop_debugger: true,
//       },
//     },
//   },
// });
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
      include: '**/*.jsx',
    }),
  ],
  
  // ===== تحسينات بيئة التطوير =====
  server: {
    port: 3000,
    open: true,
    hmr: {
      overlay: true,
    },
  },

  // ===== تحسينات البناء =====
  build: {
    // تقسيم الكود (Code Splitting) المتقدم
    rollupOptions: {
      output: {
        manualChunks: {
          // ✅ فصل Firebase إلى أجزاء منفصلة (إذا كنت تستخدم كل شيء)
          'firebase-auth': ['firebase/auth'],
          'firebase-firestore': ['firebase/firestore'],
          'firebase-storage': ['firebase/storage'],
          'firebase-functions': ['firebase/functions'],
          'firebase-app': ['firebase/app'],
          
          // ✅ فصل المكتبات الكبيرة
          'charts': ['recharts'],
          'router': ['react-router-dom'],
          'vendor': ['react', 'react-dom'],
          
          // ✅ فصل مكتبة إدارة الحالة
          'zustand': ['zustand'],
          
          // ✅ فصل دوال التاريخ
          'date-fns': ['date-fns'],
        },
      },
    },
    
    // رفع حد التحذير من حجم الحزمة إلى 1000 كيلوبايت (لتجنب التحذيرات غير الضرورية)
    chunkSizeWarningLimit: 1000,
    
    // تقسيم ملفات CSS
    cssCodeSplit: true,
    
    // تصغير الكود باستخدام Terser
    minify: 'terser',
    
    // عدم إنشاء Source Maps في الإنتاج (لتقليل الحجم)
    sourcemap: false,
    
    // استهداف الإصدارات الحديثة من المتصفحات
    target: 'es2020',
    
    // إعدادات Terser لتصغير الكود بشكل أقوى
    terserOptions: {
      compress: {
        drop_console: true,        // حذف console.log
        drop_debugger: true,       // حذف debugger
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // حذف دوال محددة
      },
      format: {
        comments: false,           // حذف التعليقات
      },
    },
  },

  // ===== تحسينات التطوير =====
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'es-toolkit', 
        'es-toolkit/compat',
      
    ],
    exclude: ['recharts' , 'use-sync-external-store'], // تجنب تحميل recharts في التطوير (يتم تحميله فقط عند الحاجة)
  },

  // ===== تحسينات CSS =====
  css: {
    devSourcemap: true, // لتسهيل التصحيح في التطوير
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./src/styles/variables.scss";`, // إذا كنت تستخدم SCSS
      },
    },
  },

  // ===== تحميل مسبق للـ Polyfills (للمتصفحات القديمة) =====
  build: {
    // يمكن إضافة polyfills هنا إذا لزم الأمر
    polyfillModulePreload: true,
  },
});