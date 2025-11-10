// admin/StaffManagement.jsx
import React, { useState, useEffect, useMemo } from 'react';
import api from '../../utils/api';

/**
 * StaffManagement
 * - Manages ONLY admin-side staff: admin, case_manager, content_moderator
 * - Responsive: cards on mobile, table on desktop
 * - Create, Edit, Delete, Reset Password functionality
 * - Search, role filter, sort, pagination
 * - Clean visual hierarchy using white / blue / green / red
 * - Inline validation / error messages (no browser alert spam)
 */

const PAGE_SIZE = 10;

const roleLabel = (role) => {
  if (!role) return 'Unknown';
  const labels = {
    admin: 'Administrator',
    case_manager: 'Case Manager',
    content_moderator: 'Content Moderator',
  };
  return labels[role] || role.replace('_', ' ');
};

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return '-';
  }
};

const Badge = ({ role }) => {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium';
  const mapping = {
    admin: 'bg-red-100 text-red-800',
    content_moderator: 'bg-yellow-100 text-amber-800',
    case_manager: 'bg-blue-100 text-blue-800',
    default: 'bg-gray-100 text-gray-800',
  };
  return <span className={`${base} ${mapping[role] || mapping.default}`}>{roleLabel(role)}</span>;
};

const StatusBadge = ({ isActive }) => {
  return isActive ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
      Inactive
    </span>
  );
};

const IconSearch = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <circle cx="11" cy="11" r="7"></circle>
    <path d="M21 21l-4.35-4.35"></path>
  </svg>
);

const IconSort = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M3 6h18"></path>
    <path d="M8 12h8"></path>
    <path d="M11 18h2"></path>
  </svg>
);

