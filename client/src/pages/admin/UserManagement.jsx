import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser , setEditingUser ] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', role: '' }); // Includes name (alias)
  const [deletingId, setDeletingId] = useState(null);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch('/api/auth/users', {
          method: 'GET',
          credentials: 'include' // Send session cookies
        });
        if (!response.ok) {
          throw new Error('Failed to fetch users (Admin access required?)');
        }
        const data = await response.json();
        setUsers(data.users || []);
      } catch (err) {
        setError(err.message);
        alert('Error loading users: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Delete user
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      setDeletingId(id);
      setError('');
      const response = await fetch(`/api/auth/users/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.msg || 'Failed to delete user');
      }
      setUsers(users.filter(user => user.id !== id));
      alert('User  deleted successfully!');
    } catch (err) {
      setError(err.message);
      alert('Error deleting user: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Open edit modal and populate form
  const handleEdit = (user) => {
    setEditingUser (user);
    setEditForm({
      name: user.name || '', // Current alias, fallback to empty
      role: user.role
    });
    setError(''); // Clear any previous errors
  };

  // UPDATED: Save edits (name and/or role) with specific error messages
  const handleSaveEdit = async () => {
    if (!editForm.role) {
      setError('Please select a role!');
      return;
    }
    // Name is optional, but trim if provided
    const payload = {
      role: editForm.role,
      ...(editForm.name.trim() && { name: editForm.name.trim() }) // Only send if not empty
    };

    try {
      setLoading(true);
      setError(''); // Clear previous errors
      const response = await fetch(`/api/auth/users/${editingUser .id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const data = await response.json();
        // Parse specific backend errors for user-friendly messages
        let errorMsg = data.msg || 'Failed to update user';
        if (data.msg === 'Alias already taken') {
          errorMsg = 'Alias is not available. Please choose another.';
        } else if (data.msg === 'Username already taken') {
          errorMsg = 'Username is not available. Please choose another.'; // For future username edits
        } else if (data.msg === 'Invalid role') {
          errorMsg = 'Please select a valid role.';
        } else if (data.errors) {
          // Handle validation errors (e.g., name length)
          errorMsg = data.errors.map(e => e.msg).join(', ');
        }
        setError(errorMsg);
        throw new Error(errorMsg); // Trigger catch for alert
      }
      // Success: Update local state with response
      const data = await response.json();
      setUsers(users.map(user => 
        user.id === editingUser .id ? { ...user, ...data.user } : user
      ));
      setEditingUser (null);
      setEditForm({ name: '', role: '' });
      alert('User  details updated successfully!');
    } catch (err) {
      // Error already set above; show alert for visibility
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingUser (null);
    setEditForm({ name: '', role: '' });
    setError('');
  };

  if (loading && !editingUser ) { // Don't show global loading if modal is open
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-red-700">User  Management</h2>
        
        {/* Edit Modal */}
        {editingUser  && (
          <div className="modal modal-open">
            <div className="modal-box max-w-2xl">
              <h3 className="font-bold text-lg">Edit User Details</h3>
              {error && <div className="alert alert-error mt-2">{error}</div>}
              <div className="form-control w-full mt-4 space-y-4">
                <label className="label">
                  <span className="label-text">Username: {editingUser .username}</span>
                </label>
                <label className="label">
                  <span className="label-text">Email: {editingUser .email}</span>
                </label>
                {/* Alias (Name) Input */}
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
                    <option value="user">User </option>
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
                  disabled={loading || !editForm.role}
                >
                  {loading ? <span className="loading loading-spinner"></span> : 'Save Changes'}
                </button>
                <button onClick={handleCancelEdit} className="btn btn-ghost" disabled={loading}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        {error && !editingUser  && ( // Show global error if not in modal
          <div className="alert alert-error mb-4">
            <span>{error}</span>
            <button onClick={() => window.location.reload()} className="btn btn-sm ml-4">Retry</button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="table w-full bg-base-100 shadow-xl rounded-lg">
            <thead>
              <tr>
                <th>User (Alias)</th>
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
                      <div className="font-semibold">{user.name || user.username}</div> {/* Display alias or fallback to username */}
                      <div className="text-sm text-gray-500">@{user.username}</div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${user.role === 'admin' ? 'badge-error' : user.role === 'content_moderator' ? 'badge-warning' : user.role === 'case_manager' ? 'badge-info' : 'badge-secondary'}`}>
                        {user.role.replace('_', ' ')} {/* Humanize role names */}
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
    </Layout>
  );
};

export default UserManagement;