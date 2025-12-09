import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';

// Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import DoctorDashboard from './components/Doctor/DoctorDashboard';
import PatientLobby from './components/Patient/PatientLobby';
import VideoRoom from './components/VideoCall/VideoRoom';

// Styles
import './styles/global.css';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" />;
  }

  return children;
};

// Home component
const Home = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role === 'doctor') {
    return <Navigate to="/doctor/dashboard" />;
  }

  return <Navigate to="/patient/lobby" />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute requiredRole="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/lobby"
            element={
              <ProtectedRoute requiredRole="patient">
                <PatientLobby />
              </ProtectedRoute>
            }
          />

          <Route
            path="/room/:roomCode"
            element={
              <ProtectedRoute>
                <VideoRoom />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
