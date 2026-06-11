// // src/main.jsx (النسخة المعدلة)
// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import { BrowserRouter } from 'react-router-dom';
// import App from './App';
// import { AuthProvider } from './context/AuthContext';
// import { ThemeProvider } from './context/ThemeContext';
// import { PaymentSettingsProvider } from './context/PaymentSettingsContext';
// import './index.css';
// import { DiscountProvider } from './context/DiscountContext';
// import { TopUpSettingsProvider } from './context/TopUpSettingsContext';
// import { StoreSettingsProvider } from './context/StoreSettingsContext';
// import { ServicesProvider } from './context/ServicesContext';
// import { GamesProvider } from './context/GamesContext';
// import { NavLinksProvider } from './context/NavLinksContext';
// import { AppsProvider } from './context/AppsContext';
// import { ExchangeRateProvider } from './context/ExchangeRateContext';
// import { CurrencyProvider } from './context/CurrencyContext';
// import { BalanceProvider } from './context/BalanceContext';
// import { NotificationProvider } from './context/NotificationContext';
// import { SiteConfigProvider } from './context/SiteConfigContext';
// import { MerchantDiscountProvider } from './context/MerchantDiscountContext';
// import { TickerProvider } from './context/TickerContext';
// import ErrorBoundary from './components/GeneralComponents/ErrorBoundary/ErrorBoundary';
// // إضافة مستورد StoreInitializer (سيتم إنشاؤه لاحقاً)
// import StoreInitializer from './components/GeneralComponents/StoreInitializer/StoreInitializer';

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <BrowserRouter>
//       <ErrorBoundary>
//         <ThemeProvider>
//           <AuthProvider>
//             <BalanceProvider>
//               <PaymentSettingsProvider>
//                 <StoreSettingsProvider>
//                   <ServicesProvider>
//                     <GamesProvider>
//                       <NavLinksProvider>
//                         <AppsProvider>
//                           <ExchangeRateProvider>
//                             <CurrencyProvider>
//                               <TickerProvider>
//                                 <NotificationProvider>
//                                   <SiteConfigProvider>
//                                     <TopUpSettingsProvider>
//                                       <MerchantDiscountProvider>
//                                         <DiscountProvider>
//                                           {/* ✅ إضافة StoreInitializer هنا - لن يؤثر على الأداء لأنه خفيف */}
//                                           <StoreInitializer>
//                                             <App />
//                                           </StoreInitializer>
//                                         </DiscountProvider>
//                                       </MerchantDiscountProvider>
//                                     </TopUpSettingsProvider>
//                                   </SiteConfigProvider>
//                                 </NotificationProvider>
//                               </TickerProvider>
//                             </CurrencyProvider>
//                           </ExchangeRateProvider>
//                         </AppsProvider>
//                       </NavLinksProvider>
//                     </GamesProvider>
//                   </ServicesProvider>
//                 </StoreSettingsProvider>
//               </PaymentSettingsProvider>
//             </BalanceProvider>
//           </AuthProvider>
//         </ThemeProvider>
//       </ErrorBoundary>
//     </BrowserRouter>
//   </React.StrictMode>
// );



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