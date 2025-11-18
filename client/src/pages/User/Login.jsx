// Login.jsx - FIXED VERSION
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Eye, EyeOff } from 'lucide-react';
import ideaImage from '../../assets/idea-new.png';
import logoImage from '../../assets/logo-header.png';
import api from '../../utils/api'; // ✅ ADD THIS IMPORT

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
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
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setShowVerificationPrompt(false);
    setLoading(true);
    
    try {
      // ✅ USE api.post instead of fetch
      const data = await api.post('/auth/user/login', {
        email: form.email,
        password: form.password
      });

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
      
      // Handle specific error cases
      if (err.message.includes('verify your email')) {
        setShowVerificationPrompt(true);
        setError(err.message);
        toast.error('Please verify your email before logging in');
        localStorage.setItem('verificationEmail', form.email);
      } else {
        setError(err.message || 'Login failed');
        toast.error(err.message || 'Login failed');
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
          
          {/* Error Alert */}
          {error && (
            <div className="alert alert-error shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* ✅ IMPROVED: Verification Prompt with Big Button */}
          {showVerificationPrompt && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm mb-3">
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div className="text-right text-sm mb-4">
              <Link to="/user/forgot-password" className="link link-hover text-[#4c8dd8] font-semibold">
                Forgot Password?
              </Link>
            </div>
            
            <button 
              type="submit" 
              className="btn bg-[#4c8dd8] hover:bg-[#2E5D93] text-white w-full btn-lg shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Logging in...
                </>
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