

// src/main.jsx - النسخة النهائية المحسّنة (مثل الشركات الكبيرة)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';
import ErrorBoundary from './components/GeneralComponents/ErrorBoundary/ErrorBoundary';

// ✅ تمت إزالة جميع السياقات الأخرى لأنها استُبدلت بـ Zustand store مركزي
// ✅ تمت إزالة StoreInitializer لأن Zustand يدير الحالة والمزامنة

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);