import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';

// Prevent Supabase internal errors from crashing the app
window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason?.message || '';
  if (
    event.reason?.name === 'AbortError' ||
    msg.includes('LockManager') ||
    msg.includes('navigator.locks')
  ) {
    event.preventDefault();
    return;
  }
  console.warn('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

const root = createRoot(document.getElementById('root')!);
root.render(
  <BrowserRouter>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>
);
