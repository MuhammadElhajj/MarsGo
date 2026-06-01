import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';  // ✅ يجب أن يكون موجوداً
import { PaymentSettingsProvider } from './context/PaymentSettingsContext';
import './index.css';
import { StoreSettingsProvider } from './context/StoreSettingsContext';
import { ServicesProvider } from './context/ServicesContext';
import { GamesProvider } from './context/GamesContext';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>       {/* ✅ ThemeProvider أولاً */}
        <AuthProvider>      {/* ✅ ثم AuthProvider */}
        <PaymentSettingsProvider>
      <StoreSettingsProvider>  {/* أضفه هنا */}
           <ServicesProvider>   {/* <-- أضف هذا */}
            <GamesProvider>   {/* <-- أضف هذا */}
                  <App />
                </GamesProvider>
        </ServicesProvider>
      </StoreSettingsProvider>
    </PaymentSettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);