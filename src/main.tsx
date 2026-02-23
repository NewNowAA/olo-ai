import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

import { ToastProvider } from './contexts/ToastContext';

// Prevent AbortError from Supabase WebSocket disconnects from crashing the app
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.name === 'AbortError') {
    event.preventDefault(); // Silently ignore — these are benign network disconnects
    return;
  }
  // Log other unhandled rejections as warnings instead of crashing
  console.warn('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

const root = createRoot(document.getElementById('root')!);
root.render(
  <BrowserRouter>
    <ToastProvider>
      <App />
    </ToastProvider>
  </BrowserRouter>
);
