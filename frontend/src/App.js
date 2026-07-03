import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './theme/theme.css';
import Login from './pages/Login';
import HomePremium from './pages/HomePremium';
import ManageStyles from './pages/ManageStyles';
import ManagePlaylists from './pages/ManagePlaylists';
import MusicPlayer from './pages/MusicPlayer';
import SignUp from './pages/SignUp';
import InstallPrompt from './components/InstallPrompt';
import { getToken, removeToken, exchangeLoginCode } from './services/auth';
import { isMobileDevice } from './services/playbackState';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileRedirect, setMobileRedirect] = useState(false);

  useEffect(() => {
    // Detect mobile device — only redirect on fresh app open (no referrer = new session)
    const mobile = isMobileDevice();
    setIsMobile(mobile);
    if (mobile && !sessionStorage.getItem('mobileRedirected')) {
      sessionStorage.setItem('mobileRedirected', '1');
      setMobileRedirect(true);
    }

    // Check for OAuth callback params first
    const urlParams = new URLSearchParams(window.location.search);
    const loginCode = urlParams.get('login_code');

    if (loginCode) {
      // OAuth callback - exchange the one-time code for a real token
      exchangeLoginCode(loginCode)
        .then(() => setIsAuthenticated(true))
        .catch(() => setIsAuthenticated(false))
        .finally(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          setIsLoading(false);
        });
      return;
    }

    // Check if user is authenticated on mount
    setIsAuthenticated(!!getToken());
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    removeToken();
    setIsAuthenticated(false);
  };

  // Show nothing while checking auth to prevent flash
  if (isLoading) {
    return null;
  }

  return (
    <Router>
      <InstallPrompt />
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" />
            ) : (
              <Login onLogin={() => setIsAuthenticated(true)} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            isAuthenticated ? (
              <Navigate to="/" />
            ) : (
              <SignUp onLogin={() => setIsAuthenticated(true)} />
            )
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              mobileRedirect ? <Navigate to="/player" replace /> : <HomePremium onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/styles"
          element={
            isAuthenticated ? (
              <ManageStyles onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/playlists"
          element={
            isAuthenticated ? (
              <ManagePlaylists onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/player"
          element={
            isAuthenticated ? (
              <MusicPlayer onLogout={handleLogout} autoResume={isMobile} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
