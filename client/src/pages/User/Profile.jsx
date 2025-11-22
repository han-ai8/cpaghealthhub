// Profile.jsx - COMPLETE UPDATED VERSION WITH DARK MODE AND FULL RESPONSIVENESS
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../components/ConfirmModal';
import { Eye, EyeOff } from 'lucide-react';
import userPfp from '../../assets/userPfp.png';
import api from '../../utils/api';
import cpag from '../../assets/cpag.jpg';

const Profile = () => {
  const navigate = useNavigate();
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

  // Fetch saved posts
  const fetchSavedPosts = async () => {
    try {
      setSavedLoading(true);
      const response = await api.get('/posts/saved');
      setSavedPosts(response.data || response);
    } catch (err) {
      console.error('Fetch saved posts error:', err);
      toast.error(err.response?.data?.message || err.message);
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
        const response = await api.get('/auth/me');
        const userData = response.data?.user || response.user || response;
        setUser(userData);
        setEditForm({
          name: userData.name || '',
          username: userData.username
        });
      } catch (err) {
        console.error('Profile fetch error:', err);
        toast.error(err.response?.data?.message || err.message);
        if (err.response?.data?.message?.includes('login') || err.message.includes('login')) {
          navigate('/user/login');
        }
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
    try {
      setLoading(true);
      const response = await api.put('/auth/profile', {
        name: editForm.name,
        username: editForm.username
      });
      
      const userData = response.data?.user || response.user || response;
      setUser(userData);
      setEditForm({ name: userData.name, username: userData.username });
      setEditing(false);
      toast.success('Profile updated successfully!');
      window.dispatchEvent(new CustomEvent('userUpdated'));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
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
    try {
      setLoading(true);
      
      await api.put('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      });
      
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setChangingPassword(false);
      toast.success('Password changed successfully! Please login again for security.');
      
      setTimeout(() => {
        localStorage.removeItem('token');
        navigate('/user/login');
      }, 2000);
    } catch (err) {
      console.error('Password change error:', err);
      toast.error(err.response?.data?.message || err.message);
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
      const response = await api.put(`/posts/${postId}/save`);
      const data = response.data || response;
      await fetchSavedPosts();
      toast.success(data.message || (data.saved ? 'Post saved!' : 'Post unsaved!'));
    } catch (err) {
      console.error('Unsave error:', err);
      toast.error(err.response?.data?.message || err.message);
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
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF] dark:bg-gray-900 px-4">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-[#4C8DD8] dark:text-blue-400"></span>
          <p className="mt-4 text-[#4C8DD8] dark:text-blue-400 text-sm sm:text-base">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF] dark:bg-gray-900 px-4">
        <div className="alert alert-error max-w-md bg-[#C62828] dark:bg-red-900 text-[#FFFFFF] flex-col sm:flex-row gap-3">
          <span className="text-sm sm:text-base">Please log in to view your profile</span>
          <button onClick={() => navigate('/user/login')} className="btn btn-sm bg-[#4C8DD8] dark:bg-blue-600 hover:bg-[#4C8DD8]/90 dark:hover:bg-blue-700 text-[#FFFFFF] w-full sm:w-auto">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-6 lg:py-8">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Profile Card */}
        <div className="card bg-[#FFFFFF] dark:bg-gray-800 shadow-lg border border-[#4C8DD8]/20 dark:border-gray-700 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="text-center mb-4">
            <div className="avatar placeholder mx-auto">
              <div className="text-neutral-content rounded-full w-20 h-20 sm:w-24 sm:h-24 md:w-30 md:h-24 flex items-center justify-center">
                <img
                  src={userPfp}
                  alt="Profile"
                  className="rounded-full"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            </div>
          </div>

          <div className="divider border-[#4C8DD8]/20 dark:border-gray-700"></div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h2 className="text-lg sm:text-xl font-semibold text-[#4C8DD8] dark:text-blue-400">Profile Information</h2>
            {user.role === 'user' && (
              <button
                onClick={handleEditToggle}
                disabled={loading}
                className="btn btn-outline btn-primary bg-[#4C8DD8] dark:bg-blue-600 hover:bg-[#4C8DD8]/90 dark:hover:bg-blue-700 text-[#FFFFFF] border-[#4C8DD8] dark:border-blue-600 btn-sm sm:btn-md w-full sm:w-auto"
              >
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            )}
            {user.role !== 'user' && (
              <span className="text-xs sm:text-sm text-[#4C8DD8]/60 dark:text-gray-400">Use admin panel to edit</span>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-[#4C8DD8] dark:text-blue-400 text-sm sm:text-base">Name (Alias)</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="input input-bordered w-full border-[#4C8DD8]/20 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:border-[#4C8DD8] dark:focus:border-blue-400 text-sm sm:text-base"
                  placeholder="Enter your name"
                  disabled={loading}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-[#4C8DD8] dark:text-blue-400 text-sm sm:text-base">Username</span>
                </label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="input input-bordered w-full border-[#4C8DD8]/20 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:border-[#4C8DD8] dark:focus:border-blue-400 text-sm sm:text-base"
                  placeholder="Enter username"
                  disabled={loading}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-[#4C8DD8] dark:text-blue-400 text-sm sm:text-base">Email</span>
                </label>
                <input
                  type="email"
                  value={user.email}
                  className="input input-bordered w-full border-[#4C8DD8]/20 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-400 text-sm sm:text-base"
                  disabled
                />
                <label className="label">
                  <span className="label-text-alt text-[#4C8DD8]/60 dark:text-gray-400 text-xs">
                    Email cannot be changed
                  </span>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  onClick={handleCancelEdit}
                  className="btn btn-ghost text-[#4C8DD8] dark:text-blue-400 hover:bg-[#4C8DD8]/10 dark:hover:bg-gray-700 w-full sm:w-auto"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="btn btn-primary bg-[#4C8DD8] dark:bg-blue-600 hover:bg-[#4C8DD8]/90 dark:hover:bg-blue-700 text-[#FFFFFF] w-full sm:w-auto"
                  disabled={loading}
                >
                  {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-gray-800 dark:text-gray-200 text-sm sm:text-base">
              <div className="break-words"><span className="font-medium text-[#4C8DD8] dark:text-blue-400">Username:</span> @{user.username}</div>
              <div className="break-all"><span className="font-medium text-[#4C8DD8] dark:text-blue-400">Email:</span> {user.email}</div>
              {user.role !== 'user' && (
                <div className="text-xs sm:text-sm text-[#4C8DD8]/60 dark:text-gray-400">
                  Role: {user.role.replace('_', ' ')}
                </div>
              )}
            </div>
          )}

          {/* Password Section */}
          <div className="divider border-[#4C8DD8]/20 dark:border-gray-700 mt-4 sm:mt-6"></div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h3 className="text-base sm:text-lg font-semibold text-[#4C8DD8] dark:text-blue-400">Change Password</h3>
            <button
              onClick={handlePasswordToggle}
              disabled={loading}
              className="btn btn-outline btn-secondary bg-[#2E7D32] dark:bg-green-700 hover:bg-[#2E7D32]/90 dark:hover:bg-green-800 text-[#FFFFFF] border-[#2E7D32] dark:border-green-700 btn-sm sm:btn-md w-full sm:w-auto"
            >
              {changingPassword ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {changingPassword && (
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-[#4C8DD8] dark:text-blue-400 text-sm sm:text-base">Current Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="input input-bordered w-full border-[#4C8DD8]/20 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:border-[#4C8DD8] dark:focus:border-blue-400 pr-12 text-sm sm:text-base"
                    placeholder="Enter current password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-[#4C8DD8] dark:text-blue-400 text-sm sm:text-base">New Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="input input-bordered w-full border-[#4C8DD8]/20 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:border-[#4C8DD8] dark:focus:border-blue-400 pr-12 text-sm sm:text-base"
                    placeholder="Enter new password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-[#4C8DD8] dark:text-blue-400 text-sm sm:text-base">Confirm New Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="input input-bordered w-full border-[#4C8DD8]/20 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:border-[#4C8DD8] dark:focus:border-blue-400 pr-12 text-sm sm:text-base"
                    placeholder="Confirm new password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  onClick={handleCancelPassword}
                  className="btn btn-ghost text-[#4C8DD8] dark:text-blue-400 hover:bg-[#4C8DD8]/10 dark:hover:bg-gray-700 w-full sm:w-auto"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePassword}
                  className="btn btn-primary bg-[#4C8DD8] dark:bg-blue-600 hover:bg-[#4C8DD8]/90 dark:hover:bg-blue-700 text-[#FFFFFF] w-full sm:w-auto"
                  disabled={loading}
                >
                  {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Change Password'}
                </button>
              </div>
            </div>
          )}

          <div className="alert alert-info bg-[#CEF9D0] dark:bg-green-900/30 border-[#2E7D32] dark:border-green-700 text-[#2E7D32] dark:text-green-300 mt-4 sm:mt-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-5 h-5 sm:w-6 sm:h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-xs sm:text-sm">Your profile is completely private. Other users cannot view your information.</span>
          </div>
        </div>

        {/* Saved Posts Section */}
        <div className="max-w-6xl mx-auto bg-[#FFFFFF] dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-lg border border-[#4C8DD8]/20 dark:border-gray-700">
          <h2 className="text-[#4C8DD8] dark:text-blue-400 font-bold text-lg sm:text-xl mb-4">Saved Posts</h2>
          
          {savedLoading ? (
            <div className="text-center py-4">
              <span className="loading loading-spinner loading-md text-[#4C8DD8] dark:text-blue-400"></span>
              <p className="text-[#4C8DD8] dark:text-blue-400 text-sm sm:text-base mt-2">Loading saved posts...</p>
            </div>
          ) : savedPosts.length === 0 ? (
            <div className="text-center py-8 text-[#4C8DD8] dark:text-gray-400">
              <p className="text-sm sm:text-base">No saved posts yet. Save some from the home page!</p>
            </div>
          ) : (
            savedPosts.map((post) => (
              <div key={post._id} className="border-b border-[#4C8DD8]/20 dark:border-gray-700 pb-4 mb-4 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 last:border-b-0">
                <div className="avatar placeholder mx-auto sm:mx-0">
                  <div className="bg-[#C62828] dark:bg-red-800 text-neutral-content rounded-full w-12 h-12 flex items-center justify-center shrink-0">
                    <img
                      src={cpag}
                      alt="CPAG"
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#4C8DD8] dark:text-blue-400 mb-1 text-sm sm:text-base truncate">
                    Cavite Positive Action Group The JCH Advocacy Inc.
                  </h3>
                  <p className="text-[#4C8DD8]/60 dark:text-gray-400 text-xs sm:text-sm mb-1">
                    {post.status === 'approved' ? 'Admin Post' : 'Community Post'}
                  </p>
                  <p className="bg-[#C62828]/10 dark:bg-red-900/20 text-[#C62828] dark:text-red-400 px-2 sm:px-3 py-2 rounded mb-2 text-xs sm:text-sm leading-relaxed break-words">
                    {post.content.substring(0, 100)}...
                  </p>
                  {post.image && (
                    <img 
                      src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${post.image}`}
                      alt="Post" 
                      className="w-full h-24 sm:h-32 object-cover rounded mt-2 mb-2" 
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-[#4C8DD8] dark:text-blue-400 mb-2">
                    <span className={`badge ${post.status === 'approved' ? ' bg-[#2E7D32] dark:bg-green-700 text-white' : 'badge-warning bg-[#C62828]/20 dark:bg-red-900/30 text-[#C62828] dark:text-red-400'} text-xs`}>
                      {post.status === 'approved' ? 'Public' : 'Pending'}
                    </span>
                    <span className="text-xs sm:text-sm">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <button
                    onClick={() => handleViewPostOnHome(post._id)}
                    className="mt-2 btn btn-sm bg-[#4C8DD8] dark:bg-blue-600 hover:bg-[#4C8DD8]/90 dark:hover:bg-blue-700 text-white w-full sm:w-auto"
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
                  className="btn bg-[#2E7D32] dark:bg-green-700 btn-sm gap-2 text-[#FFFFFF] hover:text-[#2E7D32] dark:hover:text-green-300 hover:bg-[#FFFFFF] dark:hover:bg-gray-700 border border-[#2E7D32] dark:border-green-700 p-2 rounded-full self-center sm:self-start transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 sm:h-5 sm:w-5"
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