const IconPlus = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M12 5v14M5 12h14"></path>
  </svg>
);

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStaff, setResetStaff] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'case_manager',
  });

  const [editForm, setEditForm] = useState({
    username: '',
    isActive: true,
  });

  const [resetForm, setResetForm] = useState({
    newPassword: '',
  });

  // UI controls
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, roleFilter, sortBy, sortDir]);

  const fetchStaff = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching staff from API...');
      const data = await api.get('/admin/staff-list');
      setStaff(data.staff || []);
      console.log('Staff fetched:', (data.staff || []).length);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
      setError(err?.message || 'Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  // Derived filtered list
  const filtered = useMemo(() => {
    let list = (staff || []).slice();

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((s) => {
        return (
          (s.username || '').toLowerCase().includes(q) ||
          (s.email || '').toLowerCase().includes(q)
        );
      });
    }

    if (roleFilter) {
      list = list.filter((s) => s.role === roleFilter);
    }

    list.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'username') {
        return dir * ((a.username || '').localeCompare(b.username || ''));
      }
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return dir * (ta - tb);
    });

    return list;
  }, [staff, query, roleFilter, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats
  const stats = useMemo(() => {
    return {
      total: staff.length,
      admins: staff.filter((s) => s.role === 'admin').length,
      caseManagers: staff.filter((s) => s.role === 'case_manager').length,
      contentModerators: staff.filter((s) => s.role === 'content_moderator').length,
      active: staff.filter((s) => s.isActive).length,
      inactive: staff.filter((s) => !s.isActive).length,
    };
  }, [staff]);

  // Create handlers
  const validateCreateForm = () => {
    if (!createForm.username || createForm.username.trim().length < 3) {
      return 'Username must be at least 3 characters.';
    }
    if (!createForm.email || !createForm.email.includes('@')) {
      return 'Please enter a valid email address.';
    }
    if (!createForm.password || createForm.password.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    if (!createForm.role) {
      return 'Please select a role.';
    }
    return '';
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const validationError = validateCreateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setActioning(true);
    setError('');
    try {
      const data = await api.post('/admin/create-staff', createForm);
      setSuccessMsg(data.msg || 'Staff member created successfully!');
      setShowCreateModal(false);
      setCreateForm({ username: '', email: '', password: '', role: 'case_manager' });
      fetchStaff();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Create error:', err);
      setError(err?.message || 'Failed to create staff member');
    } finally {
      setActioning(false);
    }
  };

  // Edit handlers
  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setEditForm({
      username: staffMember.username || '',
      isActive: staffMember.isActive !== false,
    });
    setError('');
    setSuccessMsg('');
  };

  const validateEditForm = () => {
    if (!editForm.username || editForm.username.trim().length < 3) {
      return 'Username must be at least 3 characters.';
    }
    return '';
  };

  const handleSaveEdit = async () => {
    const validationError = validateEditForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setActioning(true);
    setError('');
    try {
      const payload = {
        username: editForm.username.trim(),
        isActive: editForm.isActive,
      };
      const data = await api.put(`/admin/staff/${editingStaff._id}`, payload);
      setStaff((prev) =>
        prev.map((s) => (s._id === editingStaff._id ? { ...s, ...data.user } : s))
      );
      setSuccessMsg('Staff member updated successfully!');
      setEditingStaff(null);
      setEditForm({ username: '', isActive: true });
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Update error:', err);
      let errorMsg = err?.message || 'Failed to update staff member';
      if (errorMsg.includes('Username already taken')) {
        errorMsg = 'Username is not available. Please choose another.';
      }
      setError(errorMsg);
    } finally {
      setActioning(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingStaff(null);
    setEditForm({ username: '', isActive: true });
    setError('');
  };

  // Reset password handlers
  const handleResetPassword = (staffMember) => {
    setResetStaff(staffMember);
    setResetForm({ newPassword: '' });
    setShowResetModal(true);
    setError('');
    setSuccessMsg('');
  };

  const validateResetForm = () => {
    if (!resetForm.newPassword || resetForm.newPassword.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    return '';
  };

  const handleSaveReset = async (e) => {
    e.preventDefault();
    const validationError = validateResetForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setActioning(true);
    setError('');
    try {
      const data = await api.post(`/admin/staff/${resetStaff._id}/reset-password`, resetForm);
      setSuccessMsg(data.msg || 'Password reset successfully!');
      setShowResetModal(false);
      setResetStaff(null);
      setResetForm({ newPassword: '' });
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err?.message || 'Failed to reset password');
    } finally {
      setActioning(false);
    }
  };

  const handleCancelReset = () => {
    setShowResetModal(false);
    setResetStaff(null);
    setResetForm({ newPassword: '' });
    setError('');
  };

  // Delete handlers
  const promptDelete = (staffMember) => {
    setDeletingId(staffMember._id);
    setShowDeleteConfirm(true);
    setError('');
    setSuccessMsg('');
  };

  const handleDeleteConfirmed = async () => {
    if (!deletingId) return;
    setActioning(true);
    setError('');
    try {
      await api.delete(`/admin/staff/${deletingId}`);
      setStaff((prev) => prev.filter((s) => s._id !== deletingId));
      setSuccessMsg('Staff member deleted successfully!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Delete error:', err);
      setError(err?.message || 'Failed to delete staff member.');
    } finally {
      setShowDeleteConfirm(false);
      setDeletingId(null);
      setActioning(false);
    }
  };

  return (
    <div className="min-h-screen border rounded-lg bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">Staff Management</h1>
              <p className="mt-1 text-sm text-slate-600">
                Manage Case Managers and Content Moderators
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm text-sm font-medium"
            >
              <IconPlus />
              Create Staff Member
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-slate-500">Total Staff</div>
              <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-slate-500">Admins</div>
              <div className="text-2xl font-bold text-red-600">{stats.admins}</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-slate-500">Case Managers</div>
              <div className="text-2xl font-bold text-blue-600">{stats.caseManagers}</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-slate-500">Content Mods</div>
              <div className="text-2xl font-bold text-amber-600">{stats.contentModerators}</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-slate-500">Active</div>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-slate-500">Inactive</div>
              <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-4">
          <div className="relative flex-1">
            <input
              aria-label="Search staff"
              placeholder="Search username or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <div className="absolute left-3 top-2.5 text-slate-400">
              <IconSearch />
            </div>
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm shadow-sm"
          >
            <option value="">All roles</option>
            <option value="admin">Administrator</option>
            <option value="case_manager">Case Manager</option>
            <option value="content_moderator">Content Moderator</option>
          </select>

          <div className="inline-flex items-center gap-2">
            <button
              title="Toggle sort direction"
              onClick={() => setSortDir((s) => (s === 'asc' ? 'desc' : 'asc'))}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm shadow-sm inline-flex items-center gap-2"
            >
              <IconSort />
              <span className="text-xs text-slate-600">{sortDir === 'asc' ? 'Asc' : 'Desc'}</span>
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm shadow-sm"
            >
              <option value="createdAt">Sort: Created</option>
              <option value="username">Sort: Username</option>
            </select>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-2 mb-4">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-100 p-3 text-sm text-red-800 flex justify-between items-start">
              <div>{error}</div>
              <button onClick={() => setError('')} className="text-red-700 text-sm underline ml-4">
                Dismiss
              </button>
            </div>
          )}

          {successMsg && (
            <div className="rounded-md bg-green-50 border border-green-100 p-3 text-sm text-green-800 flex justify-between items-start">
              <div>{successMsg}</div>
              <button onClick={() => setSuccessMsg('')} className="text-green-700 text-sm underline ml-4">
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="min-h-[240px] flex items-center justify-center bg-white rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path className="opacity-75" d="M4 12a8 8 0 018-8v8z" fill="currentColor" />
              </svg>
              <span className="text-sm text-slate-600">Loading staff...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="space-y-3 md:hidden">
              {paginated.length === 0 ? (
                <div className="bg-white p-6 rounded-lg shadow-sm text-center text-slate-600">
                  No staff members found.
                </div>
              ) : (
                paginated.map((staffMember) => (
                  <div key={staffMember._id} className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-semibold">
                          {(staffMember.username || '').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-800">
                            @{staffMember.username}
                          </div>
                          <div className="text-xs text-slate-500">{staffMember.email}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <Badge role={staffMember.role} />
                      <StatusBadge isActive={staffMember.isActive} />
                    </div>

                    <div className="text-xs text-slate-400 mb-3">
                      Created: {formatDate(staffMember.createdAt)}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(staffMember)}
                        disabled={actioning}
                        className="flex-1 px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleResetPassword(staffMember)}
                        disabled={actioning}
                        className="flex-1 px-3 py-1.5 rounded-md bg-amber-600 text-white text-sm hover:bg-amber-700"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => promptDelete(staffMember)}
                        disabled={actioning || staffMember.role === 'admin'}
                        className="flex-1 px-3 py-1.5 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block bg-white shadow-sm rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                        No staff members found.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((staffMember) => (
                      <tr key={staffMember._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-semibold">
                              {(staffMember.username || '').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-800">
                                @{staffMember.username}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {staffMember.email}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge role={staffMember.role} />
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge isActive={staffMember.isActive} />
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {formatDate(staffMember.createdAt)}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(staffMember)}
                              disabled={actioning}
                              className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                              title="Edit staff member"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleResetPassword(staffMember)}
                              disabled={actioning}
                              className="px-3 py-1 rounded-md bg-amber-600 text-white hover:bg-amber-700"
                              title="Reset password"
                            >
                              Reset
                            </button>
                            <button
                              onClick={() => promptDelete(staffMember)}
                              disabled={actioning || staffMember.role === 'admin'}
                              className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={
                                staffMember.role === 'admin'
                                  ? 'Cannot delete admin accounts'
                                  : 'Delete staff member'
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="text-sm text-slate-600">
                Showing{' '}
                <span className="font-medium">
                  {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
                </span>{' '}
                to <span className="font-medium">{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{' '}
                <span className="font-medium">{filtered.length}</span> staff members
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded-md border border-slate-200 bg-white text-sm disabled:opacity-50"
                >
                  Prev
                </button>

                <div className="text-sm text-slate-600 px-2">Page</div>

                <select
                  value={page}
                  onChange={(e) => setPage(Number(e.target.value))}
                  className="px-2 py-1 rounded-md border border-slate-200 bg-white text-sm"
                >
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded-md border border-slate-200 bg-white text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Staff Modal */}
      {showCreateModal && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !actioning && setShowCreateModal(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden z-50">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Create New Staff Member</h2>
              <button
                onClick={() => !actioning && setShowCreateModal(false)}
                aria-label="Close"
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 border border-red-100 p-2 text-sm text-red-800">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-600 mb-1">Role *</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    disabled={actioning}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm"
                    required
                  >
                    <option value="case_manager">Case Manager</option>
                    <option value="content_moderator">Content Moderator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">Username *</label>
                  <input
                    type="text"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    minLength={3}
                    disabled={actioning}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">Email *</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    disabled={actioning}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-600 mb-1">Password *</label>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    minLength={6}
                    disabled={actioning}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    required
                  />
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Save this password to share with the staff member
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={actioning}
                  className="px-4 py-2 rounded-md bg-white border border-slate-200 text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actioning}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm inline-flex items-center gap-2"
                >
                  {actioning ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path className="opacity-75" d="M4 12a8 8 0 018-8v8z" fill="currentColor" />
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Create Staff Member'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !actioning && handleCancelEdit()}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden z-50">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Edit Staff Member</h2>
              <button
                onClick={() => !actioning && handleCancelEdit()}
                aria-label="Close"
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="text-sm text-slate-600">
                Email: <span className="font-medium text-slate-800">{editingStaff.email}</span>
              </div>
              <div className="text-sm text-slate-600">
                Role: <Badge role={editingStaff.role} />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 border border-red-100 p-2 text-sm text-red-800">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-600 mb-1">Username *</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  minLength={3}
                  disabled={actioning}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="form-control">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    disabled={actioning}
                    className="toggle toggle-success"
                  />
                  <div>
                    <span className="label-text font-medium">Account Status</span>
                    <p className="text-xs text-slate-500">
                      {editForm.isActive ? 'Active - Can login' : 'Inactive - Cannot login'}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={handleCancelEdit}
                disabled={actioning}
                className="px-4 py-2 rounded-md bg-white border border-slate-200 text-sm"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveEdit}
                disabled={actioning}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm inline-flex items-center gap-2"
              >
                {actioning ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path className="opacity-75" d="M4 12a8 8 0 018-8v8z" fill="currentColor" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && resetStaff && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !actioning && handleCancelReset()}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden z-50">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Reset Password</h2>
              <button
                onClick={() => !actioning && handleCancelReset()}
                aria-label="Close"
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveReset} className="px-6 py-5 space-y-4">
              <div className="text-sm text-slate-600 mb-4">
                Resetting password for:{' '}
                <span className="font-medium text-slate-800">@{resetStaff.username}</span>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 border border-red-100 p-2 text-sm text-red-800">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-600 mb-1">New Password *</label>
                <input
                  type="password"
                  value={resetForm.newPassword}
                  onChange={(e) => setResetForm({ newPassword: e.target.value })}
                  minLength={6}
                  disabled={actioning}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                />
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Make sure to save this password and share it with the staff member
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCancelReset}
                  disabled={actioning}
                  className="px-4 py-2 rounded-md bg-white border border-slate-200 text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actioning}
                  className="px-4 py-2 rounded-md bg-amber-600 text-white hover:bg-amber-700 text-sm inline-flex items-center gap-2"
                >
                  {actioning ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path className="opacity-75" d="M4 12a8 8 0 018-8v8z" fill="currentColor" />
                      </svg>
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !actioning && setShowDeleteConfirm(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden z-50">
            <div className="px-6 py-5">
              <h3 className="text-lg font-semibold text-slate-800">Confirm Delete</h3>
              <p className="text-sm text-slate-600 mt-2">
                Are you sure you want to permanently delete this staff member? This action{' '}
                <span className="font-medium">cannot</span> be undone.
              </p>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={actioning}
                  className="px-4 py-2 rounded-md bg-white border border-slate-200 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirmed}
                  disabled={actioning}
                  className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm inline-flex items-center gap-2"
                >
                  {actioning ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path className="opacity-75" d="M4 12a8 8 0 018-8v8z" fill="currentColor" />
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;