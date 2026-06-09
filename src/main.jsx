import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PaymentSettingsProvider } from './context/PaymentSettingsContext';
import './index.css';
import { DiscountProvider } from './context/DiscountContext';
import { TopUpSettingsProvider } from './context/TopUpSettingsContext';
import { StoreSettingsProvider } from './context/StoreSettingsContext';
import { ServicesProvider } from './context/ServicesContext';
import { GamesProvider } from './context/GamesContext';
import { NavLinksProvider } from './context/NavLinksContext';
import { AppsProvider } from './context/AppsContext';
import { ExchangeRateProvider } from './context/ExchangeRateContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { BalanceProvider } from './context/BalanceContext';
import { NotificationProvider } from './context/NotificationContext';
import { SiteConfigProvider } from './context/SiteConfigContext';
import { MerchantDiscountProvider } from './context/MerchantDiscountContext';
import { TickerProvider } from './context/TickerContext';
import ErrorBoundary from './components/GeneralComponents/ErrorBoundary/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <BalanceProvider>
              <PaymentSettingsProvider>
                <StoreSettingsProvider>
                  <ServicesProvider>
                    <GamesProvider>
                      <NavLinksProvider>
                        <AppsProvider>
                          <ExchangeRateProvider>
                            <CurrencyProvider>
                              <TickerProvider>
                                <NotificationProvider>
                                  <SiteConfigProvider>
                                    <TopUpSettingsProvider>
                                      <MerchantDiscountProvider>
                                        <DiscountProvider>
                                          <App />
                                        </DiscountProvider>
                                      </MerchantDiscountProvider>
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
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);