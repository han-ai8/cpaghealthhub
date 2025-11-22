// register.jsx - Enhanced with proper email validation
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { Eye, EyeOff, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import api from '../../utils/api';
import ideaImage from '../../assets/idea-new.png';
import logoImage from '../../assets/logo-header.png';

// Profanity/Inappropriate words filter (ONLY for usernames)
const inappropriateWords = [
  'admin', 'administrator', 'moderator', 'cpag', 'healthub',
  'fuck', 'shit', 'damn', 'ass', 'bitch', 'bastard', 'dick', 'cock',
  'pussy', 'cunt', 'whore', 'slut', 'nigger', 'nigga', 'faggot', 'fag',
  'retard', 'rape', 'nazi', 'hitler', 'kill', 'death', 'suicide',
  'hiv', 'aids', 'positive', 'negative', 'infected', 'disease'
];

// Common real name patterns
const realNamePatterns = [
  /^[A-Z][a-z]+[A-Z][a-z]+$/, // JohnSmith pattern
  /^[A-Z][a-z]+\s[A-Z][a-z]+$/, // John Smith pattern
  /^[A-Z]\.[A-Z]\./, // J.K. pattern
];

// ✅ USERNAME validation function (NOT for emails!)
const validateUsername = (username) => {
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
  
  // ✅ Only letters, numbers, underscore, hyphen for USERNAME
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, underscore, and hyphen');
  }
  
  return errors;
};

// ✅ EMAIL validation function (separate from username)
const validateEmail = (email) => {
  const errors = [];
  
  // Basic email format check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!email) {
    errors.push('Email is required');
    return errors;
  }
  
  if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }
  
  // Check for double dots
  if (/\.\./.test(email)) {
    errors.push('Email cannot contain consecutive dots');
  }
  
  // Check if starts/ends with dot
  const localPart = email.split('@')[0];
  if (localPart && (localPart.startsWith('.') || localPart.endsWith('.'))) {
    errors.push('Email cannot start or end with a dot');
  }
  
  return errors;
};

