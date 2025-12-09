import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { roomAPI } from '../../services/api';
import './Doctor.css';

const DoctorDashboard = () => {
  const [roomPassword, setRoomPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdRoom, setCreatedRoom] = useState(null);
  const [error, setError] = useState('');

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await roomAPI.createRoom({
        password: roomPassword,
        maxParticipants: 2,
      });

      const room = response.data.data;
      setCreatedRoom(room);

      setTimeout(() => {
        navigate(`/room/${room.room_code}`);
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>🏥 Doctor Dashboard</h1>
          <p>Welcome, Dr. {user?.fullName}</p>
        </div>
        <button onClick={logout} className="btn-logout">
          Logout
        </button>
      </header>

      <div className="dashboard-content">
        <div className="create-room-card">
          <div className="card-header">
            <h2>Create Consultation Room</h2>
            <p>Set a password and start accepting patients</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          {createdRoom ? (
            <div className="success-message">
              <h3>✅ Room Created Successfully!</h3>
              <div className="room-details">
                <p><strong>Room Code:</strong> {createdRoom.room_code}</p>
                <p><strong>Status:</strong> Waiting for patient...</p>
                <p className="redirect-text">Redirecting to room...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateRoom} className="room-form">
              <div className="form-group">
                <label>Room Password</label>
                <input
                  type="password"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  placeholder="Enter secure password"
                  required
                  minLength="6"
                />
                <small>Patients will need this password to join</small>
              </div>

              <button 
                type="submit" 
                className="btn-create-room" 
                disabled={loading}
              >
                {loading ? 'Creating Room...' : '🎥 Create Room & Start'}
              </button>
            </form>
          )}

          <div className="features-grid">
            <div className="feature-item">
              <span>🔐</span>
              <h4>Encrypted</h4>
              <p>End-to-end encryption</p>
            </div>
            <div className="feature-item">
              <span>🌐</span>
              <h4>TURN Relay</h4>
              <p>Works behind firewalls</p>
            </div>
            <div className="feature-item">
              <span>📱</span>
              <h4>Responsive</h4>
              <p>Desktop & mobile ready</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
