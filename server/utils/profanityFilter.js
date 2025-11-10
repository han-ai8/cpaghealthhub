// backend/utils/profanityFilter.js
// Backend version - Server-side validation utilities

/**
 * INAPPROPRIATE WORDS FILTER
 * Blocks profanity, system terms, and privacy-sensitive words
 */
export const inappropriateWords = [
  // System/Admin terms (prevent impersonation)
  'admin', 'administrator', 'moderator', 'mod', 'cpag', 'healthub',
  'support', 'staff', 'official', 'system', 'root', 'superuser',
  
  // Profanity
  'fuck', 'fucking', 'fucker', 'shit', 'damn', 'ass', 'asshole',
  'bitch', 'bastard', 'dick', 'cock', 'pussy', 'cunt', 'whore', 'slut',
  
  // Hate speech & slurs
  'nigger', 'nigga', 'faggot', 'fag', 'dyke', 'tranny', 'retard', 'retarded',
  
  // Violence & threats
  'rape', 'rapist', 'nazi', 'hitler', 'kill', 'murder', 'suicide', 'bomb',
  'terrorist',
  
  // Drugs
  'drug', 'drugs', 'cocaine', 'heroin', 'meth', 'weed', 'marijuana',
  
  // Health terms (for privacy)
  'hiv', 'aids', 'positive', 'negative', 'infected', 'infection',
  'disease', 'patient', 'sick', 'diagnosed',
];

/**
 * REAL NAME PATTERNS
 * Regex patterns to detect common real name formats
 */
export const realNamePatterns = [
  /^[A-Z][a-z]+[A-Z][a-z]+$/,      // JohnSmith
  /^[A-Z][a-z]+\s[A-Z][a-z]+$/,    // John Smith
  /^[A-Z]\.[A-Z]\./,                // J.K.
  /^[A-Z][a-z]+_[A-Z][a-z]+$/,     // John_Smith
  /^[A-Z][a-z]+-[A-Z][a-z]+$/,     // John-Smith
  /^[A-Z][a-z]+\d{2,4}$/,          // John1990
];

/**
 * USERNAME VALIDATION FUNCTION
 * @param {string} username - Username to validate
 * @returns {array} errors - Array of error messages (empty if valid)
 */
export const validateUsername = (username) => {
  const errors = [];
  
  // Check length
  if (username.length < 3) {
    errors.push('Username must be at least 3 characters');
  }
  if (username.length > 20) {
    errors.push('Username must not exceed 20 characters');
  }
  
  // Check for spaces
  if (/\s/.test(username)) {
    errors.push('Username cannot contain spaces');
  }
  
  // Check for valid characters
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, underscore, and hyphen');
  }
  
  // Check for inappropriate words
  const lowerUsername = username.toLowerCase();
  const foundInappropriate = inappropriateWords.find(word => 
    lowerUsername.includes(word.toLowerCase())
  );
  
  if (foundInappropriate) {
    errors.push('Username contains inappropriate, offensive, or restricted words. Please choose a different username.');
  }
  
  // Check for real name patterns
  const seemsLikeRealName = realNamePatterns.some(pattern => pattern.test(username));
  if (seemsLikeRealName) {
    errors.push('For your privacy and safety, please do not use your real name. Choose a pseudonym or nickname instead.');
  }
  
  // Check if username is only numbers
  if (/^\d+$/.test(username)) {
    errors.push('Username cannot be only numbers. Please include letters.');
  }
  
  // Check for generic usernames
  const genericUsernames = ['user', 'anonymous', 'guest', 'test', 'default'];
  if (genericUsernames.includes(lowerUsername)) {
    errors.push('This username is too generic. Please choose something more unique.');
  }
  
  return errors;
};

/**
 * PASSWORD STRENGTH VALIDATOR
 * @param {string} password - Password to check
 * @returns {object} - Errors and warnings
 */
export const validatePasswordStrength = (password) => {
  const errors = [];
  const warnings = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  // Recommendations for stronger password
  if (!/[A-Z]/.test(password)) {
    warnings.push('Consider adding uppercase letters for a stronger password');
  }
  if (!/[a-z]/.test(password)) {
    warnings.push('Consider adding lowercase letters for a stronger password');
  }
  if (!/[0-9]/.test(password)) {
    warnings.push('Consider adding numbers for a stronger password');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    warnings.push('Consider adding special characters for a stronger password');
  }
  
  return { errors, warnings };
};

/**
 * SANITIZE USERNAME
 * Remove any potentially harmful characters
 * @param {string} username - Username to sanitize
 * @returns {string} - Sanitized username
 */
export const sanitizeUsername = (username) => {
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, ''); // Remove all except allowed chars
};

export default {
  inappropriateWords,
  realNamePatterns,
  validateUsername,
  validatePasswordStrength,
  sanitizeUsername
};