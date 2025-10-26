import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'admin',
    consent: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false); // Added for modal consistency
  const navigate = useNavigate();
  const { checkSession } = useAuth();
  const { username, email, password, role, consent } = formData;

  const onChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Show modal only when checkbox is checked (consistency with register)
    if (name === 'consent' && checked) {
      setShowModal(true);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!consent) {
      setError('Please accept the terms to register.');
      return;
    }  
    setLoading(true);  
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/admin/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, password, role })
      });    
      const data = await res.json();    
      if (res.ok) {
        // Refresh the auth context
        await checkSession();
        alert('Registration successful!');
        navigate('/admin/dashboard');
      } else {
        setError(data.msg || data.errors?.[0]?.msg || 'Registration failed');
      }
    } catch(err) {
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
              className=" rounded-lg w-500 h-300  hover:scale-105 mb-4" 
            />
              <h2 className="text-3xl md:text-4xl font-bold mb-2 text-[#4c8dd8]">Admin Register</h2>
              <p className="text-base-content/70">Please enter your details to create an admin account.</p>
            </div>
            {error && (
              <div className="alert alert-error shadow-lg">
                <span>{error}</span>
              </div>
            )}   
            <form onSubmit={onSubmit} className="space-y-4">
              <input 
                type="text" 
                placeholder="Username" 
                name="username"
                value={username}
                onChange={onChange}
                required
                minLength={3}
                className="input input-bordered w-full input-lg"
              />
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
                minLength={6}
                className="input input-bordered w-full input-lg"
              />
              <select
                name="role"
                value={role}
                onChange={onChange}
                className="select select-bordered w-full select-lg"
                required
              >
                <option value="admin">Admin</option>
                <option value="content_moderator">Content Moderator</option>
                <option value="case_manager">Case Manager</option>
              </select>
              <label className="flex items-start space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="consent" 
                  checked={consent} 
                  onChange={onChange}
                  className="checkbox checkbox-lg checkbox-primary hover:bg-[#4c8dd8] mt-1" 
                />
                <span className="text-sm text-base-content/80 leading-relaxed">
                  I confirm that I have read, consent and agree to HealthHub's Terms of Use and Privacy Policy, and I am of legal age.
                </span>
              </label>
              <button 
                type="submit" 
                className="btn bg-[#4c8dd8] hover:bg-[#2E5D93] text-white w-full btn-lg shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  'Register'
                )}
              </button>
              <p className="text-center text-sm text-base-content/70">
                Already have account?{' '}
                <Link to="/admin/login" className="link link-hover text-[#4c8dd8] font-semibold">Login</Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* DaisyUI Modal for Terms and Privacy Policy (added for consistency) */}
      <input type="checkbox" id="policy-modal" className="modal-toggle" checked={showModal} readOnly />
      <div className="modal" role="dialog">
        <div className="modal-box w-11/12 max-w-5xl max-h-[80vh] overflow-y-auto">
          <h3 className="font-bold text-lg mb-4">Terms of Use and Privacy Policy</h3>
          <div className="space-y-6 text-sm leading-relaxed">
            {/* Terms of Use Section */}
            <div className="bg-base-100 p-4 rounded-lg border border-base-200">
              <h4 className="font-semibold text-[#4c8dd8] mb-2">Terms of Use</h4>
              <p>
                Placeholder Terms of Use content: By using HealthHub, you agree to our service terms including user responsibilities, content guidelines, and account usage. This is a sample; replace with full legal text. Users must be 18+ or have parental consent. No liability for user-generated content.
              </p>
            </div>
            
            {/* Privacy Policy Section */}
            <div className="bg-base-100 p-4 rounded-lg border border-base-200">
              <h4 className="font-semibold text-[#4c8dd8] mb-2">Privacy Policy</h4>
              <p>
                Placeholder Privacy Policy content: HealthHub collects personal data (e.g., email, username) for account management and service improvement. We do not share data without consent, comply with GDPR/CCPA, and use secure encryption. Cookies are used for session tracking. This is a sample; replace with full legal text.
              </p>
            </div>
          </div>
          <div className="modal-action mt-6">
            <label 
              htmlFor="policy-modal" 
              className="btn bg-[#4c8dd8] hover:bg-[#2E5D93] text-white"
              onClick={() => setShowModal(false)}
            >
              I Agree and Close
            </label>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminRegister;