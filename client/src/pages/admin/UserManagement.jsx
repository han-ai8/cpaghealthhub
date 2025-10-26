// admin/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', username: '', role: '' });
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching users from API...');
      const data = await api.get('/auth/users');
      console.log('Users fetched successfully:', data.users?.length || 0);
      
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      setDeletingId(id);
      setError('');
      
      await api.delete(`/auth/users/${id}`);
      
      setUsers(users.filter(user => user.id !== id));
      alert('User deleted successfully!');
    } catch (err) {
      setError(err.message);
      alert('Error deleting user: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      username: user.username,
      role: user.role
    });
    setError('');
  };

  const handleSaveEdit = async () => {
    // Validation
    if (editForm.username.trim() === '' || editForm.username.length < 3) {
      setError('Username is required and must be at least 3 characters!');
      return;
    }
    if (!editForm.role) {
      setError('Please select a role!');
      return;
    }

    const payload = {
      role: editForm.role,
      username: editForm.username.trim(),
      ...(editForm.name.trim() && { name: editForm.name.trim() })
    };

    try {
      setLoading(true);
      setError('');
      
      const data = await api.put(`/auth/users/${editingUser.id}`, payload);
      
      setUsers(users.map(user => 
        user.id === editingUser.id ? { ...user, ...data.user } : user
      ));
      
      setEditingUser(null);
      setEditForm({ name: '', username: '', role: '' });
      alert('User details updated successfully!');
      
      window.dispatchEvent(new CustomEvent('userUpdated'));
    } catch (err) {
      let errorMsg = err.message;
      
      if (err.message.includes('Alias already taken')) {
        errorMsg = 'Alias is not available. Please choose another.';
      } else if (err.message.includes('Username already taken')) {
        errorMsg = 'Username is not available. Please choose another.';
      }
      
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({ name: '', username: '', role: '' });
    setError('');
  };

  if (loading && !editingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-red-700">Admin User Management</h1>
        <p className="text-base-content/70 mt-2">Manage all user accounts, roles, and details.</p>
      </div>

      {editingUser && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg">Edit User Details</h3>
            {error && <div className="alert alert-error mt-2">{error}</div>}
            
            <div className="form-control w-full mt-4 space-y-4">
              <label className="label">
                <span className="label-text">Email: {editingUser.email}</span>
              </label>
              
              <div>
                <label className="label">
                  <span className="label-text">Username * (Current: @{editingUser.username})</span>
                </label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  className="input input-bordered w-full"
                  placeholder="Enter username (min 3 chars)"
                  minLength={3}
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text">Alias (Name) - Optional</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="input input-bordered w-full"
                  placeholder="Enter alias (e.g., John Doe)"
                  maxLength={100}
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text">Role *</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={editForm.role}
                  onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                  disabled={loading}
                >
                  <option value="">Select Role</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="content_moderator">Content Moderator</option>
                  <option value="case_manager">Case Manager</option>
                </select>
              </div>
            </div>
            
            <div className="modal-action">
              <button
                onClick={handleSaveEdit}
                className="btn btn-primary"
                disabled={loading || !editForm.username || !editForm.role}
              >
                {loading ? <span className="loading loading-spinner"></span> : 'Save Changes'}
              </button>
              <button 
                onClick={handleCancelEdit} 
                className="btn btn-ghost" 
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {error && !editingUser && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
          <button onClick={fetchUsers} className="btn btn-sm ml-4">Retry</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="table w-full bg-base-100 shadow-xl rounded-lg">
          <thead>
            <tr>
              <th>User (Alias / Username)</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4">No users found.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="font-semibold">{user.name || user.username}</div>
                    <div className="text-sm text-gray-500">@{user.username}</div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${
                      user.role === 'admin' ? 'badge-error' : 
                      user.role === 'content_moderator' ? 'badge-warning' : 
                      user.role === 'case_manager' ? 'badge-info' : 
                      'badge-secondary'
                    }`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(user)}
                      className="btn btn-sm btn-primary mr-2"
                      disabled={deletingId === user.id || loading}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="btn btn-sm btn-error"
                      disabled={deletingId === user.id || loading}
                    >
                      {deletingId === user.id ? (
                        <span className="loading loading-spinner"></span>
                      ) : (
                        'Delete'
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;