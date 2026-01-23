import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import './Login.css';

const API_URL = process.env.REACT_APP_API_URL || '/api/v1';

function SignUp({ onLogin }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if coming from Microsoft OAuth
  const msId = searchParams.get('ms_id');
  const email = searchParams.get('email');
  const name = searchParams.get('name');
  const needSignup = searchParams.get('need_signup');

  const handleMicrosoftSignup = () => {
    setLoading(true);
    // Redirect to Microsoft OAuth - will come back here if user doesn't exist
    window.location.href = `${API_URL}/auth/microsoft/login`;
  };

  const handleCompleteSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/microsoft/complete-signup', {
        ms_id: msId,
        email: email,
        name: name,
        access_code: accessCode,
      });

      // Store token and login
      const { access_token, user } = response.data;
      localStorage.setItem('aiaspeech_token', access_token);
      localStorage.setItem('aiaspeech_user', JSON.stringify(user));

      onLogin();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account');
      setLoading(false);
    }
  };

  // If we have Microsoft info, show access code form
  if (needSignup && msId && email) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>AIA Music</h1>
          <p className="login-subtitle">Complete Your Registration</p>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="signup-info">
            <p>Welcome, <strong>{name}</strong>!</p>
            <p className="signup-email">{email}</p>
          </div>

          <form onSubmit={handleCompleteSignup}>
            <div className="form-group">
              <label>Access Code</label>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter access code to complete signup"
                required
              />
              <small className="form-hint">Contact administrator for access code</small>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>

          <div className="login-toggle">
            <p>
              Already have an account?{' '}
              <button onClick={() => navigate('/')}>Sign In</button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Default signup page - prompt to sign in with Microsoft first
  return (
    <div className="login-container">
      <div className="login-box">
        <h1>AIA Music</h1>
        <p className="login-subtitle">Create Your Account</p>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="signup-instructions">
          <p>To create an account, you'll need:</p>
          <ul>
            <li>A Microsoft account</li>
            <li>An access code from the administrator</li>
          </ul>
        </div>

        {/* Microsoft Sign Up Button */}
        <button
          type="button"
          className="btn btn-microsoft"
          onClick={handleMicrosoftSignup}
          disabled={loading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 23 23">
            <path fill="#f35325" d="M1 1h10v10H1z"/>
            <path fill="#81bc06" d="M12 1h10v10H12z"/>
            <path fill="#05a6f0" d="M1 12h10v10H1z"/>
            <path fill="#ffba08" d="M12 12h10v10H12z"/>
          </svg>
          <span>{loading ? 'Redirecting...' : 'Sign up with Microsoft'}</span>
        </button>

        <div className="login-toggle">
          <p>
            Already have an account?{' '}
            <button onClick={() => navigate('/')}>Sign In</button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
