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
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true); 
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      }); 
      const data = await res.json(); 
      if (res.ok) {
        // Refresh the auth context
        await checkSession();
        alert('Logged in successfully!');
        navigate('/user/dashboard');
      } else {
        setError(data.msg || data.errors?.[0]?.msg || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-base-100">
      {/* Left Side: Logo and Tagline */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-primary to-secondary flex flex-col items-center justify-center p-8 md:p-12 shadow-xl">
        <h1 className="mb-6">
          <img 
            src="/src/assets/HEALTHUB.png" 
              alt="HealthHub Logo" 
              className="w-500 h-300 hover:scale-105"  
          />
        </h1>
        <div className="text-center text-xl md:text-2xl lg:text-3xl font-semibold text-white opacity-90 px-4">
          Breaking Stigma, Spreading Truth
        </div>
      </div>
      {/* Right Side: Form */}
      <div className="w-full md:w-1/2 bg-base-100 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-primary">User Login</h2>
            <p className="text-base-content/70">Enter your email address and password to access user panel.</p>
          </div>
          {error && (
            <div className="alert alert-error shadow-lg">
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="input input-bordered w-full input-lg"
              type="email"
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              required
            />
            <input
              className="input input-bordered w-full input-lg"
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <div className="text-right text-sm mb-4">
              <Link to="/user/forgot-password" className="link link-hover text-primary font-semibold">
                Forgot Password?
              </Link>
            </div>
            <button 
              type="submit" 
              className="btn btn-primary w-full btn-lg shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                'Login'
              )}
            </button>
            <p className="text-center text-sm text-base-content/70">
              Don't have account? <Link to="/user/register" className="link link-hover text-primary font-semibold">Register</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}