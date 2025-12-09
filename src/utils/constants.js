const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export { API_BASE_URL, SOCKET_URL };

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DOCTOR_DASHBOARD: '/doctor/dashboard',
  PATIENT_LOBBY: '/patient/lobby',
  VIDEO_ROOM: '/room/:roomCode',
};

export const ROLES = {
  DOCTOR: 'doctor',
  PATIENT: 'patient',
};
