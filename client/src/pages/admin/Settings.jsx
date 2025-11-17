import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const Settings = () => {
  const { user, checkSession } = useAuth();
  
  // Username change state
  const [username, setUsername] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  
  // Email change state
  const [emailData, setEmailData] = useState({
    newEmail: '',
    password: ''
  });
  const [emailLoading, setEmailLoading] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Password strength indicator
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: '',
    color: ''
  });

  // Load current username
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
    }
  }, [user]);

  // Calculate password strength
  useEffect(() => {
    if (passwordData.newPassword) {
      const password = passwordData.newPassword;
      let score = 0;
      
      if (password.length >= 6) score++;
      if (password.length >= 10) score++;
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^a-zA-Z0-9]/.test(password)) score++;
      
      let label = '';
      let color = '';
      
      if (score <= 1) {
        label = 'Weak';
        color = 'text-error';
      } else if (score <= 3) {
        label = 'Fair';
        color = 'text-warning';
      } else if (score <= 4) {
        label = 'Good';
        color = 'text-info';
      } else {
        label = 'Strong';
        color = 'text-success';
      }
      
      setPasswordStrength({ score, label, color });
    } else {
      setPasswordStrength({ score: 0, label: '', color: '' });
    }
  }, [passwordData.newPassword]);

  // ✅ Redirect non-admin users
  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto p-6">
        <div className="alert alert-warning shadow-lg">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-bold">Access Denied</h3>
              <div className="text-xs">Only administrators can access settings. Contact the admin to change your username or reset your password.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle username change
  const handleUsernameChange = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error('Username cannot be empty');
      return;
    }
    
    if (username === user.username) {
      toast.error('New username is the same as current username');
      return;
    }
    
    if (username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      toast.error('Username can only contain letters, numbers, underscore, and hyphen');
      return;
    }
    
    setUsernameLoading(true);
    
    try {
      const response = await api.put('/auth/admin/update-username', {
        username: username.trim()
      });
      
      toast.success(response.msg || 'Username updated successfully!');
      
      // Refresh user session to get updated username
      await checkSession();
    } catch (err) {
      console.error('Username change error:', err);
      toast.error(err.message || 'Failed to update username');
    } finally {
      setUsernameLoading(false);
    }
  };

  // ✅ NEW: Handle email change
  const handleEmailChange = async (e) => {
    e.preventDefault();
    
    const { newEmail, password } = emailData;
    
    if (!newEmail.trim() || !password) {
      toast.error('Email and password are required');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (newEmail.toLowerCase().trim() === user.email.toLowerCase()) {
      toast.error('New email is the same as current email');
      return;
    }
    
    setEmailLoading(true);
    
    try {
      const response = await api.put('/auth/admin/change-email', {
        newEmail: newEmail.toLowerCase().trim(),
        password
      });
      
      toast.success(response.msg || 'Email updated successfully!');
      
      // Clear form
      setEmailData({ newEmail: '', password: '' });
      setShowEmailPassword(false);
      
      // Refresh user session
      await checkSession();
    } catch (err) {
      console.error('Email change error:', err);
      toast.error(err.message || 'Failed to update email');
    } finally {
      setEmailLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    const { currentPassword, newPassword, confirmPassword } = passwordData;
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    
    if (newPassword === currentPassword) {
      toast.error('New password must be different from current password');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }
    
    setPasswordLoading(true);
    
    try {
      const response = await api.put('/auth/admin/change-password', {
        currentPassword,
        newPassword,
        confirmPassword
      });
      
      toast.success(response.msg || 'Password changed successfully!');
      
      // Clear form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      console.error('Password change error:', err);
      toast.error(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="space-y-6">
        {/* Account Information Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Account Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Current Email</span>
                </label>
                <input 
                  type="email" 
                  value={user?.email || ''} 
                  className="input input-bordered w-full bg-base-200" 
                  disabled 
                />
                <label className="label">
                  <span className="label-text-alt text-gray-500">You can change your email below</span>
                </label>
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Role</span>
                </label>
                <input 
                  type="text" 
                  value={user?.role || ''} 
                  className="input input-bordered w-full bg-base-200 capitalize" 
                  disabled 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Change Username Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Change Username
            </h2>
            
            <form onSubmit={handleUsernameChange} className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text font-semibold">New Username</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="Enter new username"
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_\-]+"
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-gray-500">
                    3-20 characters. Letters, numbers, underscore, and hyphen only.
                  </span>
                </label>
              </div>
              
              <div className="card-actions justify-end">
                <button 
                  type="submit" 
                  className={`btn btn-primary ${usernameLoading ? 'loading' : ''}`}
                  disabled={usernameLoading || username === user?.username}
                >
                  {usernameLoading ? 'Updating...' : 'Update Username'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ✅ NEW: Change Email Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Change Email Address
            </h2>
            
            <form onSubmit={handleEmailChange} className="space-y-4">
              {/* New Email */}
              <div>
                <label className="label">
                  <span className="label-text font-semibold">New Email Address</span>
                </label>
                <input
                  type="email"
                  value={emailData.newEmail}
                  onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })}
                  className="input input-bordered w-full"
                  placeholder="Enter new email address"
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-gray-500">
                    You'll use this email to log in from now on
                  </span>
                </label>
              </div>

              {/* Password Verification */}
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Current Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showEmailPassword ? 'text' : 'password'}
                    value={emailData.password}
                    onChange={(e) => setEmailData({ ...emailData, password: e.target.value })}
                    className="input input-bordered w-full pr-10"
                    placeholder="Enter your current password to verify"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailPassword(!showEmailPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showEmailPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    )}
                  </button>
                </div>
                <label className="label">
                  <span className="label-text-alt text-gray-500">
                    Required to confirm your identity
                  </span>
                </label>
              </div>

              {/* Security Notice */}
              <div className="alert alert-warning">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <span className="text-sm">
                  After changing your email, you'll need to use the new email address to log in.
                </span>
              </div>

              <div className="card-actions justify-end">
                <button 
                  type="submit" 
                  className={`btn btn-primary ${emailLoading ? 'loading' : ''}`}
                  disabled={
                    emailLoading || 
                    !emailData.newEmail || 
                    !emailData.password ||
                    emailData.newEmail.toLowerCase().trim() === user?.email.toLowerCase()
                  }
                >
                  {emailLoading ? 'Updating Email...' : 'Update Email'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Change Password
            </h2>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Current Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="input input-bordered w-full pr-10"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="label">
                  <span className="label-text font-semibold">New Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="input input-bordered w-full pr-10"
                    placeholder="Enter new password"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    )}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {passwordData.newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 bg-base-300 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            passwordStrength.score <= 1 ? 'bg-error w-1/5' :
                            passwordStrength.score <= 3 ? 'bg-warning w-3/5' :
                            passwordStrength.score <= 4 ? 'bg-info w-4/5' :
                            'bg-success w-full'
                          }`}
                        />
                      </div>
                      <span className={`text-sm font-semibold ${passwordStrength.color}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Password should contain:</p>
                      <ul className="list-disc list-inside ml-2 space-y-0.5">
                        <li className={passwordData.newPassword.length >= 6 ? 'text-success' : ''}>
                          At least 6 characters
                        </li>
                        <li className={/[A-Z]/.test(passwordData.newPassword) && /[a-z]/.test(passwordData.newPassword) ? 'text-success' : ''}>
                          Upper and lowercase letters
                        </li>
                        <li className={/[0-9]/.test(passwordData.newPassword) ? 'text-success' : ''}>
                          Numbers
                        </li>
                        <li className={/[^a-zA-Z0-9]/.test(passwordData.newPassword) ? 'text-success' : ''}>
                          Special characters
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Confirm New Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className={`input input-bordered w-full pr-10 ${
                      passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                        ? 'input-error' 
                        : ''
                    }`}
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                  <label className="label">
                    <span className="label-text-alt text-error">Passwords do not match</span>
                  </label>
                )}
              </div>

              {/* Security Notice */}
              <div className="alert alert-info">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="text-sm">
                  For security reasons, you'll need to enter your current password to change it.
                </span>
              </div>

              <div className="card-actions justify-end">
                <button 
                  type="submit" 
                  className={`btn btn-primary ${passwordLoading ? 'loading' : ''}`}
                  disabled={
                    passwordLoading || 
                    !passwordData.currentPassword || 
                    !passwordData.newPassword || 
                    !passwordData.confirmPassword ||
                    passwordData.newPassword !== passwordData.confirmPassword ||
                    passwordData.newPassword.length < 6
                  }
                >
                  {passwordLoading ? 'Changing Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;