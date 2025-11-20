import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

export default function AdminResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [validToken, setValidToken] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      toast.error('Invalid reset link');
      navigate('/admin/login');
      return;
    }

    setToken(tokenParam);
    verifyToken(tokenParam);
  }, [searchParams, navigate]);

  const verifyToken = async (tokenToVerify) => {
  try {
    const res = await fetch(
      `/api/auth/admin/verify-reset-token/${tokenToVerify}`,
      { method: 'GET' }
    );
    const data = await res.json();

    if (res.ok && data.valid) {
      setValidToken(true);
    } else {
      toast.error(data.msg || 'Invalid or expired reset link');
      setTimeout(() => navigate('/admin/forgot-password'), 2000);
    }
  } catch (err) {
    console.error('Token verification error:', err);
    toast.error('Network error');
    setTimeout(() => navigate('/admin/login'), 2000);
  } finally {
    setVerifying(false);
  }
};

  const handleSubmit = async (e) => {
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
    const res = await fetch('/api/auth/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
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

  if (verifying) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-[#4c8dd8]"></span>
          <p className="mt-4 text-base-content/70">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!validToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-base-200 rounded-lg shadow-xl p-8">
        <h2 className="text-3xl font-bold text-[#4c8dd8] mb-2 text-center">Set New Password</h2>
        <p className="text-base-content/70 text-center mb-6">
          Enter your new password below
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text font-semibold">New Password</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input input-bordered w-full input-lg pr-12"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
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

          <button
            type="submit"
            className="btn bg-[#4c8dd8] hover:bg-[#2E5D93] text-white w-full btn-lg"
            disabled={loading}
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
      </div>
    </div>
  );
}