import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
export default function AdminForgotPassword() {
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: new password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendCode = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    console.log('Sending code to:', email); // Debug log
    
    const res = await api.get('/auth/admin/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase().trim() })
    });

    const data = await res.json();
    console.log('Response:', data); // Debug log

    if (res.ok) {
      toast.success('Password reset code sent to your email!');
      
      // ✅ Show dev code in development mode
      if (data.devCode) {
        console.log('🔑 DEV CODE:', data.devCode);
        toast.success(`DEV CODE: ${data.devCode}`, { duration: 10000 });
      }
      
      setStep(2);
    } else {
      console.error('Error response:', data); // Debug log
      toast.error(data.msg || data.error || 'Failed to send reset code');
    }
  } catch (err) {
    console.error('Send code error:', err);
    toast.error('Network error. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const handleVerifyCode = async (e) => {
  e.preventDefault();
  
  if (code.length !== 6) {
    toast.error('Please enter the 6-digit code');
    return;
  }

  setLoading(true);

  try {
    // ✅ Ensure code is trimmed and exactly 6 digits
    const trimmedCode = code.trim();
    
    console.log('📤 Sending verification request:', { 
      email: email.toLowerCase().trim(), 
      code: trimmedCode,
      codeLength: trimmedCode.length 
    });
    
    const res = await api.get('/auth/admin/verify-reset-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: email.toLowerCase().trim(), 
        code: trimmedCode // ✅ Send trimmed code
      })
    });

    const data = await res.json();
    console.log('📥 Verify response:', { status: res.status, data });

    if (res.ok && data.valid) {
      toast.success('Code verified!');
      setStep(3);
    } else {
      // ✅ Show detailed error message
      console.error('Verification failed:', data);
      toast.error(data.msg || data.error || 'Invalid or expired code');
      
      // ✅ If there are validation errors, show the first one
      if (data.errors && data.errors.length > 0) {
        console.error('Validation errors:', data.errors);
      }
    }
  } catch (err) {
    console.error('Verify code error:', err);
    toast.error('Network error. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/admin/reset-password-with-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(), 
          code, 
          newPassword 
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Password reset successful!');
        setTimeout(() => navigate('/admin/login'), 2000);
      } else {
        toast.error(data.msg || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/admin/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      });

      if (res.ok) {
        toast.success('New code sent to your email!');
      } else {
        toast.error('Failed to resend code');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Link to="/admin/login" className="btn btn-ghost btn-sm mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>

        <div className="bg-base-200 rounded-lg shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#4c8dd8] mb-2 text-center">
            Reset Admin Password
          </h2>
          <p className="text-base-content/70 text-center mb-6">
            {step === 1 && 'Enter your admin email to receive a reset code'}
            {step === 2 && 'Enter the 6-digit code sent to your email'}
            {step === 3 && 'Create a new password for your account'}
          </p>

          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Admin Email</span>
                </label>
                <input
                  type="email"
                  className="input input-bordered w-full input-lg"
                  placeholder="admin@healthhub.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                className="btn bg-[#4c8dd8] hover:bg-[#2E5D93] text-white w-full btn-lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Sending...
                  </>
                ) : (
                  'Send Reset Code'
                )}
              </button>
            </form>
          )}

          {/* Step 2: Verify Code */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Verification Code</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full input-lg text-center text-2xl tracking-widest"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-gray-500">
                    Enter the 6-digit code sent to {email}
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="btn bg-[#4c8dd8] hover:bg-[#2E5D93] text-white w-full btn-lg"
                disabled={loading || code.length !== 6}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                className="btn btn-ghost w-full"
                disabled={loading}
              >
                Resend Code
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text font-semibold">New Password</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered w-full input-lg"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Confirm Password</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered w-full input-lg"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <div className="alert alert-error">
                  <span>Passwords do not match</span>
                </div>
              )}

              <button
                type="submit"
                className="btn bg-[#4c8dd8] hover:bg-[#2E5D93] text-white w-full btn-lg"
                disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}

          <div className="text-center mt-6 text-sm text-base-content/60 p-3 bg-base-300 rounded-lg">
            <p>⚠️ <strong>Note:</strong> This feature is for administrators only.</p>
            <p className="mt-1">Case Managers and Content Moderators should contact the administrator.</p>
          </div>
        </div>
      </div>
    </div>
  );
}