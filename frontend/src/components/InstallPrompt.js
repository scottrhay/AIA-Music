import React, { useState, useEffect } from 'react';
import './InstallPrompt.css';

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone === true;
    setIsStandalone(standalone);

    if (standalone) {
      return; // Don't show prompt if already installed
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Check if user has dismissed recently
    const dismissedTime = localStorage.getItem('install-prompt-dismissed');
    if (dismissedTime) {
      const daysSinceDismiss = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) {
        return; // Don't show again for 7 days
      }
    }

    if (iOS) {
      // Show iOS instructions after some usage
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 60000); // Show after 1 minute
      return () => clearTimeout(timer);
    }

    // Listen for beforeinstallprompt (Chrome, Edge, etc.)
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show after some usage
      setTimeout(() => {
        setShowPrompt(true);
      }, 120000); // Show after 2 minutes
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('install-prompt-dismissed', Date.now().toString());
  };

  // Don't render if already installed or prompt shouldn't show
  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="install-prompt">
      <div className="install-prompt__content">
        <div className="install-prompt__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>

        <div className="install-prompt__text">
          <h3 className="install-prompt__title">Install AIA Music</h3>
          {isIOS ? (
            <p className="install-prompt__description">
              Tap <span className="install-prompt__share-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M12 2l3.5 3.5-1.41 1.41L12 4.83l-2.09 2.08L8.5 5.5 12 2zm0 5.17L15.5 11l-1.41 1.41L12 10.33l-2.09 2.08L8.5 11 12 7.17zM5 15h14v2H5v-2z"/>
                </svg>
              </span> then <strong>"Add to Home Screen"</strong>
            </p>
          ) : (
            <p className="install-prompt__description">
              Get quick access from your home screen
            </p>
          )}
        </div>

        <div className="install-prompt__actions">
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstall}
              className="install-prompt__btn install-prompt__btn--primary"
            >
              Install
            </button>
          )}
          <button
            onClick={dismissPrompt}
            className="install-prompt__btn install-prompt__btn--secondary"
          >
            Not Now
          </button>
        </div>

        <button
          onClick={dismissPrompt}
          className="install-prompt__close"
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default InstallPrompt;
