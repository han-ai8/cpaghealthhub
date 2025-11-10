// utils/passwordValidator.js
export const validatePasswordStrength = (password) => {
  const result = {
    strength: 'critical',
    score: 0,
    feedback: [],
    color: 'error'
  };

  if (!password) {
    result.feedback.push('Password is required');
    return result;
  }

  const length = password.length;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  // Check for common patterns
  const hasSequential = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password);
  const hasKeyboardPattern = /(qwerty|asdfgh|zxcvbn|qazwsx|12345)/i.test(password);
  const isCommon = ['password', 'admin', 'user', '123456', 'qwerty', 'letmein'].some(common => 
    password.toLowerCase().includes(common)
  );

  // Length scoring
  if (length < 8) {
    result.feedback.push('Password must be at least 8 characters');
  } else if (length >= 8 && length < 12) {
    result.score += 1;
  } else if (length >= 12 && length < 16) {
    result.score += 2;
  } else if (length >= 16) {
    result.score += 3;
  }

  // Complexity scoring
  if (hasUpperCase) result.score += 1;
  if (hasLowerCase) result.score += 1;
  if (hasNumbers) result.score += 1;
  if (hasSpecialChar) result.score += 1;

  // Penalty for patterns
  if (hasSequential) {
    result.score -= 1;
    result.feedback.push('Avoid sequential characters (abc, 123)');
  }
  if (hasKeyboardPattern) {
    result.score -= 1;
    result.feedback.push('Avoid keyboard patterns (qwerty, asdfgh)');
  }
  if (isCommon) {
    result.score -= 2;
    result.feedback.push('Avoid common passwords');
  }

  // Determine strength level
  if (result.score <= 2) {
    result.strength = 'critical';
    result.color = 'error';
    result.feedback.push('❌ Critical: Very weak password');
  } else if (result.score <= 4) {
    result.strength = 'medium';
    result.color = 'warning';
    result.feedback.push('⚠️ Medium: Add more complexity');
  } else {
    result.strength = 'strong';
    result.color = 'success';
    result.feedback = ['✅ Strong: Good password!'];
  }

  // Add missing requirements
  if (!hasUpperCase) result.feedback.push('Add uppercase letters');
  if (!hasLowerCase) result.feedback.push('Add lowercase letters');
  if (!hasNumbers) result.feedback.push('Add numbers');
  if (!hasSpecialChar) result.feedback.push('Add special characters (!@#$%^&*)');
  if (length < 12) result.feedback.push('Use at least 12 characters for better security');

  return result;
};

export const getPasswordStrengthColor = (strength) => {
  switch(strength) {
    case 'strong': return 'success';
    case 'medium': return 'warning';
    case 'critical': return 'error';
    default: return 'error';
  }
};

export const getPasswordStrengthPercentage = (score) => {
  const maxScore = 7; // Maximum possible score
  return Math.min(Math.max((score / maxScore) * 100, 0), 100);
};