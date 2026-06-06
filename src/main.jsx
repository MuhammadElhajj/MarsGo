import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';  // ✅ يجب أن يكون موجوداً
import { PaymentSettingsProvider } from './context/PaymentSettingsContext';
import './index.css';
import { TopUpSettingsProvider } from './context/TopUpSettingsContext';
import { StoreSettingsProvider } from './context/StoreSettingsContext';
import { ServicesProvider } from './context/ServicesContext';
import { GamesProvider } from './context/GamesContext';
import { NavLinksProvider } from './context/NavLinksContext';
import { AppsProvider } from './context/AppsContext';
import { ExchangeRateProvider } from './context/ExchangeRateContext'; // تأكد من المسار الصحيح
import { CurrencyProvider } from './context/CurrencyContext';
import { BalanceProvider } from './context/BalanceContext'; 
import { NotificationProvider } from './context/NotificationContext';
import { SiteConfigProvider } from './context/SiteConfigContext';

// داخل التسلسل:
<AuthProvider>
     
  <NotificationProvider>
    <PaymentSettingsProvider>
      {/* باقي السياقات */}
    </PaymentSettingsProvider>
  </NotificationProvider>
</AuthProvider>
import { TickerProvider } from './context/TickerContext';
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>       {/* ✅ ThemeProvider أولاً */}
        <AuthProvider> 
              <BalanceProvider>        {/* ✅ ثم AuthProvider */}
        <PaymentSettingsProvider>
      <StoreSettingsProvider>  {/* أضفه هنا */}
           <ServicesProvider>   {/* <-- أضف هذا */}
            <GamesProvider>   {/* <-- أضف هذا */}
                  <NavLinksProvider>
  <AppsProvider>
<ExchangeRateProvider>
  <CurrencyProvider>
<TickerProvider>  
  <NotificationProvider>{/* <-- إضافة هذا */}
          <SiteConfigProvider>   {/* ✅ أضف هذا */}
                           <TopUpSettingsProvider>  
                            
                              <App />
   
                               </TopUpSettingsProvider>  
                            </SiteConfigProvider>
      </NotificationProvider> 
    </TickerProvider>
  </CurrencyProvider>
</ExchangeRateProvider>

</AppsProvider>
</NavLinksProvider>
                </GamesProvider>
        </ServicesProvider>
      </StoreSettingsProvider>
    </PaymentSettingsProvider>
        </BalanceProvider>   
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);