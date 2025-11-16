// src/utils/profanityFilter.js
// Frontend version - Username and password validation utilities

/**
 * INAPPROPRIATE WORDS FILTER
 * Blocks profanity, system terms, and privacy-sensitive words
 */
export const inappropriateWords = [
  // System/Admin terms (prevent impersonation)
  'admin', 'administrator', 'moderator', 'mod', 'cpag', 'healthub',
  'support', 'staff', 'official', 'system',
  
  // Profanity
  'fuck', 'shit', 'damn', 'ass', 'bitch', 'bastard', 'dick', 'cock',
  'pussy', 'cunt', 'whore', 'slut',
  
  // Hate speech
  'nigger', 'nigga', 'faggot', 'fag', 'retard',
  
  // Violence
  'rape', 'nazi', 'hitler', 'kill', 'murder', 'suicide', 'arcy', 'boy', 'lunas', 'aah daddy', 'koyah natanggal',
  
  // Drugs
  'drug', 'cocaine', 'heroin', 'meth',
  
  // Health terms (for privacy)
  'hiv', 'aids', 'positive', 'negative', 'infected', 'disease', 'patient',
];

/**
 * REAL NAME PATTERNS
 * Detects common real name formats
 */
export const realNamePatterns = [
  /^[A-Z][a-z]+[A-Z][a-z]+$/,      // JohnSmith
  /^[A-Z][a-z]+\s[A-Z][a-z]+$/,    // John Smith
  /^[A-Z]\.[A-Z]\./,                // J.K.
  /^[A-Z][a-z]+_[A-Z][a-z]+$/,     // John_Smith
];

/**
 * VALIDATE USERNAME
 * @param {string} username - Username to validate
 * @returns {array} errors - Array of error messages (empty if valid)
 */
export const validateUsername = (username) => {
  const errors = [];
  
  if (username.length < 3) {
    errors.push('Username must be at least 3 characters');
  }
  if (username.length > 20) {
    errors.push('Username must not exceed 20 characters');
  }
  
  if (/\s/.test(username)) {
    errors.push('Username cannot contain spaces');
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, underscore, and hyphen');
  }
  
  const lowerUsername = username.toLowerCase();
  const foundInappropriate = inappropriateWords.find(word => 
    lowerUsername.includes(word)
  );
  
  if (foundInappropriate) {
    errors.push('Username contains inappropriate or restricted words');
  }
  
  const seemsLikeRealName = realNamePatterns.some(pattern => pattern.test(username));
  if (seemsLikeRealName) {
    errors.push('Username appears to be a real name. Please use a pseudonym for privacy');
  }
  
  if (/^\d+$/.test(username)) {
    errors.push('Username cannot be only numbers');
  }
  
  return errors;
};

/**
 * CALCULATE PASSWORD STRENGTH
 * @param {string} password - Password to check
 * @returns {object} - Strength details and level
 */
export const calculatePasswordStrength = (password) => {
  let strength = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };
  
  if (checks.length) strength += 20;
  if (password.length >= 12) strength += 10;
  if (checks.uppercase) strength += 20;
  if (checks.lowercase) strength += 20;
  if (checks.number) strength += 15;
  if (checks.special) strength += 15;
  
  let level = 'weak';
  let color = 'text-red-500';
  let bgColor = 'bg-red-500';
  
  if (strength >= 80) {
    level = 'strong';
    color = 'text-green-500';
    bgColor = 'bg-green-500';
  } else if (strength >= 50) {
    level = 'medium';
    color = 'text-yellow-500';
    bgColor = 'bg-yellow-500';
  }
  
  return { strength, level, color, bgColor, checks };
};