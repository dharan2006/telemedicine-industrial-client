import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      // Redirect based on role
      if (user?.role === 'doctor') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/patient/lobby');
      }
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🏥 TeleMedicine</h1>
          <p>Industrial-Grade Video Consultation</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Login</h2>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p className="auth-footer">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </form>

        <div className="auth-features">
          <div className="feature">
            <span>🔐</span>
            <p>End-to-End Encrypted</p>
          </div>
          <div className="feature">
            <span>🌐</span>
            <p>TURN Server Fallback</p>
          </div>
          <div className="feature">
            <span>📱</span>
            <p>Mobile Responsive</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
