// utils/philippineTimeHelper.js - Philippine Timezone Helper Utility
// This utility ensures all date/time operations use Philippine Standard Time (GMT+8)

/**
 * Get current date and time in Philippine timezone
 * @returns {Date} Current date/time in Philippine timezone
 */
export const getPhilippineDate = () => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
};

/**
 * Format date to Philippine timezone string
 * @param {Date|string} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatPhilippineDate = (date, options = {}) => {
  const defaultOptions = {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    ...options
  };
  
  return new Date(date).toLocaleString('en-US', defaultOptions);
};

/**
 * Get current date in YYYY-MM-DD format (Philippine timezone)
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const getPhilippineDateString = () => {
  const phDate = getPhilippineDate();
  const year = phDate.getFullYear();
  const month = String(phDate.getMonth() + 1).padStart(2, '0');
  const day = String(phDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get current time in HH:MM AM/PM format (Philippine timezone)
 * @returns {string} Time string in HH:MM AM/PM format
 */
export const getPhilippineTimeString = () => {
  const phDate = getPhilippineDate();
  return phDate.toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Check if a date is in the past (Philippine timezone)
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export const isDateInPast = (date) => {
  const inputDate = new Date(date);
  const today = getPhilippineDate();
  today.setHours(0, 0, 0, 0);
  inputDate.setHours(0, 0, 0, 0);
  return inputDate < today;
};

/**
 * Check if a date is today (Philippine timezone)
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  const inputDate = new Date(date);
  const today = getPhilippineDate();
  return inputDate.toDateString() === today.toDateString();
};

/**
 * Check if a date is a weekend
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is Saturday or Sunday
 */
export const isWeekend = (date) => {
  const day = new Date(date).getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

/**
 * Get day of week for a date
 * @param {string|Date} date - Date to check
 * @returns {string} Day name (e.g., 'Monday', 'Tuesday')
 */
export const getDayOfWeek = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    timeZone: 'Asia/Manila',
    weekday: 'long'
  });
};

/**
 * Check if current time is within business hours (9 AM - 6 PM, Mon-Sat)
 * @returns {object} { isBusinessHours: boolean, message: string }
 */
export const getBusinessHoursStatus = () => {
  const now = getPhilippineDate();
  const day = now.getDay();
  const hour = now.getHours();

  // Sunday
  if (day === 0) {
    return {
      isBusinessHours: false,
      message: 'Clinic is closed on Sundays'
    };
  }

  // Monday-Saturday, 9 AM - 6 PM
  if (hour >= 9 && hour < 18) {
    return {
      isBusinessHours: true,
      message: 'Clinic is open'
    };
  }

  return {
    isBusinessHours: false,
    message: 'Clinic is currently closed. Business hours: Mon-Sat, 9 AM - 6 PM'
  };
};

/**
 * Get Philippine timezone information
 * @returns {object} Timezone information
 */
export const getTimezoneInfo = () => {
  return {
    timezone: 'Asia/Manila',
    offset: '+08:00',
    abbreviation: 'PHT',
    name: 'Philippine Standard Time'
  };
};

export default {
  getPhilippineDate,
  formatPhilippineDate,
  getPhilippineDateString,
  getPhilippineTimeString,
  isDateInPast,
  isToday,
  isWeekend,
  getDayOfWeek,
  getBusinessHoursStatus,
  getTimezoneInfo
};