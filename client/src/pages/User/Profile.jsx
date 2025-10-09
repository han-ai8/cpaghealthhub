import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // If using React Router for redirects

const Profile = () => {
  const [user, setUser ] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', username: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const navigate = useNavigate(); // Optional: For redirect on errors

  // Fetch current user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include'
        });
        if (!response.ok) {
          if (response.status === 401) {
            // Redirect to login if unauthorized
            alert('Please log in to view your profile.');
            navigate('/login');
            return;
          }
          throw new Error('Failed to load profile');
        }
        const data = await response.json();
        setUser (data.user);
        setEditForm({
          name: data.user.name || '',
          username: data.user.username
        });
      } catch (err) {
        setError(err.message);
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  // Compute initials from name
  

  // Toggle edit mode
  const handleEditToggle = () => {
    setEditing(!editing);
    setError('');
  };

  // UPDATED: Save profile with specific error messages for duplicates
  const handleSaveProfile = async () => {
    if (editForm.name.trim() === '' || editForm.username.trim() === '') {
      alert('Name and username are required!');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        const data = await response.json();
        // Parse specific backend errors for user-friendly messages
        if (data.msg === 'Username already taken') {
          alert('Username is not available. Please choose another.');
        } else if (data.msg === 'Alias already taken') {
          alert('Alias is not available. Please choose another.');
        } else if (data.errors) {
          // Handle validation errors (e.g., length)
          const errorMsg = data.errors.map(e => e.msg).join(', ');
          alert('Validation error: ' + errorMsg);
        } else {
          alert('Failed to update profile: ' + (data.msg || 'Unknown error'));
        }
        return;
      }

      const data = await response.json();
      setUser (data.user);
      setEditForm({ name: data.user.name, username: data.user.username });
      setEditing(false);
      alert('Profile updated successfully!');
      // Dispatch event to update Header and other components
      window.dispatchEvent(new CustomEvent('userUpdated'));
    } catch (err) {
      setError('Network error: ' + err.message);
      alert('Error updating profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    if (user) {
      setEditForm({ name: user.name || '', username: user.username });
    }
    setEditing(false);
    setError('');
  };

  // Toggle password change
  const handlePasswordToggle = () => {
    setChangingPassword(!changingPassword);
    setError('');
  };

  // Save password
  const handleSavePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert('New password must be at least 6 characters!');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(passwordForm)
      });

      if (!response.ok) {
        const data = await response.json();
        alert('Failed to change password: ' + (data.msg || 'Unknown error'));
        return;
      }

      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setChangingPassword(false);
      alert('Password changed successfully!');
    } catch (err) {
      setError('Network error: ' + err.message);
      alert('Error changing password: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cancel password change
  const handleCancelPassword = () => {
    setChangingPassword(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="alert alert-error">
          <span>Error: {error}</span>
          <button onClick={() => window.location.reload()} className="btn btn-sm ml-4">Retry</button>
        </div>
      </div>
    );
  }

  

  return (
    <div className=" min-h-screen bg-blue-200 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-red-700 mb-4">Your Profile</h1>
          {user && (
            <div className="avatar placeholder mx-auto mb-4">
              <div className="text-neutral-content rounded-full w-24 h-24 flex items-center justify-center">
                <img
                    src="/src/assets/pfp2.png" // Static PFP - replace with user.avatarUrl if dynamic
                    alt="Profile Picture"
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
              </div>
            </div>
          )}
        </div>

        {/* Profile Card */}
        {user ? (
          <div className="bg-base-100 rounded-lg p-6 shadow-xl mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Profile Information</h2>
              <button
                onClick={handleEditToggle}
                disabled={loading}
                className="btn btn-outline btn-primary"
              >
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {editing ? (
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Name (Alias)</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="input input-bordered w-full"
                    placeholder="Enter your name"
                    disabled={loading}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Username</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="input input-bordered w-full"
                    placeholder="Enter username"
                    disabled={loading}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    className="input input-bordered w-full"
                    disabled
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleCancelEdit}
                    className="btn btn-ghost"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? <span className="loading loading-spinner"></span> : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div><span className="font-medium">Name:</span> {user.name || 'Not set'}</div>
                <div><span className="font-medium">Username:</span> @{user.username}</div>
                <div><span className="font-medium">Email:</span> {user.email}</div>
                <div><span className="font-medium">Role:</span> {user.role}</div>
                <div><span className="font-medium">Member since:</span> {new Date(user.createdAt).toLocaleDateString()}</div>
              </div>
            )}

            {/* Password Change Section */}
            <div className="divider"></div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Change Password</h3>
              <button
                onClick={handlePasswordToggle}
                disabled={loading}
                className="btn btn-outline btn-secondary"
              >
                {changingPassword ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            {changingPassword && (
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Current Password</span>
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="input input-bordered w-full"
                    placeholder="Enter current password"
                    disabled={loading}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">New Password</span>
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="input input-bordered w-full"
                    placeholder="Enter new password"
                    disabled={loading}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Confirm New Password</span>
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="input input-bordered w-full"
                    placeholder="Confirm new password"
                    disabled={loading}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleCancelPassword}
                    className="btn btn-ghost"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePassword}
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? <span className="loading loading-spinner"></span> : 'Change Password'}
                  </button>
                </div>
              </div>
            )}

            {/* Privacy Notice */}
            <div className="bg-green-200 border-green-200 shadow-green-300 alert alert-info mt-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Your profile is completely private. Other users cannot view your profile or personal information.</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p>No profile data available. Please log in.</p>
          </div>
        )}

        {/* Saved Posts Section - Hardcoded for now; connect to backend as needed */}
        <div className="max-w-3xl mx-auto mt-8 bg-base-100 rounded-lg p-6 shadow-xl">
          <h2 className="text-red-700 font-bold text-xl mb-4">Saved Posts</h2>

          {/* Single Saved Post */}
          <div className="border-b border-gray-300 pb-4 mb-4 flex space-x-4">
            <div className="avatar placeholder">
              <div className="bg-red-700 text-neutral-content rounded-full w-12 h-12 flex items-center justify-center">
                <span className="text-lg font-bold">AD</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-black mb-1">
                Cavite Positive Action Group The JCH Advocacy Inc.
              </h3>
              <p className="text-gray-500 text-sm mb-1">Admin Post</p>
              <p className="bg-red-100 text-red-600 px-3 py-2 rounded mb-1 text-sm">
                Important information about HIV advocacy and community support programs...
              </p>
              <div className="flex items-center space-x-3 text-xs text-gray-600">
                <span className="badge badge-primary text-xs">Public</span>
                <span>2024-03-15</span>
              </div>
            </div>
            <button aria-label="Bookmark" className="text-green-600 hover:text-green-700 self-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M6 4a2 2 0 00-2 2v14l8-5 8 5V6a2 2 0 00-2-2H6z" />
              </svg>
            </button>
          </div>

          {/* Another Saved Post */}
          <div className="flex space-x-4">
            <div className="avatar placeholder">
              <div className="bg-red-700 text-neutral-content rounded-full w-12 h-12 flex items-center justify-center">
                <span className="text-lg font-bold">AD</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-black mb-1">Cavite Positive Action Group The JCH Advocacy Inc.</h3>
              <p className="text-gray-500 text-sm mb-1">Admin Post</p>
              <p className="bg-red-100 text-red-600 px-3 py-2 rounded mb-1 text-sm">
                Important information about accessing confidential healthcare services...
              </p>
              <div className="flex items-center space-x-3 text-xs text-gray-600">
                <span className="badge badge-primary text-xs">Public</span>
                <span>2024-03-10</span>
              </div>
            </div>
            <button aria-label="Bookmark" className="text-green-600 hover:text-green-700 self-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M6 4a2 2 0 00-2 2v14l8-5 8 5V6a2 2 0 00-2-2H6z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;