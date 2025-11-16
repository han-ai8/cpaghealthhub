// register.jsx - Enhanced with email verification and complete Privacy Policy & Terms
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { Eye, EyeOff, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

// Profanity/Inappropriate words filter
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

// Username validation function
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
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, underscore, and hyphen');
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
  const [activeTab, setActiveTab] = useState('terms'); // 'terms' or 'privacy'
  const [showPassword, setShowPassword] = useState(false);
  const [usernameErrors, setUsernameErrors] = useState([]);
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

  // Real-time password strength checking
  useEffect(() => {
    if (form.password) {
      const strength = calculatePasswordStrength(form.password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(null);
    }
  }, [form.password]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          username: form.username, 
          email: form.email, 
          password: form.password 
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // ✅ Check if email verification is required
        if (data.requiresVerification) {
          toast.success('Registration successful! Please check your email for verification code.');
          // Store email for verification page
          localStorage.setItem('verificationEmail', form.email);
          // Redirect to verification page
          setTimeout(() => {
            navigate('/user/verify-email', { 
              state: { email: form.email } 
            });
          }, 1500);
        } else {
          // Old flow (if backend doesn't require verification yet)
          toast.success('Account created successfully! Please log in to continue.');
          setTimeout(() => {
            navigate('/user/login');
          }, 1500);
        }
      } else {
        const errorMsg = data.msg || data.errors?.[0]?.msg || 'Registration failed';
        toast.error(errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Registration error:', err);
      toast.error('Server error. Please try again later.');
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row min-h-screen bg-base-100">
        {/* Left Side: Logo and Tagline */}
        <div className="w-full md:w-1/2 bg-[#4c8dd8] flex flex-col items-center justify-center p-8 md:p-12 shadow-xl">
          <h1 className="mb-6">
            <img 
              src="/src/assets/idea-new.png" 
              alt="HealthHub Promotion" 
              className="w-200 h-200 rounded-3xl hover:scale-105" 
            />
          </h1>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 bg-base-100 flex flex-col items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-md mx-auto space-y-6">
            <div className="text-center justify-center items-center flex flex-col">
              <img 
                src="/src/assets/logo-header.png" 
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
              {/* Username Field with Validation */}
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
                
                {/* Username Guidelines */}
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

                {/* Username Validation Feedback */}
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

              {/* Email Field */}
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
                  className="input input-bordered w-full input-lg"
                />
                <p className="text-xs text-gray-500">
                  📧 We'll send a verification code to this email
                </p>
              </div>

              {/* Password Field with Strength Indicator */}
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

                {/* Password Strength Indicator */}
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

              {/* Terms Agreement Checkbox */}
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
                disabled={loading || usernameErrors.length > 0}
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

      {/* Terms and Privacy Policy Modal */}
      <input type="checkbox" id="policy-modal" className="modal-toggle" checked={showModal} readOnly />
      <div className="modal" role="dialog">
        <div className="modal-box w-11/12 max-w-6xl max-h-[85vh] flex flex-col p-0">
          {/* Modal Header with Tabs */}
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
            
            {/* Tabs */}
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

          {/* Modal Content */}
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

                <h4 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">1. Acceptance of Terms</h4>
                <p className="text-sm mb-3">
                  By creating an account or using HealthHub, you agree to be bound by these Terms of Use and our Privacy Policy. 
                  If you do not agree with any part of these terms, you must not use our platform. You confirm that you are at least 18 years of age.
                </p>

                <h4 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">2. Platform Purpose</h4>
                <p className="text-sm mb-2">HealthHub provides:</p>
                <ul className="list-disc ml-6 mb-4 space-y-1 text-sm">
                  <li>Anonymous social network for HIV awareness and support</li>
                  <li>Community forums for sharing experiences</li>
                  <li>Appointment scheduling with Cavite Positive Action Group</li>
                  <li>Educational articles about HIV</li>
                  <li>Clinic finder for HIV services in Cavite</li>
                </ul>

                <h4 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">3. User Account & Anonymity</h4>
                <ul className="list-disc ml-6 mb-4 space-y-1 text-sm">
                  <li>You must provide a valid email for verification</li>
                  <li>Create an anonymous username - NEVER use your real name</li>
                  <li>You are responsible for account security</li>
                  <li>One person may create only one account</li>
                  <li>Protect your own and others' anonymity</li>
                </ul>

                <h4 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">4. Acceptable Use</h4>
                <p className="text-sm mb-2"><strong>You AGREE NOT to:</strong></p>
                <ul className="list-disc ml-6 mb-4 space-y-1 text-sm">
                  <li>Harass, bully, or threaten other users</li>
                  <li>Post discriminatory or hateful content</li>
                  <li>Share false medical information</li>
                  <li>Attempt to identify other users</li>
                  <li>Post spam or advertisements</li>
                  <li>Share illegal or explicit content</li>
                  <li>Impersonate others or healthcare providers</li>
                  <li>Interfere with platform functionality</li>
                </ul>

                <h4 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">5. Medical Disclaimer</h4>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
                  <p className="font-semibold text-yellow-900 mb-2 text-sm">⚠️ IMPORTANT</p>
                  <ul className="list-disc ml-6 space-y-1 text-xs text-yellow-800">
                    <li>HealthHub is NOT a medical service provider</li>
                    <li>We do NOT provide medical advice, diagnosis, or treatment</li>
                    <li>Information is for educational purposes only</li>
                    <li>Always consult qualified healthcare professionals</li>
                    <li>In emergencies, call emergency services immediately</li>
                  </ul>
                </div>

                <h4 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">6. Privacy & Data</h4>
                <p className="text-sm mb-3">
                  Your privacy is paramount. We never share your identity or HIV status. All data is encrypted. 
                  See our Privacy Policy for complete details.
                </p>

                <h4 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">7. Account Termination</h4>
                <p className="text-sm mb-2">We may suspend or terminate accounts that:</p>
                <ul className="list-disc ml-6 mb-4 space-y-1 text-sm">
                  <li>Violate these Terms or Privacy Policy</li>
                  <li>Engage in harmful behavior</li>
                  <li>Post illegal or dangerous content</li>
                  <li>Compromise platform security</li>
                </ul>

                <h4 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">8. Limitation of Liability</h4>
                <p className="text-sm mb-4">
                  We are not liable for medical outcomes, user-generated content, technical issues, or third-party services. 
                  Use at your own risk.
                </p>

                <h4 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">9. Governing Law</h4>
                <p className="text-sm mb-4">
                  These Terms are governed by the laws of the Republic of the Philippines. 
                  Disputes shall be resolved in the courts of Cavite, Philippines.
                </p>

                <h4 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">10. Contact</h4>
                <p className="text-sm mb-2">
                  <strong>Support:</strong> itsmedalgom@gmai.com<br/>
                  <strong>Report Abuse:</strong> cavitepositiveactiongroup@outlook.com
                </p>

                <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-6">
                  <p className="font-semibold text-green-900 text-sm">Our Mission</p>
                  <p className="text-xs text-green-800 mt-1">
                    HealthHub is dedicated to breaking stigma and spreading truth about HIV. 
                    Thank you for being part of this community.
                  </p>
                </div>
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

                <h4 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">1. Information We Collect</h4>
                <p className="text-sm mb-2"><strong>Account Information:</strong></p>
                <ul className="list-disc ml-6 mb-3 space-y-1 text-sm">
                  <li>Anonymous username (pseudonym)</li>
                  <li>Email address (verification only)</li>
                  <li>Encrypted password</li>
                  <li>Optional profile information</li>
                </ul>
                
                <p className="text-sm mb-2"><strong>Health-Related:</strong></p>
                <ul className="list-disc ml-6 mb-3 space-y-1 text-sm">
                  <li>Information you voluntarily share</li>
                  <li>Appointment details with clinics</li>
                  <li>Articles you read (stored anonymously)</li>
                </ul>

                <h4 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">2. How We Use Your Information</h4>
                <ul className="list-disc ml-6 mb-4 space-y-1 text-sm">
                  <li>Account management</li>
                  <li>Appointment scheduling</li>
                  <li>Community forum participation</li>
                  <li>Providing educational content</li>
                  <li>Clinic finder services</li>
                  <li>Platform security and improvement</li>
                </ul>

                <h4 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">3. Anonymity & Confidentiality</h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-green-900 mb-2 text-sm">Our Commitment:</p>
                  <ul className="list-disc ml-6 space-y-1 text-xs text-green-800">
                    <li>We never require or store your real name</li>
                    <li>Your username cannot be traced to your identity</li>
                    <li>Health information is not linked to real identity</li>
                    <li>We never share HIV status with third parties</li>
                    <li>All data is encrypted</li>
                    <li>We comply with medical confidentiality standards</li>
                  </ul>
                </div>

                <h4 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">4. Information Sharing</h4>
                <p className="text-sm mb-2"><strong>We DO NOT sell your information.</strong> Limited sharing only for:</p>
                <ul className="list-disc ml-6 mb-4 space-y-1 text-sm">
                  <li>Healthcare providers (when you book appointments)</li>
                  <li>Legal obligations (with notification)</li>
                  <li>Immediate safety concerns</li>
                  <li>Trusted service providers (under confidentiality agreements)</li>
                </ul>
                
                <p className="font-semibold text-red-600 mb-4 text-sm">
                  ⚠️ We will NEVER disclose your HIV status or identity to employers, insurance companies, or unauthorized parties.
                </p>

                <h4 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">5. Data Security</h4>
                <p className="text-sm mb-2">Multiple layers of security:</p>
                <ul className="list-disc ml-6 mb-4 space-y-1 text-sm">
                  <li>End-to-end encryption</li>
                  <li>Secure SSL/HTTPS connections</li>
                  <li>Regular security audits</li>
                  <li>Access controls and authentication</li>
                  <li>Secure servers with backups</li>
                  <li>Employee confidentiality agreements</li>
                </ul>

                <h4 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">6. Your Rights</h4>
                <p className="text-sm mb-2">You have complete control:</p>
                <ul className="list-disc ml-6 mb-4 space-y-1 text-sm">
                  <li><strong>Access:</strong> View all your data</li>
                  <li><strong>Correction:</strong> Update information anytime</li>
                  <li><strong>Deletion:</strong> Request complete account deletion (erased within 30 days)</li>
                </ul>

                <h4 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">7. Cookies & Tracking</h4>
                <p className="text-sm mb-4">
                  We use minimal cookies only for essential functions (login, security). 
                  We do NOT use advertising cookies or sell data to advertisers.
                </p>

                <h4 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">8. Third-Party Links</h4>
                <p className="text-sm mb-4">
                  Our platform may link to external websites. We are not responsible for their privacy practices. 
                  Please review their policies before sharing information.
                </p>

                <h4 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">9. Age Requirement</h4>
                <p className="text-sm mb-4">
                  Our platform is for users 18 years and older. We do not knowingly collect information from minors.
                </p>

                <h4 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">10. Data Retention</h4>
                <p className="text-sm mb-4">
                  We retain data only as necessary to provide services. When you delete your account, 
                  all personal information is permanently erased within 30 days.
                </p>

                <h4 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">11. Philippine Data Privacy Act</h4>
                <p className="text-sm mb-4">
                  We comply with the Philippine Data Privacy Act of 2012 (RA 10173) and all relevant regulations. 
                  You have rights under Philippine law to access, correct, and delete your data.
                </p>

                <h4 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">12. Policy Changes</h4>
                <p className="text-sm mb-4">
                  We may update this Privacy Policy periodically. Material changes will be communicated via email. 
                  Continued use indicates acceptance.
                </p>

                <h4 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">13. Contact Us</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="mb-2 text-sm">For privacy concerns or questions:</p>
                  <ul className="space-y-1 text-xs">
                    <li><strong>Email:</strong> cavitepositiveactiongroup@outlook.com</li>
                    <li><strong>Support:</strong> itsmedalgom@gmail.com</li>
                    <li><strong>Location:</strong> Cavite, Philippines</li>
                  </ul>
                  <p className="mt-3 text-xs text-gray-600">
                    We respond to all privacy inquiries within 48 hours.
                  </p>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
                  <p className="font-semibold text-blue-900 text-sm">Remember:</p>
                  <p className="text-xs text-blue-800 mt-1">
                    Your privacy and anonymity are fundamental to our mission. We will never compromise your confidentiality. 
                    If you have any concerns, please reach out immediately.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
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