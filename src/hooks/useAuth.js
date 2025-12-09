import { useState, useEffect, createContext, useContext } from 'react';
import { authAPI } from '../services/api';
import socketService from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await authAPI.getProfile();
          setUser(response.data.data);
          socketService.connect(token);
        } catch (err) {
          console.error('Load user error:', err);
          localStorage.clear();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const register = async (data) => {
    try {
      setError(null);
      const response = await authAPI.register(data);
      const { user, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(user);

      socketService.connect(accessToken);

      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login({ email, password });
      const { user, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(user);

      socketService.connect(accessToken);

      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    socketService.disconnect();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
