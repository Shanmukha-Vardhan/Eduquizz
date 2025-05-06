// src/frontend/src/pages/Login.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

// --- MODIFICATION: Accept setAuth and setRole as props ---
const Login = ({ setAuth, setRole }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Invalid email or password');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);

      // --- MODIFICATION: Directly update App.jsx state BEFORE navigating ---
      if (typeof setAuth === 'function') {
        console.log("Login.jsx: Calling setAuth(true)");
        setAuth(true);
      }
      if (typeof setRole === 'function') {
        console.log("Login.jsx: Calling setRole with:", data.role);
        setRole(data.role);
      }
      // --- End of Modification ---

      // Navigation paths should be correct from previous fixes
      if (data.role === 'teacher') {
        console.log('Login.jsx: Navigating to /teacher');
        navigate('/teacher');
      } else if (data.role === 'student') {
        console.log('Login.jsx: Navigating to /student');
        navigate('/student');
      } else if (data.role === 'admin') {
        console.log('Login.jsx: Navigating to /admin');
        navigate('/admin');
      } else {
        setError('Unknown role');
      }
    } catch (err) {
      console.error('Login API call failed:', err);
      setError('Something went wrong during login. Please check console or try again.');
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      {error && <div className="error-toast">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="login-button">Login</button>
      </form>
    </div>
  );
};

export default Login;