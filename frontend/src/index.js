import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Unregister service worker — was causing iOS Safari audio stalls.
// Note: InstallPrompt.js's "Install"/"Add to Home Screen" flow is
// independent of this — it's a home-screen launch shortcut, not offline
// caching, so it still works correctly without a service worker.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
      console.log('SW unregistered:', registration.scope);
    });
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
