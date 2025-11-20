// src/utils/imageHelper.js - Image URL Helper
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Get proper image URL for post images
 * Handles both base64 encoded images and file paths
 */
export const getPostImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If it's already a base64 data URI, return as is
  if (imagePath.startsWith('data:image')) {
    return imagePath;
  }
  
  // If it's a full URL (http/https), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it starts with /uploads, construct full URL
  if (imagePath.startsWith('/uploads')) {
    return `${API_URL}${imagePath}`;
  }
  
  // Otherwise, assume it's relative path and prepend API URL
  return `${API_URL}/uploads/${imagePath.replace(/^\/+/, '')}`;
};

/**
 * Check if image URL is valid
 */
export const isValidImageUrl = (url) => {
  if (!url) return false;
  return url.startsWith('data:image') || 
         url.startsWith('http://') || 
         url.startsWith('https://') ||
         url.includes('/uploads/');
};