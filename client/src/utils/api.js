// src/utils/api.js
// Centralized API client with automatic JWT token handling

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Makes an authenticated API request with automatic token handling
 */
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  };

  // Add Authorization header if token exists
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  // Remove Content-Type for FormData
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  } else if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
    const response = await fetch(url, config);
    
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      console.error('401 Unauthorized - clearing token and redirecting to login');
      localStorage.removeItem('token');
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please login again.');
    }

    // Handle 403 Forbidden
    if (response.status === 403) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.msg || 'Access denied. Insufficient permissions.');
    }

    // Parse response
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.msg || data.error || data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Convenience methods
const api = {
  get: (endpoint, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'GET' }),
  
  post: (endpoint, body, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'POST', body }),
  
  put: (endpoint, body, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'PUT', body }),
  
  delete: (endpoint, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'DELETE' }),

  // For file uploads (multipart/form-data)
  upload: (endpoint, formData, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'POST', body: formData }),
};

export default api;
export { api, apiRequest };