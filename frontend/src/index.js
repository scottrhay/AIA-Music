import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Unregister service worker — was causing iOS Safari audio stalls
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
