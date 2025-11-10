// ForgotPassword.jsx - User side password reset
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: Code & New Password
  const [formData, setFormData] = useState({
    email: '',
    code: ['', '', '', '', '', ''],
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  // Step 1: Send Reset Code
  const handleSendCode = async (e) => {
    e.preventDefault();

    if (!formData.email) {
      setError('Please enter your email address');
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/user/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Reset code sent to your email!');
        toast.success('Reset code sent to your email!');
        setTimeout(() => {
          setStep(2);
          setSuccess('');
        }, 1500);
      } else {
        const errorMsg = data.msg || data.message || 'Failed to send reset code';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      const errorMsg = 'Network error. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Code and Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    const code = formData.code.join('');

    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      toast.error('Please enter all 6 digits');
      return;
    }

    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please enter and confirm your new password');
      toast.error('Please enter and confirm your new password');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/user/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          code,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password reset successful! Redirecting to login...');
        toast.success('Password reset successful!');
        setTimeout(() => {
          navigate('/user/login');
        }, 2000);
      } else {
        const errorMsg = data.msg || data.message || 'Password reset failed';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Reset password error:', err);
      const errorMsg = 'Network error. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...formData.code];
    newCode[index] = value;
    setFormData({ ...formData, code: newCode });

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`reset-code-${index + 1}`)?.focus();
    }

    setError('');
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !formData.code[index] && index > 0) {
      document.getElementById(`reset-code-${index - 1}`)?.focus();
    }
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);

    if (!/^\d+$/.test(pastedData)) return;

    const newCode = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setFormData({ ...formData, code: newCode });

    const lastIndex = Math.min(pastedData.length, 5);
    document.getElementById(`reset-code-${lastIndex}`)?.focus();
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-base-100">
      {/* Left Side: Logo */}
      <div className="w-full md:w-1/2 bg-[#4c8dd8] flex flex-col items-center justify-center p-8 md:p-12 shadow-xl">
        <div className="bg-white/10 backdrop-blur-sm p-8 rounded-full mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-24 w-24 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">
          {step === 1 ? 'Forgot Password?' : 'Reset Your Password'}
        </h2>
        <p className="text-white/90 text-center text-lg">
          {step === 1
            ? "Enter your email and we'll send you a reset code"
            : 'Enter the code and create a new password'}
        </p>
      </div>

      {/* Right Side: Form */}
      <div className="w-full md:w-1/2 bg-base-100 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="text-center">
            <img 
              src="/src/assets/HEALTHUB.png" 
              alt="HealthHub Logo" 
              className="rounded-lg w-500 h-300 hover:scale-105 mb-4 mx-auto" 
            />
            <h2 className="text-3xl font-bold mb-2 text-[#4c8dd8]">
              {step === 1 ? 'Password Recovery' : 'Create New Password'}
            </h2>
            <p className="text-base-content/70">
              {step === 1
                ? 'Enter your email address below'
                : 'Enter the code from your email'}
            </p>
          </div>

          {/* Step 1: Email Input */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Email Address</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="input input-bordered w-full input-lg"
                  placeholder="your.email@example.com"
                  disabled={loading}
                  required
                />
              </div>

              {error && (
                <div className="alert alert-error shadow-lg">
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {success && (
                <div className="alert alert-success bg-[#2E7D32] text-white shadow-lg">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">{success}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn bg-[#4c8dd8] hover:bg-[#2E5D93] text-white w-full btn-lg shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Sending Code...
                  </>
                ) : (
                  'Send Reset Code'
                )}
              </button>
            </form>
          )}

          {/* Step 2: Code & Password Input */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* Verification Code */}
              <div>
                <label className="label">
                  <span className="label-text font-semibold text-center w-full">
                    Enter 6-Digit Code
                  </span>
                </label>
                <div className="flex justify-center gap-2 mb-4">
                  {formData.code.map((digit, index) => (
                    <input
                      key={index}
                      id={`reset-code-${index}`}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(index, e)}
                      onPaste={handleCodePaste}
                      className="w-12 h-14 text-center text-xl font-bold border-2 border-[#4c8dd8]/30 rounded-lg focus:border-[#4c8dd8] focus:ring-2 focus:ring-[#4c8dd8]/20 transition-all"
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="label">
                  <span className="label-text font-semibold">New Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, newPassword: e.target.value })
                    }
                    className="input input-bordered w-full input-lg pr-12"
                    placeholder="Enter new password"
                    disabled={loading}
                    required
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

              {/* Confirm Password */}
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Confirm New Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    className="input input-bordered w-full input-lg pr-12"
                    placeholder="Confirm new password"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="alert alert-error shadow-lg">
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {success && (
                <div className="alert alert-success bg-[#2E7D32] text-white shadow-lg">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">{success}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn bg-[#4c8dd8] hover:bg-[#2E5D93] text-white w-full btn-lg shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-ghost w-full text-[#4c8dd8] hover:bg-[#4c8dd8]/10"
              >
                ← Back to email
              </button>
            </form>
          )}

          {/* Back to Login */}
          <div className="text-center pt-4 border-t border-base-300">
            <Link
              to="/user/login"
              className="text-sm text-base-content/70 hover:text-[#4c8dd8]"
            >
              ← Back to Login
            </Link>
          </div>

          {/* Info Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-xs">
              <strong>⏰ Note:</strong> The reset code expires in 10 minutes. Check your spam folder if you don't receive it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}