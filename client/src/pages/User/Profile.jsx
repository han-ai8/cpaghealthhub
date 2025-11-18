// Profile.jsx - COMPLETE UPDATED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../components/ConfirmModal';
import { Eye, EyeOff } from 'lucide-react';
import userPfp from '../../assets/userPfp.png';

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { confirm } = useConfirm();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', username: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [savedPosts, setSavedPosts] = useState([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  const fetchSavedPosts = async () => {
    try {
      setSavedLoading(true);
      const response = await fetch(`${API_URL}/posts/saved`, {
        credentials: 'include',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setSavedPosts(data);
      } else if (response.status === 401) {
        setSavedPosts([]);
        navigate('/user/login');
      } else {
        throw new Error('Failed to load saved posts');
      }
    } catch (err) {
      console.error('Fetch saved posts error:', err);
      toast.error(`Failed to load saved posts: ${err.message}`);
      setSavedPosts([]);
    } finally {
      setSavedLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  useEffect(() => {
    if (user && user._id) {
      fetchSavedPosts();
    }
  }, [user]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/auth/me`, {
          method: 'GET',
          credentials: 'include',
          headers: getAuthHeaders()
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            toast.error('Please log in to view your profile');
            navigate('/user/login');
            return;
          }
          throw new Error('Failed to load profile');
        }
        
        const data = await response.json();
        setUser(data.user);
        setEditForm({
          name: data.user.name || '',
          username: data.user.username
        });
      } catch (err) {
        console.error('Profile fetch error:', err);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleEditToggle = () => {
    if (user.role !== 'user') {
      toast.warning('Admins must edit profile via the admin panel');
      return;
    }
    setEditing(!editing);
  };

  const handleSaveProfile = async () => {
    if (user.role !== 'user') {
      toast.error('Only regular users can edit profile here');
      return;
    }

    if (editForm.name.trim() === '' || editForm.username.trim() === '') {
      toast.warning('Name and username are required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.msg === 'Username already taken') {
          toast.error('Username is not available. Please choose another');
        } else if (data.msg === 'Alias already taken') {
          toast.error('Alias is not available. Please choose another');
        } else if (data.errors) {
          const errorMsg = data.errors.map(e => e.msg).join(', ');
          toast.error(`Validation error: ${errorMsg}`);
        } else {
          toast.error('Failed to update profile: ' + (data.msg || 'Unknown error'));
        }
        return;
      }

      const data = await response.json();
      setUser(data.user);
      setEditForm({ name: data.user.name, username: data.user.username });
      setEditing(false);
      toast.success('Profile updated successfully!');
      window.dispatchEvent(new CustomEvent('userUpdated'));
    } catch (err) {
      toast.error('Error updating profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setEditForm({ name: user.name || '', username: user.username });
    }
    setEditing(false);
  };

  const handlePasswordToggle = () => {
    setChangingPassword(!changingPassword);
    if (!changingPassword) {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  const handleSavePassword = async () => {
    // Validation
    if (!passwordForm.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters!');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    try {
      setLoading(true);
      
      // Debug logging
      const token = localStorage.getItem('token');
      console.log('🔐 Password change attempt');
      console.log('Token exists:', !!token);
      console.log('API URL:', `${API_URL}/auth/password`);
      
      const response = await fetch(`${API_URL}/auth/password`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword
        })
      });

      console.log('Response status:', response.status);

      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        toast.error('Server error: Invalid response format');
        return;
      }

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please login again.');
          setTimeout(() => {
            localStorage.removeItem('token');
            navigate('/user/login');
          }, 2000);
          return;
        }
        
        if (response.status === 500) {
          console.error('Server error details:', data);
          toast.error('Server error: ' + (data.msg || data.error || 'Please try again later'));
          return;
        }
        
        if (data.msg) {
          toast.error(data.msg);
        } else {
          toast.error('Failed to change password: ' + (data.error || 'Unknown error'));
        }
        return;
      }

      console.log('✅ Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setChangingPassword(false);
      toast.success('Password changed successfully! Please login again for security.');
      
      setTimeout(() => {
        localStorage.removeItem('token');
        navigate('/user/login');
      }, 2000);
    } catch (err) {
      console.error('❌ Password change error:', err);
      toast.error('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPassword = () => {
    setChangingPassword(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleUnsave = async (postId) => {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/save`, {
        method: 'PUT',
        credentials: 'include',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Please login to manage saved posts');
          return;
        }
        const errData = await response.json();
        throw new Error(errData.error || 'Unsave failed');
      }
      
      const data = await response.json();
      await fetchSavedPosts();
      toast.success(data.message || (data.saved ? 'Post saved!' : 'Post unsaved!'));
    } catch (err) {
      console.error('Unsave error:', err);
      toast.error(err.message || 'Unsave failed');
    }
  };

  const handleViewPostOnHome = (postId) => {
    navigate('/user/home', { 
      state: { 
        scrollToPost: postId,
        fromSavedPosts: true 
      } 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF]">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-[#4C8DD8]"></span>
          <p className="mt-4 text-[#4C8DD8]">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF]">
        <div className="alert alert-error max-w-md bg-[#C62828] text-[#FFFFFF]">
          <span>Please log in to view your profile</span>
          <button onClick={() => navigate('/user/login')} className="btn btn-sm bg-[#4C8DD8] hover:bg-[#4C8DD8]/90 text-[#FFFFFF]">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4">
        {/* Profile Card */}
        <div className="card bg-[#FFFFFF] shadow-lg border border-[#4C8DD8]/20 p-6 mb-8">
          <div className="text-center mb-4">
            <div className="avatar placeholder mx-auto">
              <div className="text-neutral-content rounded-full w-30 h-24 flex items-center justify-center">
                <img
                  src={userPfp}
                  alt="Profile"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            </div>
          </div>

          <div className="divider border-[#4C8DD8]/20"></div>

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[#4C8DD8]">Profile Information</h2>
            {user.role === 'user' && (
              <button
                onClick={handleEditToggle}
                disabled={loading}
                className="btn btn-outline btn-primary bg-[#4C8DD8] hover:bg-[#4C8DD8]/90 text-[#FFFFFF] border-[#4C8DD8]"
              >
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            )}
            {user.role !== 'user' && (
              <span className="text-sm text-[#4C8DD8]/60">Use admin panel to edit</span>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-[#4C8DD8]">Name (Alias)</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="input input-bordered w-full border-[#4C8DD8]/20 focus:border-[#4C8DD8]"
                  placeholder="Enter your name"
                  disabled={loading}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-[#4C8DD8]">Username</span>
                </label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="input input-bordered w-full border-[#4C8DD8]/20 focus:border-[#4C8DD8]"
                  placeholder="Enter username"
                  disabled={loading}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-[#4C8DD8]">Email</span>
                </label>
                <input
                  type="email"
                  value={user.email}
                  className="input input-bordered w-full border-[#4C8DD8]/20"
                  disabled
                />
                <label className="label">
                  <span className="label-text-alt text-[#4C8DD8]/60">
                    Email cannot be changed
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleCancelEdit}
                  className="btn btn-ghost text-[#4C8DD8] hover:bg-[#4C8DD8]/10"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="btn btn-primary bg-[#4C8DD8] hover:bg-[#4C8DD8]/90 text-[#FFFFFF]"
                  disabled={loading}
                >
                  {loading ? <span className="loading loading-spinner"></span> : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div><span className="font-medium text-[#4C8DD8]">Username:</span> @{user.username}</div>
              <div><span className="font-medium text-[#4C8DD8]">Email:</span> {user.email}</div>
              {user.role !== 'user' && (
                <div className="text-sm text-[#4C8DD8]/60">
                  Role: {user.role.replace('_', ' ')}
                </div>
              )}
            </div>
          )}

          {/* Password Section */}
          <div className="divider border-[#4C8DD8]/20"></div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-[#4C8DD8]">Change Password</h3>
            <button
              onClick={handlePasswordToggle}
              disabled={loading}
              className="btn btn-outline btn-secondary bg-[#2E7D32] hover:bg-[#2E7D32]/90 text-[#FFFFFF] border-[#2E7D32]"
            >
              {changingPassword ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {changingPassword && (
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-[#4C8DD8]">Current Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="input input-bordered w-full border-[#4C8DD8]/20 focus:border-[#4C8DD8] pr-12"
                    placeholder="Enter current password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-[#4C8DD8]">New Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="input input-bordered w-full border-[#4C8DD8]/20 focus:border-[#4C8DD8] pr-12"
                    placeholder="Enter new password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-[#4C8DD8]">Confirm New Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="input input-bordered w-full border-[#4C8DD8]/20 focus:border-[#4C8DD8] pr-12"
                    placeholder="Confirm new password"
                    disabled={loading}
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

              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleCancelPassword}
                  className="btn btn-ghost text-[#4C8DD8] hover:bg-[#4C8DD8]/10"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePassword}
                  className="btn btn-primary bg-[#4C8DD8] hover:bg-[#4C8DD8]/90 text-[#FFFFFF]"
                  disabled={loading}
                >
                  {loading ? <span className="loading loading-spinner"></span> : 'Change Password'}
                </button>
              </div>
            </div>
          )}

          <div className="alert alert-info bg-[#CEF9D0] border-[#2E7D32] text-[#2E7D32] mt-6">
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
            <span>Your profile is completely private. Other users cannot view your information.</span>
          </div>
        </div>

        {/* Saved Posts Section */}
        <div className="max-w-6xl mx-auto bg-[#FFFFFF] rounded-lg p-6 shadow-lg border border-[#4C8DD8]/20">
          <h2 className="text-[#4C8DD8] font-bold text-xl mb-4">Saved Posts</h2>
          
          {savedLoading ? (
            <div className="text-center py-4">
              <span className="loading loading-spinner loading-md text-[#4C8DD8]"></span>
              <p className="text-[#4C8DD8]">Loading saved posts...</p>
            </div>
          ) : savedPosts.length === 0 ? (
            <div className="text-center py-8 text-[#4C8DD8]">
              <p>No saved posts yet. Save some from the home page!</p>
            </div>
          ) : (
            savedPosts.map((post) => (
              <div key={post._id} className="border-b border-[#4C8DD8]/20 pb-4 mb-4 flex space-x-4 last:border-b-0">
                <div className="avatar placeholder">
                  <div className="bg-[#C62828] text-neutral-content rounded-full w-12 h-12 flex items-center justify-center">
                    <img
                      src="/src/assets/cpag.jpg"
                      alt="CPAG"
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#4C8DD8] mb-1 truncate">
                    Cavite Positive Action Group The JCH Advocacy Inc.
                  </h3>
                  <p className="text-[#4C8DD8]/60 text-sm mb-1">
                    {post.status === 'approved' ? 'Admin Post' : 'Community Post'}
                  </p>
                  <p className="bg-[#C62828]/10 text-[#C62828] px-3 py-2 rounded mb-2 text-sm leading-relaxed">
                    {post.content.substring(0, 100)}...
                  </p>
                  {post.image && (
                    <img 
                      src={`${API_URL.replace('/api', '')}${post.image}`}
                      alt="Post" 
                      className="w-full h-32 object-cover rounded mt-2 mb-2" 
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                  <div className="flex items-center space-x-3 text-xs text-[#4C8DD8]">
                    <span className={`badge ${post.status === 'approved' ? ' bg-[#2E7D32] text-white' : 'badge-warning bg-[#C62828]/20 text-[#C62828]'} text-xs`}>
                      {post.status === 'approved' ? 'Public' : 'Pending'}
                    </span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <button
                    onClick={() => handleViewPostOnHome(post._id)}
                    className="mt-2 btn btn-sm bg-[#4C8DD8] hover:bg-[#4C8DD8]/90 text-white"
                  >
                    View on Home
                  </button>
                </div>

                <button
                  onClick={async () => {
                    const confirmed = await confirm({
                      message: 'Remove this post from saved items?',
                      confirmText: 'Remove',
                      type: 'warning'
                    });
                    if (confirmed) {
                      handleUnsave(post._id);
                    }
                  }}
                  aria-label="Unsave post"
                  className="btn bg-[#2E7D32] btn-sm gap-2 text-[#FFFFFF] hover:text-[#2E7D32] hover:bg-[#FFFFFF] border border-[#2E7D32] p-2 rounded-full self-start transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;