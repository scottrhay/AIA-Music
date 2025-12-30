import React, { useState } from 'react';
import { login, register } from '../services/auth';
import './Login.css';

function Login({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (isRegistering) {
        await register(formData.username, formData.email, formData.password);
        setSuccess('Account created successfully! Please login.');
        setIsRegistering(false);
        setFormData({ username: '', email: '', password: '' });
      } else {
        await login(formData.username, formData.password);
        onLogin();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Song Management App</h1>
        <p className="login-subtitle">Music Creation Platform</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          {isRegistering && (
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary">
            {isRegistering ? 'Register' : 'Login'}
          </button>
        </form>

        <div className="login-toggle">
          {isRegistering ? (
            <p>
              Already have an account?{' '}
              <button onClick={() => setIsRegistering(false)}>Login</button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button onClick={() => setIsRegistering(true)}>Register</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
