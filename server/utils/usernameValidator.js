// utils/usernameValidator.js

// List of inappropriate words (add more as needed)
const inappropriateWords = [
  'admin', 'root', 'moderator', 'administrator',
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'hell',
  'nigger', 'nazi', 'hitler', 'terrorist',
  'sex', 'porn', 'xxx', 'rape', 'kill', 'death',
  'drug', 'cocaine', 'heroin', 'meth'
];

// Common real name patterns
const realNamePatterns = [
  /^[A-Z][a-z]+\s[A-Z][a-z]+$/, // FirstName LastName
  /^[A-Z][a-z]+\.[A-Z][a-z]+$/, // FirstName.LastName
  /^[A-Z][a-z]+_[A-Z][a-z]+$/   // FirstName_LastName
];

export const validateUsername = (username) => {
  const errors = [];
  const warnings = [];

  if (!username) {
    errors.push('Username is required');
    return { isValid: false, errors, warnings };
  }

  // Length check
  if (username.length < 3) {
    errors.push('Username must be at least 3 characters');
  }
  if (username.length > 20) {
    errors.push('Username must not exceed 20 characters');
  }

  // Character validation
  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, dots, hyphens, and underscores');
  }

  // Check for inappropriate words
  const lowerUsername = username.toLowerCase();
  const foundInappropriate = inappropriateWords.filter(word => 
    lowerUsername.includes(word)
  );
  
  if (foundInappropriate.length > 0) {
    errors.push('Username contains inappropriate or harmful words');
  }

  // Check if it looks like a real name
  const looksLikeRealName = realNamePatterns.some(pattern => 
    pattern.test(username)
  );
  
  if (looksLikeRealName) {
    warnings.push('⚠️ Your username looks like a real name. For privacy, consider using a pseudonym');
  }

  // Check if it contains common name indicators
  if (/^(mr|ms|mrs|dr|prof)[\._-]/i.test(username)) {
    warnings.push('⚠️ Avoid using titles or formal names for better anonymity');
  }

  // Check for personal info patterns
  if (/\d{4}/.test(username)) {
    warnings.push('⚠️ Avoid using birth years or dates in your username');
  }

  // Check if starts/ends with inappropriate characters
  if (/^[._-]/.test(username) || /[._-]$/.test(username)) {
    errors.push('Username cannot start or end with special characters');
  }

  // Check for consecutive special characters
  if (/[._-]{2,}/.test(username)) {
    errors.push('Username cannot have consecutive special characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const getUsernameSuggestions = (username) => {
  const baseUsername = username.replace(/[^a-zA-Z0-9]/g, '');
  const suggestions = [];
  
  const adjectives = ['cool', 'epic', 'super', 'pro', 'star', 'ace', 'swift', 'zen'];
  const nouns = ['user', 'player', 'ninja', 'wolf', 'dragon', 'phoenix', 'shadow', 'storm'];
  
  // Add random adjective + base
  suggestions.push(`${adjectives[Math.floor(Math.random() * adjectives.length)]}${baseUsername}`);
  
  // Add base + random noun
  suggestions.push(`${baseUsername}${nouns[Math.floor(Math.random() * nouns.length)]}`);
  
  // Add base + random number
  suggestions.push(`${baseUsername}${Math.floor(Math.random() * 999) + 1}`);
  
  return suggestions.slice(0, 3);
};