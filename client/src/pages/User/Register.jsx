// register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', agree: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false); // New state for modal
  const navigate = useNavigate();
  const { checkSession } = useAuth();

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Show modal only when checkbox is checked
    if (name === 'agree' && checked) {
      setShowModal(true);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.agree) {
      setError('You must agree to the terms!');
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
        // Refresh the auth context
        await checkSession();
        alert('Registered successfully! Please log in to access your account.');
        navigate('/user/login'); // Changed to redirect to login
      } else {
        setError(data.msg || data.errors?.[0]?.msg || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
              <h2 className="text-3xl md:text-4xl font-bold mb-2 text-primary">User Register</h2>
              <p className="text-base-content/70">Please enter your details to create a user account.</p>
            </div>
            {error && (
              <div className="alert alert-error shadow-lg">
                <span>{error}</span>
              </div>
            )}  
            <form onSubmit={handleSubmit} className="space-y-4">
              <input 
                name="username" 
                placeholder="Username" 
                value={form.username}
                onChange={handleChange} 
                required
                minLength={3}
                className="input input-bordered w-full input-lg"
              />
              <input 
                name="email" 
                type="email" 
                placeholder="Email" 
                value={form.email}
                onChange={handleChange} 
                required
                className="input input-bordered w-full input-lg"
              />
              <input 
                name="password" 
                type="password" 
                placeholder="Password" 
                value={form.password}
                onChange={handleChange} 
                required
                minLength={6}
                className="input input-bordered w-full input-lg"
              />
              <label className="flex items-start space-x-3 cursor-pointer">
                <input 
                  name="agree" 
                  type="checkbox" 
                  checked={form.agree} 
                  onChange={handleChange} 
                  className="checkbox checkbox-lg checkbox-primary mt-1" 
                />
                <span className="text-sm text-base-content/80 leading-relaxed">
                  I agree to HealthHub's Terms of Use and Privacy Policy, and I am of legal age.
                </span>
              </label>
              <button 
                type="submit" 
                className="btn btn-primary w-full btn-lg shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  'Register'
                )}
              </button>
              <p className="text-center text-sm text-base-content/70">
                Already have account? <Link to="/user/login" className="link link-hover text-primary font-semibold">Login</Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* DaisyUI Modal for Terms and Privacy Policy */}
      <input type="checkbox" id="policy-modal" className="modal-toggle" checked={showModal} readOnly />
      <div className="modal" role="dialog">
        <div className="modal-box w-11/12 max-w-5xl max-h-[80vh] overflow-y-auto">
          <h3 className="font-bold text-lg mb-4">Terms of Use and Privacy Policy</h3>
          <div className="space-y-6 text-sm leading-relaxed">
            {/* Terms of Use Section */}
            <div className="bg-base-100 p-4 rounded-lg border border-base-200">
              <h4 className="font-semibold text-primary mb-2">Terms of Use</h4>
              <p>
                Placeholder Terms of Use content: By using HealthHub, you agree to our service terms including user responsibilities, content guidelines, and account usage. This is a sample; replace with full legal text. Users must be 18+ or have parental consent. No liability for user-generated content.
              </p>
              {/* Add more paragraphs or sections as needed */}
            </div>
            
            {/* Privacy Policy Section */}
            <div className="bg-base-100 p-4 rounded-lg border border-base-200">
              <h4 className="font-semibold text-primary mb-2">Privacy Policy</h4>
              <p>
                Placeholder Privacy Policy content: HealthHub collects personal data (e.g., email, username) for account management and service improvement. We do not share data without consent, comply with GDPR/CCPA, and use secure encryption. Cookies are used for session tracking. This is a sample; replace with full legal text.
              </p>
              {/* Add more paragraphs or sections as needed */}
            </div>
          </div>
          <div className="modal-action mt-6">
            <label 
              htmlFor="policy-modal" 
              className="btn btn-primary"
              onClick={() => setShowModal(false)} // Close modal programmatically
            >
              I Agree and Close
            </label>
          </div>
        </div>
      </div>
    </>
  );
}