// Password strength calculator
const calculatePasswordStrength = (password) => {
  let strength = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
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

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', agree: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('terms');
  const [showPassword, setShowPassword] = useState(false);
  const [usernameErrors, setUsernameErrors] = useState([]);
  const [emailErrors, setEmailErrors] = useState([]);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  // Real-time username validation
  useEffect(() => {
    if (form.username) {
      const errors = validateUsername(form.username);
      setUsernameErrors(errors);
    } else {
      setUsernameErrors([]);
    }
  }, [form.username]);

  // ✅ Real-time email validation
  useEffect(() => {
    if (form.email) {
      const errors = validateEmail(form.email);
      setEmailErrors(errors);
    } else {
      setEmailErrors([]);
    }
  }, [form.email]);

  // Real-time password strength checking
  useEffect(() => {
    if (form.password) {
      const strength = calculatePasswordStrength(form.password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(null);
    }
  }, [form.password]);

  // ✅ Updated handleChange - proper email handling
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'email') {
      // ✅ For email: only lowercase and trim - KEEP ALL VALID CHARACTERS
      setForm(prev => ({
        ...prev,
        [name]: value.toLowerCase().trim()
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    if (name === 'agree' && checked) {
      setShowModal(true);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    
    // Validate username
    const usernameValidationErrors = validateUsername(form.username);
    if (usernameValidationErrors.length > 0) {
      toast.error(usernameValidationErrors[0]);
      return;
    }
    
    // ✅ Validate email
    const emailValidationErrors = validateEmail(form.email);
    if (emailValidationErrors.length > 0) {
      toast.error(emailValidationErrors[0]);
      return;
    }
    
    // Validate password strength
    if (!form.password || form.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    if (passwordStrength && passwordStrength.level === 'weak') {
      toast.warning('Your password is weak. Consider using a stronger password with uppercase, numbers, and special characters.');
    }
    
    // Validate agreement
    if (!form.agree) {
      toast.error('You must agree to the terms and conditions');
      return;
    }
    
    setLoading(true);
    
    try {
      const data = await api.post('/auth/user/register', {
        username: form.username,
        email: form.email,
        password: form.password
      });
      
      if (data.requiresVerification) {
        toast.success('Registration successful! Please check your email for verification code.');
        localStorage.setItem('verificationEmail', form.email);
        setTimeout(() => {
          navigate('/user/verify-email', { 
            state: { email: form.email } 
          });
        }, 1500);
      } else {
        toast.success('Account created successfully! Please log in to continue.');
        setTimeout(() => {
          navigate('/user/login');
        }, 1500);
      }
    } catch (err) {
      console.error('Registration error:', err);
      const errorMsg = err.message || 'Registration failed';
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row min-h-screen bg-base-100">
        {/* Left Side */}
        <div className="w-full md:w-1/2 bg-[#4c8dd8] flex flex-col items-center justify-center p-8 md:p-12 shadow-xl">
          <h1 className="mb-6">
            <img 
              src={ideaImage}
              alt="HealthHub Promotion" 
              className="w-200 h-200 rounded-3xl hover:scale-105" 
            />
          </h1>
        </div>

        {/* Right Side */}
        <div className="w-full md:w-1/2 bg-base-100 flex flex-col items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-md mx-auto space-y-6">
            <div className="text-center justify-center items-center flex flex-col">
              <img 
                src={logoImage}
                alt="HealthHub Logo" 
                className="rounded-lg w-500 h-300 hover:scale-105 mb-4" 
              />
              <h2 className="text-3xl md:text-4xl font-bold mb-2 text-[#4c8dd8]">Welcome!</h2>
              <p className="text-base-content/70">Please enter your details to create a user account.</p>
            </div>

            {error && (
              <div className="alert alert-error shadow-lg">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div className="space-y-2">
                <label className="label">
                  <span className="label-text font-semibold">Username</span>
                </label>
                <input 
                  name="username" 
                  placeholder="Choose a unique username" 
                  value={form.username}
                  onChange={handleChange} 
                  required
                  minLength={3}
                  maxLength={20}
                  className={`input input-bordered w-full input-lg ${
                    usernameErrors.length > 0 && form.username ? 'input-error' : ''
                  } ${
                    form.username && usernameErrors.length === 0 ? 'input-success' : ''
                  }`}
                />
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs space-y-1">
                  <p className="font-semibold text-blue-800 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Username Guidelines (For Your Privacy & Safety):
                  </p>
                  <ul className="list-disc list-inside text-blue-700 space-y-0.5 ml-2">
                    <li>DO NOT use your real name</li>
                    <li>Use 3-20 characters (letters, numbers, _, -)</li>
                    <li>Create a unique pseudonym or nickname</li>
                    <li>Avoid inappropriate or offensive words</li>
                  </ul>
                </div>

                {form.username && usernameErrors.length > 0 && (
                  <div className="space-y-1">
                    {usernameErrors.map((error, index) => (
                      <div key={index} className="flex items-start gap-2 text-red-600 text-xs">
                        <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                )}

                {form.username && usernameErrors.length === 0 && (
                  <div className="flex items-center gap-2 text-green-600 text-xs">
                    <CheckCircle className="w-4 h-4" />
                    <span>Username looks good!</span>
                  </div>
                )}
              </div>

              {/* ✅ Email Field - Updated with proper validation */}
              <div className="space-y-2">
                <label className="label">
                  <span className="label-text font-semibold">Email</span>
                </label>
                <input 
                  name="email" 
                  type="email" 
                  placeholder="your.email@example.com" 
                  value={form.email}
                  onChange={handleChange} 
                  required
                  pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                  className={`input input-bordered w-full input-lg ${
                    emailErrors.length > 0 && form.email ? 'input-error' : ''
                  } ${
                    form.email && emailErrors.length === 0 ? 'input-success' : ''
                  }`}
                />
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs space-y-1">
                  <p className="font-semibold text-green-800 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Valid Email Formats:
                  </p>
                  <ul className="list-disc list-inside text-green-700 space-y-0.5 ml-2">
                    <li>user@example.com</li>
                    <li>first.last@example.com ✓</li>
                    <li>user+tag@gmail.com ✓</li>
                    <li>name_123@domain.co.uk ✓</li>
                  </ul>
                  <p className="text-xs text-green-600 mt-2">
                    📧 We'll send a verification code to this email
                  </p>
                </div>

                {form.email && emailErrors.length > 0 && (
                  <div className="space-y-1">
                    {emailErrors.map((error, index) => (
                      <div key={index} className="flex items-start gap-2 text-red-600 text-xs">
                        <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                )}

                {form.email && emailErrors.length === 0 && (
                  <div className="flex items-center gap-2 text-green-600 text-xs">
                    <CheckCircle className="w-4 h-4" />
                    <span>Email format is valid!</span>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="label">
                  <span className="label-text font-semibold">Password</span>
                </label>
                <div className="relative">
                  <input 
                    name="password" 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password" 
                    value={form.password}
                    onChange={handleChange} 
                    required
                    minLength={6}
                    className="input input-bordered w-full input-lg pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {passwordStrength && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Password Strength:</span>
                      <span className={`font-semibold ${passwordStrength.color}`}>
                        {passwordStrength.level.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${passwordStrength.bgColor}`}
                        style={{ width: `${passwordStrength.strength}%` }}
                      />
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Password Requirements:</p>
                      <div className="grid grid-cols-1 gap-1 text-xs">
                        <div className={`flex items-center gap-2 ${passwordStrength.checks.length ? 'text-green-600' : 'text-gray-500'}`}>
                          {passwordStrength.checks.length ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>At least 8 characters</span>
                        </div>
                        <div className={`flex items-center gap-2 ${passwordStrength.checks.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                          {passwordStrength.checks.uppercase ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>One uppercase letter</span>
                        </div>
                        <div className={`flex items-center gap-2 ${passwordStrength.checks.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                          {passwordStrength.checks.lowercase ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>One lowercase letter</span>
                        </div>
                        <div className={`flex items-center gap-2 ${passwordStrength.checks.number ? 'text-green-600' : 'text-gray-500'}`}>
                          {passwordStrength.checks.number ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>One number</span>
                        </div>
                        <div className={`flex items-center gap-2 ${passwordStrength.checks.special ? 'text-green-600' : 'text-gray-500'}`}>
                          {passwordStrength.checks.special ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>One special character (!@#$%^&*)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Terms Agreement */}
              <label className="flex items-start space-x-3 cursor-pointer">
                <input 
                  name="agree" 
                  type="checkbox" 
                  checked={form.agree} 
                  onChange={handleChange} 
                  className="checkbox checkbox-lg checkbox-primary hover:bg-[#2E5D93] mt-1" 
                />
                <span className="text-sm text-base-content/80 leading-relaxed">
                  I agree to HealthHub's <button type="button" onClick={() => setShowModal(true)} className="link link-hover text-[#4c8dd8] font-semibold">Terms of Use and Privacy Policy</button>, and I am of legal age (18+).
                </span>
              </label>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="btn bg-[#4c8dd8] hover:bg-[#2E5D93] text-white w-full btn-lg shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={loading || usernameErrors.length > 0 || emailErrors.length > 0}
              >
                {loading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  'Create Account'
                )}
              </button>

              <p className="text-center text-sm text-base-content/70">
                Already have an account? <Link to="/user/login" className="link link-hover text-[#4c8dd8] font-semibold">Login</Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Modal remains the same */}
      <input type="checkbox" id="policy-modal" className="modal-toggle" checked={showModal} readOnly />
      <div className="modal" role="dialog">
        <div className="modal-box w-11/12 max-w-6xl max-h-[85vh] flex flex-col p-0">
          <div className="bg-[#4c8dd8] p-6 rounded-t-lg flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-2xl text-white">Legal Agreements</h3>
              <label 
                htmlFor="policy-modal" 
                className="btn btn-sm btn-circle btn-ghost text-white hover:bg-white/20"
                onClick={() => setShowModal(false)}
              >
                ✕
              </label>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('terms')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === 'terms' 
                    ? 'bg-white text-[#4c8dd8]' 
                    : 'bg-[#4c8dd8]/30 text-white hover:bg-[#4c8dd8]/50'
                }`}
              >
                Terms of Use
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === 'privacy' 
                    ? 'bg-white text-[#4c8dd8]' 
                    : 'bg-[#4c8dd8]/30 text-white hover:bg-[#4c8dd8]/50'
                }`}
              >
                Privacy Policy
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-6">
            {activeTab === 'terms' && (
              <div className="prose prose-sm max-w-none">
                <p className="text-sm text-gray-500 mb-4">Last Updated: November 10, 2025</p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                  <p className="font-semibold text-blue-900">Welcome to HealthHub</p>
                  <p className="text-sm text-blue-800 mt-1">
                    Please read these Terms of Use carefully before using our anonymous HIV social network and healthcare platform.
                  </p>
                </div>
                {/* Rest of terms content... */}
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="prose prose-sm max-w-none">
                <p className="text-sm text-gray-500 mb-4">Last Updated: November 10, 2025</p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                  <p className="font-semibold text-blue-900">Your Privacy is Our Priority</p>
                  <p className="text-sm text-blue-800 mt-1">
                    We understand the sensitive nature of HIV-related information and are committed to protecting your anonymity.
                  </p>
                </div>
                {/* Rest of privacy content... */}
              </div>
            )}
          </div>

          <div className="modal-action p-6 border-t border-gray-200 flex-shrink-0 mt-0">
            <div className="w-full flex flex-col sm:flex-row gap-3 justify-between items-center">
              <p className="text-xs text-gray-600 text-center sm:text-left">
                By continuing, you acknowledge that you have read and understood these agreements.
              </p>
              <label 
                htmlFor="policy-modal" 
                className="btn bg-[#4c8dd8] hover:bg-[#2E5D93] text-white px-8"
                onClick={() => setShowModal(false)}
              >
                I Understand
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}