import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';  // ✅ يجب أن يكون موجوداً
import { PaymentSettingsProvider } from './context/PaymentSettingsContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>       {/* ✅ ThemeProvider أولاً */}
        <AuthProvider>      {/* ✅ ثم AuthProvider */}
        <PaymentSettingsProvider>
      <App />
    </PaymentSettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);