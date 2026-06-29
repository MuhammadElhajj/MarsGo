// src/main.jsx
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/GeneralComponents/ErrorBoundary/ErrorBoundary';
import LoadingSpinner from './components/GeneralComponents/LoadingSpinner/LoadingSpinner';
import './index.css';

// Zustand store manages state centrally - no need for additional wrappers
const root = createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <Suspense fallback={<LoadingSpinner fullScreen />}>
              <App />
            </Suspense>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>
);