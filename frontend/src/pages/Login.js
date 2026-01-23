import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleOAuthCallback } from '../services/auth';
import './Login.css';

const API_URL = process.env.REACT_APP_API_URL || '/api/v1';

function Login({ onLogin }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const oauthError = urlParams.get('error');
    const errorMessage = urlParams.get('message');

    if (token) {
      handleOAuthCallback(token, urlParams.get('user_id'), urlParams.get('username'));
      window.history.replaceState({}, document.title, window.location.pathname);
      onLogin();
    } else if (oauthError) {
      setError(errorMessage || 'Authentication failed. Please try again.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [onLogin]);

  const handleMicrosoftLogin = () => {
    setLoading(true);
    window.location.href = `${API_URL}/auth/microsoft/login`;
  };

  return (
    <div className="login-page">
      {/* Centered login card */}
      <div className="login-container">
        <div className="login-card">
          {/* Logo/Avatar circle */}
          <div className="login-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>

          {/* Header */}
          <div className="login-header">
            <h1 className="login-title">Welcome to AIA Music</h1>
            <p className="login-subtitle">Sign in to start creating AI-powered music</p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="login-alert login-alert--error">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Microsoft Sign-in - Primary CTA */}
          <button
            type="button"
            className={`btn-microsoft ${loading ? 'loading' : ''}`}
            onClick={handleMicrosoftLogin}
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 23 23">
              <path fill="#f35325" d="M1 1h10v10H1z"/>
              <path fill="#81bc06" d="M12 1h10v10H12z"/>
              <path fill="#05a6f0" d="M1 12h10v10H1z"/>
              <path fill="#ffba08" d="M12 12h10v10H12z"/>
            </svg>
            <span>{loading ? 'Signing in...' : 'Continue with Microsoft'}</span>
          </button>

          {/* Divider */}
          <div className="login-divider">
            <span>Secure authentication</span>
          </div>

          {/* Features */}
          <div className="login-features">
            <div className="login-feature">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
              <span>AI music generation</span>
            </div>
            <div className="login-feature">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
              <span>Multiple voices</span>
            </div>
            <div className="login-feature">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download tracks</span>
            </div>
          </div>

          {/* Sign up link */}
          <div className="login-footer">
            <p>
              Don't have access? <button onClick={() => navigate('/signup')}>Request invite</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
