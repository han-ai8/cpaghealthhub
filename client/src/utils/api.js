// src/utils/api.js - UPDATED WITH BETTER ERROR HANDLING
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  const baseUrl = API_URL.replace('/api', '');
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  return `${baseUrl}${cleanPath}`;
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

const api = {
  async get(endpoint) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      // ✅ IMPROVED: Get error details from server
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.error('❌ API Error Response:', errorData);
        
        const error = new Error(errorData.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      return response.json();
    } catch (error) {
      console.error('❌ API Request Failed:', {
        endpoint,
        error: error.message,
        status: error.status,
        data: error.data
      });
      throw error;
    }
  },

  async post(endpoint, data) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.error('❌ API Error Response:', errorData);
        
        const error = new Error(errorData.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      return response.json();
    } catch (error) {
      console.error('❌ API Request Failed:', {
        endpoint,
        error: error.message,
        status: error.status,
        data: error.data
      });
      throw error;
    }
  },

  async put(endpoint, data) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.error('❌ API Error Response:', errorData);
        
        const error = new Error(errorData.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      return response.json();
    } catch (error) {
      console.error('❌ API Request Failed:', {
        endpoint,
        error: error.message,
        status: error.status,
        data: error.data
      });
      throw error;
    }
  },

  async delete(endpoint) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.error('❌ API Error Response:', errorData);
        
        const error = new Error(errorData.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      return response.json();
    } catch (error) {
      console.error('❌ API Request Failed:', {
        endpoint,
        error: error.message,
        status: error.status,
        data: error.data
      });
      throw error;
    }
  },

  async upload(endpoint, formData) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.error('❌ API Error Response:', errorData);
        
        const error = new Error(errorData.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      return response.json();
    } catch (error) {
      console.error('❌ API Request Failed:', {
        endpoint,
        error: error.message,
        status: error.status,
        data: error.data
      });
      throw error;
    }
  }
};

export default api;