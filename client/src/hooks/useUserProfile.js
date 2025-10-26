import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

      console.log('📡 useUserProfile - Fetching user profile...');
      console.log('📡 useUserProfile - API URL:', `${API_URL}/users/profile`);
      console.log('📡 useUserProfile - Token exists:', !!token);
      
      const response = await axios.get(`${API_URL}/users/profile`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ useUserProfile - Response:', response.data);

      if (response.data.success) {
        // Format the user data consistently
        const formattedUser = {
          _id: response.data._id || response.data.id,
          id: response.data.id || response.data._id,
          username: response.data.username,
          email: response.data.email,
          role: response.data.role,
          assignedCaseManager: response.data.assignedCaseManager
        };

        console.log('✅ useUserProfile - Formatted user:', formattedUser);
        console.log('✅ useUserProfile - Case Manager ID:', formattedUser.assignedCaseManager);
        console.log('✅ useUserProfile - Case Manager Type:', typeof formattedUser.assignedCaseManager);

        setUser(formattedUser);
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('❌ useUserProfile - Error:', err);
      console.error('❌ useUserProfile - Error Response:', err.response?.data);
      console.error('❌ useUserProfile - Error Status:', err.response?.status);
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch profile';
      setError(errorMessage);
      setUser(null);
      
      // If unauthorized, clear token
      if (err.response?.status === 401) {
        console.log('🔒 useUserProfile - Unauthorized, clearing token');
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