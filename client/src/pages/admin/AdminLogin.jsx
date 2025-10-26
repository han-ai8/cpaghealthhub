// AdminLogin.jsx - FIXED: Use context's login (correct URLs, no custom fetch)
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // Only need login now (it calls checkSession internally)
  const { email, password } = formData;

  const onChange = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // In onSubmit
    try {
      await login(email, password, true);
      alert('Login successful!');
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed.');  // This will show the error without logging out
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
              className=" rounded-lg w-500 h-300 hover:scale-105 mb-4" 
            />
            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-[#4c8dd8] ">Welcome, Admin!</h2>
            <p className="text-base-content/70">Enter your email address and password to access admin panel.</p>
          </div>
          
          {error && (
            <div className="alert alert-error shadow-lg">
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={onSubmit} className="space-y-4">
            <input 
              type="email" 
              placeholder="Email Address" 
              name="email"
              value={email}
              onChange={onChange}
              required
              className="input input-bordered w-full input-lg"
            />
            <input 
              type="password" 
              placeholder="Password" 
              name="password"
              value={password}
              onChange={onChange}
              required
              className="input input-bordered w-full input-lg"
            />
            <div className="text-right text-sm mb-4">
              <Link to="/admin/forgot-password" className="link link-hover text-[#4c8dd8] font-semibold">Forgot Password?</Link>
            </div>
            <button 
              type="submit" 
              className="btn btn bg-[#4c8dd8] hover:bg-[#2E5D93] text-white w-full btn-lg shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                'Login'
              )}
            </button>
            <p className="text-center text-sm text-base-content/70">
              Don't have account?{' '}
              <Link to="/admin/register" className="link link-hover text-[#4c8dd8]  font-semibold">Register</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;