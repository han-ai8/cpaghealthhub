// EmailVerification.jsx - FIXED VERSION
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { HiOutlineMail, HiOutlineCheckCircle } from 'react-icons/hi';
import api from '../../utils/api';

import healthhubLogo from '../../assets/HEALTHUB.png';

export default function EmailVerification() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  useEffect(() => {
    const emailFromState = location.state?.email;
    const emailFromStorage = localStorage.getItem('verificationEmail');
    
    if (emailFromState) {
      setEmail(emailFromState);
      localStorage.setItem('verificationEmail', emailFromState);
    } else if (emailFromStorage) {
      setEmail(emailFromStorage);
    } else {
      toast.error('No email found. Please register first.');
      navigate('/user/register');
    }
  }, [location, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }

    setError('');
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setCode(newCode);

    const lastIndex = Math.min(pastedData.length, 5);
    document.getElementById(`code-${lastIndex}`)?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Please enter all 6 digits');
      toast.error('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // ✅ FIXED: Use api.post() for POST requests
      const data = await api.post('/auth/user/verify-email', {
        email,
        code: verificationCode,
      });

      setSuccess('Email verified successfully! Redirecting...');
      toast.success('Email verified successfully!');
      
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      localStorage.removeItem('verificationEmail');

      setTimeout(() => {
        navigate('/user/login');
      }, 1500);
    } catch (err) {
      console.error('Verification error:', err);
      const errorMsg = err.message || 'Verification failed. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    setSuccess('');

    try {
      // ✅ FIXED: Use api.post() for POST requests
      await api.post('/auth/user/resend-verification', { email });

      setSuccess('New verification code sent to your email!');
      toast.success('New verification code sent!');
      setResendCooldown(60);
      setCode(['', '', '', '', '', '']);
      document.getElementById('code-0')?.focus();
    } catch (err) {
      console.error('Resend error:', err);
      const errorMsg = err.message || 'Failed to resend code';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-base-100">
      {/* Left Side: Logo */}
      <div className="w-full md:w-1/2 bg-[#4c8dd8] flex flex-col items-center justify-center p-8 md:p-12 shadow-xl">
        <div className="bg-white/10 backdrop-blur-sm p-8 rounded-full mb-6">
          <HiOutlineMail className="w-24 h-24 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">
          Verify Your Email
        </h2>
        <p className="text-white/90 text-center text-lg">
          We've sent a 6-digit code to your email address
        </p>
      </div>

      {/* Right Side: Verification Form */}
      <div className="w-full md:w-1/2 bg-base-100 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="text-center">
            <img 
              src={healthhubLogo} 
              alt="HealthHub Logo" 
              className="rounded-lg w-500 h-300 hover:scale-105 mb-4 mx-auto" 
            />
            <h2 className="text-3xl font-bold mb-2 text-[#4c8dd8]">Email Verification</h2>
            <p className="text-base-content/70 mb-2">
              Enter the code sent to
            </p>
            <p className="text-[#4c8dd8] font-semibold">{email}</p>
          </div>

          <form onSubmit={handleVerify}>
            {/* Code Input */}
            <div className="flex justify-center gap-2 mb-6">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-[#4c8dd8]/30 rounded-lg focus:border-[#4c8dd8] focus:ring-2 focus:ring-[#4c8dd8]/20 transition-all"
                  disabled={loading}
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert-error shadow-lg mb-4">
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="alert alert-success bg-[#2E7D32] text-white shadow-lg mb-4">
                <HiOutlineCheckCircle className="w-5 h-5" />
                <span className="text-sm">{success}</span>
              </div>
            )}

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || code.join('').length !== 6}
              className="btn bg-[#4c8dd8] hover:bg-[#2E5D93] text-white w-full btn-lg shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </button>
          </form>

          {/* Resend Code */}
          <div className="text-center space-y-3">
            <p className="text-sm text-base-content/70">
              Didn't receive the code?
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading || resendCooldown > 0}
              className="btn btn-ghost text-[#4c8dd8] hover:bg-[#4c8dd8]/10 btn-sm disabled:opacity-50"
            >
              {resendLoading ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Sending...
                </>
              ) : resendCooldown > 0 ? (
                `Resend in ${resendCooldown}s`
              ) : (
                'Resend Code'
              )}
            </button>
          </div>

          {/* Back to Login */}
          <div className="text-center pt-4 border-t border-base-300">
            <Link
              to="/user/login"
              className="text-sm text-base-content/70 hover:text-[#4c8dd8]"
            >
              ← Back to Login
            </Link>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-xs">
              <strong>💡 Tip:</strong> Check your spam folder if you don't see the email. The code expires in 10 minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}