// AdminStaffManagement.jsx - Admin dashboard for managing staff
import { useState, useEffect } from 'react';
import api from '../../utils/api';

const AdminStaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'case_manager'
  });

  const [editForm, setEditForm] = useState({
    username: '',
    isActive: true
  });

  const [resetForm, setResetForm] = useState({
    newPassword: ''
  });

  // Fetch staff list
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await api.get('/admin/staff-list');
      setStaff(data.staff || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Create staff member
  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const data = await api.post('/admin/create-staff', createForm);
      setSuccess(data.msg);
      setShowCreateModal(false);
      setCreateForm({ username: '', email: '', password: '', role: 'case_manager' });
      fetchStaff();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create staff member');
    }
  };

  // Update staff member
  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const data = await api.put(`/admin/staff/${selectedStaff._id}`, editForm);
      setSuccess(data.msg);
      setShowEditModal(false);
      setSelectedStaff(null);
      fetchStaff();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update staff member');
    }
  };

  // Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const data = await api.post(`/admin/staff/${selectedStaff._id}/reset-password`, resetForm);
      setSuccess(data.msg);
      setShowResetModal(false);
      setSelectedStaff(null);
      setResetForm({ newPassword: '' });
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    }
  };

  // Delete staff member
  const handleDelete = async (staffId, username) => {
    if (!window.confirm(`Are you sure you want to delete ${username}? This action cannot be undone.`)) {
      return;
    }
    
    setError('');
    setSuccess('');
    
    try {
      const data = await api.delete(`/admin/staff/${staffId}`);
      setSuccess(data.msg);
      fetchStaff();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete staff member');
    }
  };

  // Open edit modal
  const openEditModal = (staffMember) => {
    setSelectedStaff(staffMember);
    setEditForm({
      username: staffMember.username,
      isActive: staffMember.isActive
    });
    setShowEditModal(true);
  };

  // Open reset password modal
  const openResetModal = (staffMember) => {
    setSelectedStaff(staffMember);
    setResetForm({ newPassword: '' });
    setShowResetModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const caseManagers = staff.filter(s => s.role === 'case_manager');
  const contentModerators = staff.filter(s => s.role === 'content_moderator');
  const admins = staff.filter(s => s.role === 'admin');

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#4c8dd8] mb-2">Staff Management</h1>
        <p className="text-base-content/70">Manage Case Managers and Content Moderators</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="alert alert-success shadow-lg mb-4">
          <span>{success}</span>
        </div>
      )}
      
      {error && (
        <div className="alert alert-error shadow-lg mb-4">
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Case Managers</div>
            <div className="stat-value text-[#4c8dd8]">{caseManagers.length}</div>
          </div>
        </div>
        
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Content Moderators</div>
            <div className="stat-value text-[#4c8dd8]">{contentModerators.length}</div>
          </div>
        </div>
        
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Admins</div>
            <div className="stat-value text-[#4c8dd8]">{admins.length}</div>
          </div>
        </div>
      </div>

      {/* Create Staff Button */}
      <button 
        onClick={() => setShowCreateModal(true)}
        className="btn bg-[#4c8dd8] hover:bg-[#2E5D93] text-white mb-6"
      >
        ➕ Create New Staff Member
      </button>

      {/* Case Managers Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Case Managers</h2>
        {caseManagers.length === 0 ? (
          <div className="alert alert-info">
            <span>No case managers yet. Create one using the button above.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {caseManagers.map(member => (
                  <tr key={member._id}>
                    <td className="font-semibold">{member.username}</td>
                    <td>{member.email}</td>
                    <td>
                      <span className={`badge ${member.isActive ? 'badge-success' : 'badge-error'}`}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                    <td className="space-x-2">
                      <button 
                        onClick={() => openEditModal(member)}
                        className="btn btn-sm btn-info"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => openResetModal(member)}
                        className="btn btn-sm btn-warning"
                      >
                        Reset Password
                      </button>
                      <button 
                        onClick={() => handleDelete(member._id, member.username)}
                        className="btn btn-sm btn-error"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Content Moderators Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Content Moderators</h2>
        {contentModerators.length === 0 ? (
          <div className="alert alert-info">
            <span>No content moderators yet. Create one using the button above.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contentModerators.map(member => (
                  <tr key={member._id}>
                    <td className="font-semibold">{member.username}</td>
                    <td>{member.email}</td>
                    <td>
                      <span className={`badge ${member.isActive ? 'badge-success' : 'badge-error'}`}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                    <td className="space-x-2">
                      <button 
                        onClick={() => openEditModal(member)}
                        className="btn btn-sm btn-info"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => openResetModal(member)}
                        className="btn btn-sm btn-warning"
                      >
                        Reset Password
                      </button>
                      <button 
                        onClick={() => handleDelete(member._id, member.username)}
                        className="btn btn-sm btn-error"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Staff Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Create New Staff Member</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Role</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={createForm.role}
                  onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
                  required
                >
                  <option value="case_manager">Case Manager</option>
                  <option value="content_moderator">Content Moderator</option>
                </select>
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text">Username</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({...createForm, username: e.target.value})}
                  required
                  minLength={3}
                />
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  className="input input-bordered w-full"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered w-full"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                  required
                  minLength={6}
                />
              </div>

              <div className="modal-action">
                <button type="submit" className="btn bg-[#4c8dd8] hover:bg-[#2E5D93] text-white">
                  Create
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && selectedStaff && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Edit Staff Member</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Username</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={editForm.username}
                  onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  required
                  minLength={3}
                />
              </div>
              
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Account Status</span>
                  <input 
                    type="checkbox" 
                    className="toggle toggle-success" 
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})}
                  />
                </label>
                <span className="text-sm text-base-content/60">
                  {editForm.isActive ? 'Active - Can login' : 'Inactive - Cannot login'}
                </span>
              </div>

              <div className="modal-action">
                <button type="submit" className="btn bg-[#4c8dd8] hover:bg-[#2E5D93] text-white">
                  Update
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && selectedStaff && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              Reset Password for {selectedStaff.username}
            </h3>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">New Password</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered w-full"
                  value={resetForm.newPassword}
                  onChange={(e) => setResetForm({newPassword: e.target.value})}
                  required
                  minLength={6}
                />
                <label className="label">
                  <span className="label-text-alt text-warning">
                    ⚠️ Make sure to save this password and share it with the staff member
                  </span>
                </label>
              </div>

              <div className="modal-action">
                <button type="submit" className="btn btn-warning">
                  Reset Password
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowResetModal(false)}
                  className="btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStaffManagement;