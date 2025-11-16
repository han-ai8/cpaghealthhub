// AdminLogin.jsx - WITH FORGOT PASSWORD FOR ADMIN ONLY
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, checkSession } = useAuth();
  const toast = useToast();

  const handleChange = e => {
    const { name, value } = e.target;
    if (name === 'email') {
      setForm(prev => ({ ...prev, [name]: value.toLowerCase().trim() }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setWarning('');
    setRemainingAttempts(null);
    setLoading(true);
    
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/auth/admin/login`;
      
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      
      const data = await res.json();

      if (res.ok) {
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        
        await checkSession();
        
        const roleNames = {
          admin: 'Administrator',
          case_manager: 'Case Manager',
          content_moderator: 'Content Moderator'
        };
        
        toast.success(`Welcome back, ${roleNames[data.user.role]}!`);
        
        setTimeout(() => {
          if (data.user.role === 'admin') {
            navigate('/admin/dashboard');
          } else if (data.user.role === 'case_manager') {
            navigate('/admin/planner');
          } else if (data.user.role === 'content_moderator') {
            navigate('/admin/community');
          }
        }, 1000);
      } else {
        if (res.status === 429) {
          if (data.locked) {
            setError('Account locked for 24 hours due to too many failed attempts. Please contact the administrator.');
            toast.error('Account locked! Contact administrator.');
          } else if (data.delay) {
            setError(data.msg);
            toast.error(data.msg);
          }
        } else {
          setError(data.msg || 'Login failed');
          
          if (data.remainingAttempts !== undefined) {
            setRemainingAttempts(data.remainingAttempts);
            
            if (data.warning) {
              setWarning(data.warning);
              toast.warning(data.warning);
            }
          }
          
          toast.error(data.msg || 'Invalid credentials');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please try again.');
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-base-100">
      {/* Left Side */}
      <div className="w-full md:w-1/2 bg-[#4c8dd8] flex flex-col items-center justify-center p-8 md:p-12 shadow-xl">
        <h1 className="mb-6">
          <img 
            src="/src/assets/idea-new.png" 
            alt="HealthHub Promotion" 
            className="w-300 h-200 rounded-3xl hover:scale-105" 
          />
        </h1>
      </div>
      
      {/* Right Side */}
      <div className="w-full md:w-1/2 bg-base-100 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="text-center justify-center items-center flex flex-col">
            <img 
              src="/src/assets/logo-header.png" 
              alt="HealthHub Logo" 
              className="rounded-lg w-500 h-300 hover:scale-105 mb-4" 
            />
            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-[#4c8dd8]">Staff Login</h2>
            <p className="text-base-content/70">Enter your credentials to access your dashboard</p>
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

          {/* Warning Alert */}
          {warning && (
            <div className="alert alert-warning shadow-lg">
              <AlertTriangle className="w-6 h-6" />
              <span>{warning}</span>
            </div>
          )}

          {/* Remaining Attempts */}
          {remainingAttempts !== null && remainingAttempts < 5 && (
            <div className={`alert ${remainingAttempts <= 2 ? 'alert-error' : 'alert-warning'} shadow-lg`}>
              <span>
                {remainingAttempts === 0 
                  ? '⚠️ Account will be locked after next failed attempt!' 
                  : `${remainingAttempts} login attempts remaining`}
              </span>
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
                placeholder="your.email@healthhub.com"
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
            
            {/* ✅ FORGOT PASSWORD LINK - Admin Only */}
            <div className="text-right">
              <Link 
                to="/admin/forgot-password" 
                className="text-sm text-[#4c8dd8] hover:text-[#2E5D93] hover:underline"
              >
                Forgot Password? (Admin Only)
              </Link>
            </div>
            
            <div className="text-center text-sm text-base-content/60 mt-2 p-3 bg-base-200 rounded-lg">
              <p>🔒 <strong>Case Managers & Content Moderators:</strong></p>
              <p className="mt-1">Contact the administrator to reset your credentials.</p>
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
          </form>
        </div>
      </div>
    </div>
  );
}