import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'patient',
    phone: '',
    licenseNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(formData);

    if (result.success) {
      if (formData.role === 'doctor') {
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
          <p>Create Your Account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Register</h2>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>I am a</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Dr. John Smith"
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@hospital.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password (min 8 characters)</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              minLength="8"
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91-9876543210"
            />
          </div>

          {formData.role === 'doctor' && (
            <div className="form-group">
              <label>License Number</label>
              <input
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                placeholder="MED12345"
              />
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
