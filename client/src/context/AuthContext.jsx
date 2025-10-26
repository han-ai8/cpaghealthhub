// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('✅ No token found - user not logged in');
        setUser(null);
        setLoading(false);
        return;
      }

      console.log('🔍 Checking session with token...');
      
      const data = await api.get('/auth/me');
      
      console.log('✅ Session valid - User:', data.user.username, 'Role:', data.user.role);
      
      // Set user with exact data from backend
      setUser({
        id: data.user.id,
        name: data.user.name || '',
        username: data.user.username,
        email: data.user.email,
        role: data.user.role, // This is the authoritative source
        createdAt: data.user.createdAt
      });
      
    } catch (err) {
      console.error('Session check error:', err);
      
      // If token is invalid, it's already removed by api.js
      if (err.message.includes('expired') || err.message.includes('401')) {
        console.log('❌ Token invalid/expired - clearing session');
        localStorage.removeItem('token');
      }
      
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (email, password, isAdmin = false) => {
    const endpoint = isAdmin ? '/auth/admin/login' : '/auth/user/login';
    
    console.log('🔐 Attempting login:', { email, isAdmin });

    try {
      const data = await api.post(endpoint, { email, password });
      
      console.log('✅ Login successful - User:', data.user.username, 'Role:', data.user.role);
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        console.log('💾 Token stored');
      }
      
      // Set user with exact data from backend response
      setUser({
        id: data.user.id,
        name: data.user.name || '',
        username: data.user.username,
        email: data.user.email,
        role: data.user.role, // Backend is source of truth for role
        createdAt: data.user.createdAt
      });
      
      return data;
    } catch (err) {
      console.error('❌ Login failed:', err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', {});
      console.log('👋 Logged out successfully');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('token');
    }
  };

  const register = async (username, email, password, isAdmin = false) => {
    const endpoint = isAdmin ? '/auth/admin/register' : '/auth/user/register';
    
    console.log('📝 Attempting registration:', { username, email, isAdmin });

    try {
      const data = await api.post(endpoint, { username, email, password });
      
      console.log('✅ Registration successful');
      
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      setUser({
        id: data.user.id,
        name: data.user.name || '',
        username: data.user.username,
        email: data.user.email,
        role: data.user.role,
        createdAt: data.user.createdAt
      });
      
      return data;
    } catch (err) {
      console.error('❌ Registration failed:', err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};