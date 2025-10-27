// src/pages/admin/Appointments.jsx - UPDATED WITH CASE MANAGER WORKLOAD
import React, { useState, useEffect } from 'react';
import { 
  Eye, X, Calendar, Clock, User as UserIcon, AlertCircle, 
  CheckCircle, XCircle, RefreshCw, UserCheck, Trash2, 
  FileText, Award, TrendingUp, Activity, Users 
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [caseManagers, setCaseManagers] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showSessionNoteModal, setShowSessionNoteModal] = useState(false);
  const [selectedCaseManager, setSelectedCaseManager] = useState('');
  const [sessionNote, setSessionNote] = useState({ notes: '', progress: 'good' });
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  useEffect(() => {
    fetchAppointments();
    fetchCaseManagers();
    fetchStats();
  }, []);

  // Real-time polling
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing appointments...');
      fetchAppointments();
      fetchCaseManagers(); // Refresh workload info
      fetchStats();
      setLastUpdate(new Date());
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchAppointments = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/appointments`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const data = await response.json();
      // Validate that data is an array; fallback to empty array if not
      setAppointments(Array.isArray(data) ? data : []);
      console.log('✅ Appointments loaded:', Array.isArray(data) ? data.length : 'Invalid data format - defaulting to empty array');
    } else {
      // Handle non-OK responses (e.g., 404, 500) by resetting to empty array
      setAppointments([]);
      console.error('Failed to fetch appointments:', response.status, response.statusText);
    }
  } catch (err) {
    // Handle network errors by resetting to empty array
    setAppointments([]);
    console.error('Error fetching appointments:', err);
  }
};


  const fetchCaseManagers = async () => {
    try {
      // ✅ Use the new endpoint with workload info
      const response = await fetch(`${API_URL}/admin/appointments/case-managers/available`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setCaseManagers(data);
        console.log('✅ Case managers with workload:', data);
      }
    } catch (err) {
      console.error('Error fetching case managers:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/appointments/stats/overview`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleAssignCaseManager = async () => {
    if (!selectedCaseManager) {
      alert('Please select a case manager');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/admin/appointments/${selectedAppointment._id}/assign`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ caseManagerId: selectedCaseManager })
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(data.message || 'Case manager assigned successfully!');
        setShowAssignModal(false);
        setSelectedCaseManager('');
        await fetchAppointments();
        await fetchCaseManagers(); // Refresh workload
        await fetchStats();
      } else {
        alert(data.error || 'Failed to assign case manager');
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignCaseManager = async (appointmentId) => {
    if (!confirm('Are you sure you want to unassign this case manager?')) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/admin/appointments/${appointmentId}/unassign`,
        {
          method: 'PUT',
          headers: getAuthHeaders()
        }
      );

      if (response.ok) {
        alert('Case manager unassigned successfully!');
        await fetchAppointments();
        await fetchCaseManagers(); // Refresh workload
        await fetchStats();
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      const response = await fetch(
        `${API_URL}/admin/appointments/${appointmentId}/status`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ status: newStatus })
        }
      );

      if (response.ok) {
        alert('Status updated successfully!');
        await fetchAppointments();
        await fetchStats();
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleProcessCancellation = async (appointmentId, approved) => {
    if (!confirm(`Are you sure you want to ${approved ? 'approve' : 'deny'} this cancellation request?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/admin/appointments/${appointmentId}/cancel-request`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ approved })
        }
      );

      if (response.ok) {
        alert(`Cancellation ${approved ? 'approved' : 'denied'} successfully!`);
        await fetchAppointments();
        await fetchStats();
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/admin/appointments/${appointmentId}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );

      if (response.ok) {
        alert('Appointment deleted successfully!');
        await fetchAppointments();
        await fetchStats();
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesStatus = filterStatus === '' || apt.status === filterStatus;
    const userName = apt.user?.name || apt.user?.username || '';
    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatLastUpdate = () => {
    return lastUpdate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Appointment Management</h1>
            <p className="text-gray-600">Manage appointments and assign case managers</p>
            <p className="text-sm text-gray-500 mt-2">
              📡 Real-time updates • Last refresh: {formatLastUpdate()}
            </p>
          </div>
          <button
            onClick={() => {
              fetchAppointments();
              fetchCaseManagers();
              fetchStats();
              setLastUpdate(new Date());
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-2xl font-bold text-gray-800">{stats.total || 0}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Pending</div>
              <div className="text-2xl font-bold text-gray-800">{stats.pending || 0}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Confirmed</div>
              <div className="text-2xl font-bold text-gray-800">{stats.confirmed || 0}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Assigned</div>
              <div className="text-2xl font-bold text-gray-800">{stats.withCaseManager || 0}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Unassigned</div>
              <div className="text-2xl font-bold text-gray-800">{stats.withoutCaseManager || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by user name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[150px]"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Appointments Found</h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus ? 'Try adjusting your filters' : 'No appointments yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredAppointments.map((apt) => (
              <div key={apt._id} className="p-5 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold text-gray-800">
                        {apt.user?.name || apt.user?.username || 'Unknown User'}
                      </h3>
                      
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        apt.status === 'confirmed' ? 'bg-green-600 text-white' :
                        apt.status === 'pending' ? 'bg-yellow-500 text-white' :
                        apt.status === 'completed' ? 'bg-blue-600 text-white' :
                        'bg-red-600 text-white'
                      }`}>
                        {apt.status.toUpperCase()}
                      </span>

                      {apt.cancelRequest?.requested && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-600 text-white">
                          CANCEL REQUESTED
                        </span>
                      )}
                    </div>

                    <div className="grid md:grid-cols-3 gap-3 text-sm mb-3">
                      <div>
                        <span className="text-gray-600 font-medium">Service:</span>
                        <p className="text-gray-800">{apt.service}</p>
                      </div>
                      
                      <div>
                        <span className="text-gray-600 font-medium">Date & Time:</span>
                        <p className="text-gray-800">
                          {new Date(apt.date).toLocaleDateString()} at {apt.time}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-600 font-medium">Booked:</span>
                        <p className="text-gray-800">
                          {new Date(apt.bookedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* ✅ Show psychosocial info if available */}
                    {apt.service === 'Psychosocial support and assistance' && apt.psychosocialInfo && (
                      <div className="bg-indigo-50 rounded-lg p-3 mb-3 border border-indigo-200">
                        <p className="text-xs font-semibold text-indigo-800 mb-2">Patient Information:</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Name:</span>
                            <p className="font-medium text-gray-800">{apt.psychosocialInfo.fullName}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Age:</span>
                            <p className="font-medium text-gray-800">{apt.psychosocialInfo.age}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Gender:</span>
                            <p className="font-medium text-gray-800">{apt.psychosocialInfo.gender}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Location:</span>
                            <p className="font-medium text-gray-800">{apt.psychosocialInfo.location}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Case Manager Assignment */}
                    {apt.assignedCaseManager ? (
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-purple-800 mb-1 flex items-center gap-1">
                              <UserCheck className="w-4 h-4" />
                              Case Manager Assigned
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {apt.assignedCaseManager.name || apt.assignedCaseManager.username}
                            </p>
                            {apt.assignedAt && (
                              <p className="text-xs text-gray-600 mt-1">
                                Assigned on {new Date(apt.assignedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleUnassignCaseManager(apt._id)}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition"
                          >
                            Unassign
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                        <p className="text-xs font-semibold text-orange-800 mb-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          No Case Manager Assigned
                        </p>
                        <button
                          onClick={() => {
                            setSelectedAppointment(apt);
                            setShowAssignModal(true);
                          }}
                          className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition font-semibold"
                        >
                          Assign Case Manager
                        </button>
                      </div>
                    )}

                    {apt.cancelRequest?.requested && (
                      <div className="mt-3 bg-orange-50 rounded-lg p-3 border border-orange-200">
                        <p className="text-xs font-semibold text-orange-800 mb-1">Cancellation Request:</p>
                        <p className="text-sm text-gray-700 mb-2">{apt.cancelRequest.reason}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleProcessCancellation(apt._id, true)}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleProcessCancellation(apt._id, false)}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                          >
                            Deny
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedAppointment(apt);
                        setShowDetailsModal(true);
                      }}
                      className="p-2 hover:bg-blue-100 rounded-lg transition"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5 text-blue-600" />
                    </button>

                    <button
                      onClick={() => handleDeleteAppointment(apt._id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ UPDATED: Assign Case Manager Modal with Workload Display */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Assign Case Manager</h3>
              <button 
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedCaseManager('');
                }} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                Appointment for: <span className="font-semibold">
                  {selectedAppointment?.user?.name || selectedAppointment?.user?.username}
                </span>
              </p>
              <p className="text-gray-600 mb-4">
                Service: <span className="font-semibold">{selectedAppointment?.service}</span>
              </p>

              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Case Manager <span className="text-red-500">*</span>
              </label>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {caseManagers.map((cm) => (
                  <div
                    key={cm._id}
                    onClick={() => cm.isAvailable && setSelectedCaseManager(cm._id)}
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${selectedCaseManager === cm._id 
                        ? 'border-purple-600 bg-purple-50' 
                        : cm.isAvailable 
                          ? 'border-gray-200 hover:border-purple-300 bg-white' 
                          : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 flex items-center gap-2">
                          <UserCheck className="w-4 h-4" />
                          {cm.name || cm.username}
                        </p>
                        <p className="text-xs text-gray-600">{cm.email}</p>
                      </div>
                      
                      <div className="text-right">
                        <div className={`
                          text-xs font-semibold px-3 py-1 rounded-full
                          ${cm.isAvailable 
                            ? cm.activeAppointments === 0 
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                            : 'bg-red-100 text-red-700'
                          }
                        `}>
                          {cm.activeAppointments}/5 Active
                        </div>
                        {cm.isAvailable && (
                          <p className="text-xs text-gray-500 mt-1">
                            {cm.remainingSlots} slot{cm.remainingSlots !== 1 ? 's' : ''} left
                          </p>
                        )}
                        {!cm.isAvailable && (
                          <p className="text-xs text-red-600 mt-1 font-medium">
                            At Capacity
                          </p>
                        )}
                      </div>
                    </div>

                    {selectedCaseManager === cm._id && (
                      <div className="mt-2 flex items-center gap-2 text-purple-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-semibold">Selected</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {caseManagers.filter(cm => cm.isAvailable).length === 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    All case managers are at maximum capacity (5/5 appointments)
                  </p>
                  <p className="text-red-600 text-xs mt-2">
                    Please wait for case managers to complete their current appointments or add more case managers.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedCaseManager('');
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignCaseManager}
                disabled={!selectedCaseManager || loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Appointment Details</h3>
              <button 
                onClick={() => setShowDetailsModal(false)} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            <div className="space-y-4">
              {/* User Info */}
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <h4 className="font-bold text-blue-800 mb-2 text-lg">User Information</h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <p className="font-medium text-gray-800">
                      {selectedAppointment.user?.name || selectedAppointment.user?.username}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium text-gray-800">{selectedAppointment.user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Psychosocial Info */}
              {selectedAppointment.service === 'Psychosocial support and assistance' && 
               selectedAppointment.psychosocialInfo && (
                <div className="bg-indigo-50 rounded-lg p-4 border-2 border-indigo-200">
                  <h4 className="font-bold text-indigo-800 mb-3 text-lg flex items-center gap-2">
                    <UserIcon className="w-5 h-5" />
                    Patient Information
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Full Name:</span>
                      <p className="font-medium text-gray-800">
                        {selectedAppointment.psychosocialInfo.fullName}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Age:</span>
                      <p className="font-medium text-gray-800">
                        {selectedAppointment.psychosocialInfo.age}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Gender:</span>
                      <p className="font-medium text-gray-800">
                        {selectedAppointment.psychosocialInfo.gender}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <p className="font-medium text-gray-800">
                        {selectedAppointment.psychosocialInfo.location}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Appointment Info */}
              <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                <h4 className="font-bold text-green-800 mb-2 text-lg">Appointment Details</h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Service:</span>
                    <p className="font-medium text-gray-800">{selectedAppointment.service}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <p className="font-medium text-gray-800">
                      {new Date(selectedAppointment.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Time:</span>
                    <p className="font-medium text-gray-800">{selectedAppointment.time}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedAppointment.status === 'confirmed' ? 'bg-green-600 text-white' :
                      selectedAppointment.status === 'pending' ? 'bg-yellow-500 text-white' :
                      selectedAppointment.status === 'completed' ? 'bg-blue-600 text-white' :
                      'bg-red-600 text-white'
                    }`}>
                      {selectedAppointment.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Case Manager */}
              {selectedAppointment.assignedCaseManager && (
                <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                  <h4 className="font-bold text-purple-800 mb-2 text-lg flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    Case Manager
                  </h4>
                  <p className="font-medium text-gray-800">
                    {selectedAppointment.assignedCaseManager.name || 
                     selectedAppointment.assignedCaseManager.username}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedAppointment.assignedCaseManager.email}
                  </p>
                </div>
              )}

              {/* Notes */}
              {selectedAppointment.note && (
                <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
                  <h4 className="font-bold text-yellow-800 mb-2 text-lg">Notes</h4>
                  <p className="text-gray-700">{selectedAppointment.note}</p>
                </div>
              )}

              {/* Session Notes */}
              {selectedAppointment.sessionTracking?.sessionNotes?.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                  <h4 className="font-bold text-gray-800 mb-3 text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Session Notes
                  </h4>
                  <div className="space-y-2">
                    {selectedAppointment.sessionTracking.sessionNotes.map((note, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">
                          Session #{note.sessionNumber} - {new Date(note.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-700">{note.notes || 'No notes'}</p>
                        {note.progress && (
                          <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${
                            note.progress === 'excellent' ? 'bg-green-100 text-green-700' :
                            note.progress === 'good' ? 'bg-blue-100 text-blue-700' :
                            note.progress === 'fair' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {note.progress}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowDetailsModal(false)}
              className="mt-6 w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;