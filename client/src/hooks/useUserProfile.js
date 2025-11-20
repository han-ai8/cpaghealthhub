// src/hooks/useUserProfile.js
import { useState, useEffect } from 'react';
import api from '../utils/api';

export const useUserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('❌ useUserProfile - No token found');
        setLoading(false);
        setError('Not authenticated');
        return;
      }

      
      // ✅ FIXED: Use api utility instead of axios
      const response = await api.get('/users/profile');

      if (response.success) {
        // Format the user data consistently
        const formattedUser = {
          _id: response._id || response.id,
          id: response.id || response._id,
          username: response.username,
          email: response.email,
          role: response.role,
          assignedCaseManager: response.assignedCaseManager
        };


        setUser(formattedUser);
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('❌ useUserProfile - Error:', err);
      
      const errorMessage = err.message || 'Failed to fetch profile';
      setError(errorMessage);
      setUser(null);
      
      // If unauthorized, clear token
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        localStorage.removeItem('token');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  return { 
    user, 
    loading, 
    error, 
    refetch: fetchUserProfile 
  };
};