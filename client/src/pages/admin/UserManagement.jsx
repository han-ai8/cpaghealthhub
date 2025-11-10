// admin/UserManagement.jsx - UPDATED: With Activate/Deactivate Functionality
import React, { useState, useEffect, useMemo } from 'react';
import api from '../../utils/api';

/**
 * UserManagement - For Regular Users Only
 * - Shows only users with role='user' (not admin staff)
 * - Responsive: cards on mobile, table on desktop
 * - Search, sort, pagination
 * - Edit user details, assign case managers
 * - Activate/Deactivate accounts (prevents login when inactive)
 * - Delete users with confirmation
 * 
 * For managing admin staff (admin, case_manager, content_moderator),
 * use the separate AdminStaffManagement component
 */

const PAGE_SIZE = 10;

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return '-';
  }
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

// Status Badge Component
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

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', username: '', isActive: true });
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // UI controls
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, sortBy, sortDir]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching users from API...');
      const data = await api.get('/auth/users');
      // ✅ FILTER: Only show regular users (not staff)
      const regularUsers = (data.users || []).filter(u => u.role === 'user');
      setUsers(regularUsers);
      console.log('Regular users fetched:', regularUsers.length);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(err?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Derived filtered list
  const filtered = useMemo(() => {
    let list = (users || []).slice();

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((u) => {
        return (
          (u.username || '').toLowerCase().includes(q) ||
          (u.name || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q)
        );
      });
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
  }, [users, query, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.isActive !== false).length,
      inactive: users.filter((u) => u.isActive === false).length,
    };
  }, [users]);

  // Edit handlers
  const handleEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      username: user.username || '',
      isActive: user.isActive !== false, // Default to true if undefined
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
    const v = validateEditForm();
    if (v) {
      setError(v);
      return;
    }
    setActioning(true);
    setError('');
    try {
      const payload = {
        username: editForm.username.trim(),
        isActive: editForm.isActive,
        ...(editForm.name.trim() && { name: editForm.name.trim() }),
      };
      const data = await api.put(`/auth/users/${editingUser.id}`, payload);
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, ...data.user } : u)));
      setSuccessMsg('User updated successfully');
      setEditingUser(null);
      setEditForm({ name: '', username: '', isActive: true });
    } catch (err) {
      console.error('Update error:', err);
      let errorMsg = err?.message || 'Failed to update user';
      if (errorMsg.includes('Alias already taken')) {
        errorMsg = 'Alias is not available. Please choose another.';
      } else if (errorMsg.includes('Username already taken')) {
        errorMsg = 'Username is not available. Please choose another.';
      }
      setError(errorMsg);
    } finally {
      setActioning(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({ name: '', username: '', isActive: true });
    setError('');
  };

  // Delete handlers
  const promptDelete = (id) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
    setError('');
    setSuccessMsg('');
  };

  const handleDeleteConfirmed = async () => {
    if (!deletingId) return;
    setActioning(true);
    setError('');
    try {
      await api.delete(`/auth/users/${deletingId}`);
      setUsers((prev) => prev.filter((u) => u.id !== deletingId));
      setSuccessMsg('User deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      setError(err?.message || 'Failed to delete user');
    } finally {
      setShowDeleteConfirm(false);
      setDeletingId(null);
      setActioning(false);
    }
  };

  return (
    <div className="min-h-screen border rounded-lg bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">User Management</h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage regular user accounts and details
              {' • '}
              <span className="text-blue-600 font-medium">
                For staff management, go to Staff Management →
              </span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <input
                aria-label="Search users"
                placeholder="Search username, alias, or email..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <div className="absolute left-3 top-2.5 text-slate-400">
                <IconSearch />
              </div>
            </div>

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
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-xs text-slate-500">Total Users</div>
            <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-xs text-slate-500">Active Users</div>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-xs text-slate-500">Inactive Users</div>
            <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="text-blue-600 mt-0.5">ℹ️</div>
            <div className="text-sm text-blue-800">
              <strong>Note:</strong> Inactive users cannot login. Use this to temporarily suspend accounts for violations.
            </div>
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
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" d="M4 12a8 8 0 018-8v8z" fill="currentColor" />
              </svg>
              <span className="text-sm text-slate-600">Loading users...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="space-y-3 md:hidden">
              {paginated.length === 0 ? (
                <div className="bg-white p-6 rounded-lg shadow-sm text-center text-slate-600">No users found.</div>
              ) : (
                paginated.map((user) => (
                  <div key={user.id} className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-50 flex items-center justify-center text-green-700 font-semibold">
                          {(user.name || user.username || '').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-800">{user.name || user.username}</div>
                          <div className="text-xs text-slate-500">@{user.username}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                      </div>
                      <StatusBadge isActive={user.isActive !== false} />
                    </div>

                    <div className="text-xs text-slate-400 mb-3">
                      Created: {formatDate(user.createdAt)}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        disabled={actioning}
                        className="flex-1 px-3 py-1 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => promptDelete(user.id)}
                        disabled={actioning}
                        className="flex-1 px-3 py-1 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                        No regular users found.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center text-green-700 font-semibold">
                              {(user.name || user.username || '').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-800">{user.name || user.username}</div>
                              <div className="text-xs text-slate-500">@{user.username}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{user.email}</td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge isActive={user.isActive !== false} />
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDate(user.createdAt)}</td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            disabled={actioning}
                            className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => promptDelete(user.id)}
                            disabled={actioning}
                            className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700"
                          >
                            Delete
                          </button>
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
                Showing <span className="font-medium">{filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}</span> to{' '}
                <span className="font-medium">{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{' '}
                <span className="font-medium">{filtered.length}</span> users
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

      {/* Edit Modal */}
      {editingUser && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !actioning && handleCancelEdit()}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden z-50">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Edit User</h2>
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
                Email: <span className="font-medium text-slate-800">{editingUser.email}</span>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 border border-red-100 p-2 text-sm text-red-800">{error}</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Username *</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm((s) => ({ ...s, username: e.target.value }))}
                    minLength={3}
                    disabled={actioning}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">Alias (optional)</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))}
                    maxLength={100}
                    disabled={actioning}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              {/* Account Status Toggle */}
              <div className="form-control border-t pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm((s) => ({ ...s, isActive: e.target.checked }))}
                    disabled={actioning}
                    className="toggle toggle-success"
                  />
                  <div>
                    <span className="label-text font-medium">Account Status</span>
                    <p className="text-xs text-slate-500">
                      {editForm.isActive 
                        ? 'Active - User can login normally' 
                        : 'Inactive - User cannot login (account suspended)'}
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
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" d="M4 12a8 8 0 018-8v8z" fill="currentColor" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !actioning && setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden z-50">
            <div className="px-6 py-5">
              <h3 className="text-lg font-semibold text-slate-800">Confirm delete</h3>
              <p className="text-sm text-slate-600 mt-2">
                Are you sure you want to permanently delete this user? This action{' '}
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
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
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

export default UserManagement;