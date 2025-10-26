// Login.jsx - Fixed with comprehensive error handling and debug logging
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, checkSession } = useAuth();

  const handleChange = e => {
    const { name, value } = e.target;
    if (name === 'email') {
      // Normalize email: lowercase and trim
      setForm(prev => ({ ...prev, [name]: value.toLowerCase().trim() }));
    } else {
      // Password remains as-is (case-sensitive)
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Debug logging
    console.log('=== USER LOGIN ATTEMPT ===');
    console.log('Form data:', { email: form.email, password: '***' });
    console.log('API URL:', import.meta.env.VITE_API_URL);
    
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/auth/user/login`;
      console.log('Calling API:', apiUrl);
      
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      
      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);
      
      const data = await res.json();
      console.log('Response data:', data);

      if (res.ok) {
        console.log('✅ Login successful');
        
        // Store token if present
        if (data.token) {
          localStorage.setItem('token', data.token);
          console.log('Token stored in localStorage');
        } else {
          console.warn('⚠️ No token in response');
        }
        
        // Refresh auth context
        await checkSession();
        
        alert('Logged in successfully!');
        navigate('/user/dashboard');
      } else {
        // Handle specific error messages
        console.error('❌ Login failed:', data);
        
        let errorMsg = data.msg || 'Login failed';
        
        // Provide user-friendly error messages
        if (data.msg && data.msg.includes('Invalid credentials')) {
          if (data.msg.includes('wrong password')) {
            errorMsg = 'Incorrect password. Please try again.';
          } else if (data.msg.includes('email not found')) {
            errorMsg = 'No account found with this email. Please check your email or register.';
          } else {
            errorMsg = 'Email or password is incorrect.';
          }
        } else if (data.msg && data.msg.includes('not a regular user')) {
          errorMsg = 'This account has admin privileges. Please use the admin login page.';
        } else if (data.errors && Array.isArray(data.errors)) {
          // Handle validation errors
          errorMsg = data.errors.map(e => e.msg).join(', ');
        }
        
        setError(errorMsg);
      }
    } catch (err) {
      console.error('❌ Login fetch error:', err);
      
      // Check if it's a network error
      if (err.message === 'Failed to fetch') {
        setError('Cannot connect to server. Please make sure the backend is running on port 5000.');
      } else {
        setError('Network error: ' + (err.message || 'Please check your connection and try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-base-100">
      {/* Left Side: Logo and Tagline */}
      <div className="w-full md:w-1/2 bg-[#4c8dd8] flex flex-col items-center justify-center p-8 md:p-12 shadow-xl">
        <h1 className="mb-6">
          <img 
            src="/src/assets/hivnice-removebg-preview.png" 
            alt="HealthHub Promotion" 
            className="w-300 h-200 rounded-3xl hover:scale-105" 
          />
        </h1>
        <div className="text-center text-xl md:text-2xl lg:text-3xl font-semibold text-white opacity-90 px-4">
          Breaking Stigma, Spreading Truth
        </div>
      </div>
      
      {/* Right Side: Form */}
      <div className="w-full md:w-1/2 bg-base-100 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="text-center justify-center items-center flex flex-col">
            <img 
              src="/src/assets/HEALTHUB.png" 
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
          
          {/* Debug Info (remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="alert alert-info shadow-lg text-xs">
              <span>API: {import.meta.env.VITE_API_URL || 'NOT SET'}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                className="input input-bordered w-full input-lg"
                type="email"
                name="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
            
            <div>
              <input
                className="input input-bordered w-full input-lg"
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
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
              Don't have account? <Link to="/user/register" className="link link-hover text-[#4c8dd8] font-semibold">Register</Link>
            </p>
          </form>
          
          {/* Test Account Info (remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs">
              <p className="font-bold mb-2">Test Account:</p>
              <p>Email: test@user.com</p>
              <p>Password: password123</p>
              <button 
                onClick={() => setForm({ email: 'test@user.com', password: 'password123' })}
                className="btn btn-xs btn-ghost mt-2"
              >
                Fill Test Data
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}