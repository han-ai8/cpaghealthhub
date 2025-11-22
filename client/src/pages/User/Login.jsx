// Login.jsx - UPDATED WITH BETTER ERROR HANDLING
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Eye, EyeOff, AlertCircle, ShieldAlert } from 'lucide-react';
import ideaImage from '../../assets/idea-new.png';
import logoImage from '../../assets/logo-header.png';
import api from '../../utils/api';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const navigate = useNavigate();
  const { checkSession } = useAuth();
  const toast = useToast();

  const handleChange = e => {
    const { name, value } = e.target;
    if (name === 'email') {
      setForm(prev => ({ ...prev, [name]: value.toLowerCase().trim() }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    setError('');
    setShowVerificationPrompt(false);
    setRemainingAttempts(null);
    setIsLocked(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setShowVerificationPrompt(false);
    setRemainingAttempts(null);
    setIsLocked(false);
    setLoading(true);
    
    try {
      const data = await api.post('/auth/user/login', form);

      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      await checkSession();
      toast.success('Welcome! Login successful.');
      
      setTimeout(() => {
        navigate('/user/home');
      }, 1000);
    } catch (err) {
      console.error('Login error:', err);
      
      // Extract error data
      const errorData = err.data || {};
      const errorMsg = err.message || 'Login failed';
      
      // Handle account locked
      if (errorData.locked || errorMsg.includes('locked')) {
        setIsLocked(true);
        setError('Account locked due to too many failed login attempts. Please try again in 24 hours.');
        toast.error('Account locked. Try again in 24 hours.');
      }
      // Handle email verification requirement
      else if (errorData.requiresVerification || errorMsg.includes('verify') || errorMsg.includes('verification')) {
        setShowVerificationPrompt(true);
        setError('Please verify your email before logging in');
        toast.error('Please verify your email before logging in');
        localStorage.setItem('verificationEmail', form.email);
      }
      // Handle invalid credentials with remaining attempts
      else if (errorData.remainingAttempts !== undefined) {
        setRemainingAttempts(errorData.remainingAttempts);
        
        if (errorData.remainingAttempts <= 2) {
          const warningMsg = `Invalid credentials. Only ${errorData.remainingAttempts} ${errorData.remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining before account lock.`;
          setError(warningMsg);
          toast.error(warningMsg);
        } else {
          const msg = `Invalid credentials. ${errorData.remainingAttempts} attempts remaining.`;
          setError(msg);
          toast.error(msg);
        }
      }
      // Handle inactive account
      else if (errorData.accountInactive) {
        setError('Your account has been deactivated. Please contact support for assistance.');
        toast.error('Account deactivated. Contact support.');
      }
      // Generic error
      else {
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoToVerification = () => {
    navigate('/user/verify-email', {
      state: { email: form.email },
    });
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-base-100">
      {/* Left Side: Logo and Tagline */}
      <div className="w-full md:w-1/2 bg-[#4c8dd8] flex flex-col items-center justify-center p-8 md:p-12 shadow-xl">
        <h1 className="mb-6">
          <img 
            src={ideaImage}
            alt="HealthHub Promotion" 
            className="w-300 h-200 rounded-3xl hover:scale-105" 
          />
        </h1>
      </div>
      
      {/* Right Side: Form */}
      <div className="w-full md:w-1/2 bg-base-100 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="text-center justify-center items-center flex flex-col">
            <img 
              src={logoImage} 
              alt="HealthHub Logo" 
              className="rounded-lg w-500 h-300 hover:scale-105 mb-4" 
            />
            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-[#4c8dd8]">Welcome!</h2>
            <p className="text-base-content/70">Enter your email address and password to access user panel.</p>
          </div>
          
          {/* Account Locked Alert */}
          {isLocked && (
            <div className="alert alert-error shadow-lg">
              <ShieldAlert className="w-6 h-6" />
              <div>
                <h3 className="font-bold">Account Locked</h3>
                <div className="text-sm">{error}</div>
              </div>
            </div>
          )}

          {/* Error Alert with Remaining Attempts */}
          {error && !isLocked && !showVerificationPrompt && (
            <div className={`alert ${remainingAttempts !== null && remainingAttempts <= 2 ? 'alert-warning' : 'alert-error'} shadow-lg`}>
              <AlertCircle className="w-6 h-6" />
              <div className="flex-1">
                <span>{error}</span>
                {remainingAttempts !== null && remainingAttempts > 0 && (
                  <div className="text-sm mt-1 font-semibold">
                    {remainingAttempts === 1 ? (
                      <span className="text-error">⚠️ Last attempt before account lock!</span>
                    ) : remainingAttempts <= 2 ? (
                      <span className="text-warning">⚠️ Be careful with your password!</span>
                    ) : (
                      <span>{remainingAttempts} attempts remaining</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Verification Prompt */}
          {showVerificationPrompt && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 shadow-md">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-yellow-800 font-semibold mb-2">
                    Email Verification Required
                  </p>
                  <p className="text-yellow-700 text-sm mb-3">
                    Your email hasn't been verified yet. Please verify your email to login.
                  </p>
                  <button
                    type="button"
                    onClick={handleGoToVerification}
                    className="btn btn-sm bg-[#4c8dd8] hover:bg-[#2E5D93] text-white w-full"
                  >
                    Go to Verification Page →
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">
                <span className="label-text font-semibold">Email Address</span>
              </label>
              <input
                className="input input-bordered w-full input-lg"
                type="email"
                name="email"
                placeholder="your.email@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                disabled={isLocked}
              />
            </div>
            
            <div>
              <label className="label">
                <span className="label-text font-semibold">Password</span>
              </label>
              <div className="relative">
                <input
                  className="input input-bordered w-full input-lg pr-12"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  disabled={isLocked}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLocked}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div className="text-right text-sm mb-4">
              <Link 
                to="/user/forgot-password" 
                className="link link-hover text-[#4c8dd8] font-semibold"
              >
                Forgot Password?
              </Link>
            </div>
            
            <button 
              type="submit" 
              className="btn bg-[#4c8dd8] hover:bg-[#2E5D93] text-white w-full btn-lg shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={loading || isLocked}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Logging in...
                </>
              ) : isLocked ? (
                'Account Locked'
              ) : (
                'Login'
              )}
            </button>
            
            <p className="text-center text-sm text-base-content/70">
              Don't have an account? <Link to="/user/register" className="link link-hover text-[#4c8dd8] font-semibold">Register</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}