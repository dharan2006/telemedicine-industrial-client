import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { roomAPI } from '../../services/api';
import socketService from '../../services/socket';
import './Patient.css';

const PatientLobby = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadRooms();

    // Listen for room updates
    socketService.onRoomsUpdated((updatedRooms) => {
      setRooms(updatedRooms);
    });

    // Cleanup
    return () => {
      // Socket listeners are handled by service
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRooms = async () => {
    try {
      const response = await roomAPI.getActiveRooms();
      setRooms(response.data.data);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClick = (room) => {
    setSelectedRoom(room);
    setPassword('');
    setError('');
    setShowPasswordModal(true);
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await roomAPI.verifyRoom({
        roomCode: selectedRoom.room_code,
        password,
      });

      console.log('Verify response:', response.data);

      if (response.data.success) {
        // Close modal and navigate
        setShowPasswordModal(false);
        navigate(`/room/${selectedRoom.room_code}`);
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      console.error('Join room error:', err);
      const errorMsg = err.response?.data?.error || 'Invalid password';
      setError(errorMsg);
    }
  };

  return (
    <div className="lobby-container">
      <header className="lobby-header">
        <div>
          <h1>🏥 Available Doctors</h1>
          <p>Welcome, {user?.fullName}</p>
        </div>
        <button onClick={logout} className="btn-logout">
          Logout
        </button>
      </header>

      <div className="lobby-content">
        {loading ? (
          <div className="loading">Loading available doctors...</div>
        ) : rooms.length === 0 ? (
          <div className="empty-state">
            <h2>No Doctors Online</h2>
            <p>Please check back later or contact your doctor directly</p>
          </div>
        ) : (
          <div className="rooms-grid">
            {rooms.map((room) => (
              <div key={room.id} className="room-card">
                <div className="room-icon">👨‍⚕️</div>
                <h3>{room.doctor_name}</h3>
                <p className="room-email">{room.doctor_email}</p>
                {room.license_number && (
                  <p className="room-license">License: {room.license_number}</p>
                )}
                <div className="room-status">
                  <span className="status-dot"></span>
                  {room.status === 'waiting' ? 'Available Now' : 'In Call'}
                </div>
                <button
                  onClick={() => handleJoinClick(room)}
                  className="btn-join"
                  disabled={room.status === 'active'}
                >
                  {room.status === 'waiting' ? 'Join Consultation' : 'Busy'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Enter Room Password</h2>
            <p>Joining consultation with {selectedRoom?.doctor_name}</p>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleJoinRoom}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password provided by doctor"
                autoFocus
                required
              />

              <div className="modal-buttons">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Join Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientLobby;
