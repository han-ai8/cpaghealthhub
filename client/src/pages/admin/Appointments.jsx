import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Trash2, Eye, X, Plus, FileText, TrendingUp, UserCheck, UserX, Shield, Users, Search, Filter } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Appointments = () => {
  const [appointments, setAppointments] = useState({
    all: [],
    pending: [],
    confirmed: [],
    cancelRequests: [],
    completed: [],
    cancelled: []
  });
  const [activeTab, setActiveTab] = useState('confirmed');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showCancelRequestModal, setShowCancelRequestModal] = useState(false);
  const [showAssignCaseManagerModal, setShowAssignCaseManagerModal] = useState(false);
  const [showPatientProfileModal, setShowPatientProfileModal] = useState(false);
  
  const [caseManagers, setCaseManagers] = useState([]);
  const [selectedCaseManager, setSelectedCaseManager] = useState('');
  const [userRole, setUserRole] = useState('');
  
  const [sessionSummary, setSessionSummary] = useState('');
  const [sessionProgress, setSessionProgress] = useState('good');
  const [nextSteps, setNextSteps] = useState('');
  const [overallProgress, setOverallProgress] = useState('improving');
  
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  
  const [cancelResponse, setCancelResponse] = useState('');
  const [relatedAppointments, setRelatedAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sorting and filtering states
  const [sortBy, setSortBy] = useState('date');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const timeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
    '5:00 PM', '5:30 PM'
  ];

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  const isAdmin = () => userRole === 'admin';
  const isCaseManager = () => userRole === 'case_manager';

  const canAssignCaseManager = (appointment) => {
    return appointment.service === 'Psychosocial support and assistance';
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role || '');
        console.log('User role:', payload.role);
      } catch (e) {
        console.error('Error parsing token:', e);
      }
    }

    fetchAppointments();
    
    const role = userRole || (token ? JSON.parse(atob(token.split('.')[1])).role : '');
    if (role === 'admin') {
      fetchCaseManagers();
    }
  }, []);

  const fetchCaseManagers = async () => {
    try {
      console.log('Fetching case managers with workload...');
      const response = await fetch(`${API_URL}/admin/case-managers`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Case managers fetched:', data);
        setCaseManagers(data);
      } else {
        console.error('Failed to fetch case managers:', response.status);
      }
    } catch (err) {
      console.error('Error fetching case managers:', err);
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please login to access this page');
        return;
      }

      console.log('Fetching appointments...');
      const response = await fetch(`${API_URL}/admin/appointments`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 403) {
          setError('Access denied. You need admin or case manager privileges.');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Appointments fetched:', data);
      setAppointments(data);
      setError('');
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to fetch appointments: ' + err.message);
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    if (!window.confirm(`Confirm ${status} this appointment?`)) return;

    setLoading(true);
    try {
      console.log(`Updating appointment ${appointmentId} to ${status}`);
      
      const response = await fetch(`${API_URL}/admin/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update');
      }
      
      const updatedAppointment = await response.json();
      console.log('Status updated successfully:', updatedAppointment);
      
      alert(`Appointment ${status} successfully`);
      await fetchAppointments();
      
      if (selectedAppointment && selectedAppointment._id === appointmentId) {
        setSelectedAppointment(updatedAppointment);
      }
      
      setShowDetailsModal(false);
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCaseManager = async () => {
    if (!selectedCaseManager) {
      alert('Please select a case manager');
      return;
    }

    if (!canAssignCaseManager(selectedAppointment)) {
      alert('Case managers can only be assigned to Psychosocial support and assistance appointments');
      return;
    }

    setLoading(true);
    try {
      console.log(`Assigning case manager ${selectedCaseManager} to appointment ${selectedAppointment._id}`);
      
      const response = await fetch(`${API_URL}/admin/appointments/${selectedAppointment._id}/assign-case-manager`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ caseManagerId: selectedCaseManager })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign case manager');
      }
      
      const updatedAppointment = await response.json();
      console.log('Case manager assigned successfully:', updatedAppointment);
      
      alert('Case manager assigned successfully');
      setShowAssignCaseManagerModal(false);
      await fetchAppointments();
      await fetchCaseManagers();
      
      setSelectedAppointment(updatedAppointment);
    } catch (err) {
      console.error('Error assigning case manager:', err);
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignCaseManager = async () => {
    if (!window.confirm('Are you sure you want to unassign this case manager?')) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/appointments/${selectedAppointment._id}/unassign-case-manager`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unassign');
      }

      const updatedAppointment = await response.json();
      alert('Case manager unassigned successfully');
      await fetchAppointments();
      await fetchCaseManagers();
      setSelectedAppointment(updatedAppointment);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteWithNotes = async () => {
    if (!sessionSummary.trim()) {
      alert('Please provide a session summary');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/appointments/${selectedAppointment._id}/complete`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          summary: sessionSummary,
          progress: sessionProgress,
          nextSteps: nextSteps,
          overallProgress: overallProgress
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete');
      }

      const updatedAppointment = await response.json();
      alert('Appointment completed successfully');
      setShowCompleteModal(false);
      await fetchAppointments();
      
      setSessionSummary('');
      setNextSteps('');
      setSelectedAppointment(updatedAppointment);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleFollowUp = async () => {
    if (!followUpDate || !followUpTime) {
      alert('Please select date and time');
      return;
    }

    alert('Follow-up scheduling feature - to be implemented');
    setShowFollowUpModal(false);
  };

  const handleCancelRequest = async (approve) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/appointments/${selectedAppointment._id}/cancel-request`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          approve,
          response: cancelResponse
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process request');
      }

      const updatedAppointment = await response.json();
      alert(`Cancellation request ${approve ? 'approved' : 'denied'}`);
      setShowCancelRequestModal(false);
      setShowDetailsModal(false);
      await fetchAppointments();
      setCancelResponse('');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to delete this appointment? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete');
      }

      alert('Appointment deleted successfully');
      await fetchAppointments();
      setShowDetailsModal(false);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openDetailsModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const openPatientProfileModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowPatientProfileModal(true);
  };

  // Sorting and filtering logic
  const getFilteredAndSortedAppointments = (appointmentsList) => {
    let filtered = [...appointmentsList];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(apt => {
        const userName = apt.user?.name || apt.user?.username || '';
        return userName.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          const nameA = a.user?.name || a.user?.username || '';
          const nameB = b.user?.name || b.user?.username || '';
          return nameA.localeCompare(nameB);
        case 'time':
          if (a.date === b.date) {
            return a.time.localeCompare(b.time);
          }
          return new Date(a.date) - new Date(b.date);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'date':
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });

    return filtered;
  };

  const renderAppointmentsList = (appointmentsList, title) => {
    const filteredSorted = getFilteredAndSortedAppointments(appointmentsList);

    return (
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        </div>

        {/* Sorting and Search Controls */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg p-2 focus:outline-none focus:border-blue-500"
              >
                <option value="date">Date</option>
                <option value="time">Time</option>
                <option value="status">Status</option>
                <option value="name">Name</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Filter Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg p-2 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg p-2 pl-10 focus:outline-none focus:border-blue-500"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>
        </div>

        {filteredSorted.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No appointments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Patient</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Service</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Date & Time</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  {isAdmin() && <th className="p-4 text-left text-sm font-semibold text-gray-700">Case Manager</th>}
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSorted.map((appointment) => (
                  <tr key={appointment._id} className="border-t border-gray-200 hover:bg-blue-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">
                            {appointment.user?.name || appointment.user?.username}
                          </div>
                          <div className="text-sm text-gray-500">{appointment.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      {appointment.service}
                      {appointment.sessionTracking?.sessionNumber > 1 && (
                        <div className="text-xs text-blue-600">
                          Session {appointment.sessionTracking.sessionNumber}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="font-medium">
                            {new Date(appointment.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {appointment.time}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        appointment.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {appointment.status.toUpperCase()}
                      </span>
                      {appointment.cancelRequest?.requested && !appointment.cancelRequest?.respondedAt && (
                        <div className="text-xs text-orange-600 mt-1">Cancel Requested</div>
                      )}
                    </td>
                    {isAdmin() && (
                      <td className="p-4 text-sm">
                        {appointment.assignedCaseManager ? (
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-green-600" />
                            <span className="text-gray-700">{appointment.assignedCaseManager.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Not assigned</span>
                        )}
                      </td>
                    )}
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openPatientProfileModal(appointment)}
                          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
                          title="View Patient Profile"
                        >
                          <Eye className="w-4 h-4" />
                          Profile
                        </button>
                        <button
                          onClick={() => openDetailsModal(appointment)}
                          className="flex items-center gap-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
                          title="Manage Appointment"
                        >
                          <FileText className="w-4 h-4" />
                          Manage
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Access Error</h2>
          <p className="text-gray-600 text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {isAdmin() ? 'Admin Dashboard' : 'Case Manager Dashboard'}
            </h1>
            <p className="text-gray-600">Manage appointments and patient information</p>
          </div>
          <Shield className="w-12 h-12 text-blue-600" />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
        <div className="flex overflow-x-auto">
          {[
            { key: 'confirmed', label: 'Confirmed', count: appointments.confirmed.length },
            { key: 'pending', label: 'Pending', count: appointments.pending.length },
            { key: 'cancelRequests', label: 'Cancel Requests', count: appointments.cancelRequests.length },
            { key: 'completed', label: 'Completed', count: appointments.completed.length },
            { key: 'cancelled', label: 'Cancelled', count: appointments.cancelled.length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                activeTab === tab.key ? 'bg-white text-blue-600' : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <div className="mb-6">
        {activeTab === 'confirmed' && renderAppointmentsList(appointments.confirmed, 'Confirmed Appointments')}
        {activeTab === 'pending' && renderAppointmentsList(appointments.pending, 'Pending Appointments')}
        {activeTab === 'cancelRequests' && renderAppointmentsList(appointments.cancelRequests, 'Cancellation Requests')}
        {activeTab === 'completed' && renderAppointmentsList(appointments.completed, 'Completed Appointments')}
        {activeTab === 'cancelled' && renderAppointmentsList(appointments.cancelled, 'Cancelled Appointments')}
      </div>

      {/* Patient Profile Modal */}
      {showPatientProfileModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Patient's Profile</h2>
                <p className="text-sm text-gray-600 mt-1">Complete patient and appointment information</p>
              </div>
              <button 
                onClick={() => setShowPatientProfileModal(false)}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Basic Information */}
              <div className="bg-blue-50 rounded-lg p-5 border-2 border-blue-200">
                <h3 className="font-bold text-blue-800 mb-4 text-lg">Basic Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Name:</span>
                    <span className="text-gray-800 font-semibold">
                      {selectedAppointment.user?.name || selectedAppointment.user?.username || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Age:</span>
                    <span className="text-gray-800 font-semibold">
                      {selectedAppointment.user?.profile?.age || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Gender:</span>
                    <span className="text-gray-800 font-semibold">
                      {selectedAppointment.user?.profile?.gender || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Location:</span>
                    <span className="text-gray-800 font-semibold">
                      {selectedAppointment.user?.profile?.location || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Email:</span>
                    <span className="text-gray-800 font-semibold text-xs">
                      {selectedAppointment.user?.email || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="bg-green-50 rounded-lg p-5 border-2 border-green-200">
                <h3 className="font-bold text-green-800 mb-4 text-lg">Appointment Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Date:</span>
                    <span className="text-gray-800 font-semibold">
                      {new Date(selectedAppointment.date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Time:</span>
                    <span className="text-gray-800 font-semibold">{selectedAppointment.time}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedAppointment.status === 'confirmed' ? 'bg-green-600 text-white' :
                      selectedAppointment.status === 'pending' ? 'bg-yellow-500 text-white' :
                      selectedAppointment.status === 'completed' ? 'bg-blue-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {selectedAppointment.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Session:</span>
                    <span className="text-gray-800 font-semibold">
                      #{selectedAppointment.sessionTracking?.sessionNumber || 1}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Service:</span>
                    <span className="text-gray-800 font-semibold text-xs">
                      {selectedAppointment.service}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* History Check-Up */}
            <div className="bg-purple-50 rounded-lg p-5 border-2 border-purple-200 mb-6">
              <h3 className="font-bold text-purple-800 mb-4 text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                History Check-Up
              </h3>
              
              {selectedAppointment.sessionTracking?.sessionNotes?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-purple-100">
                      <tr>
                        <th className="p-3 text-left font-semibold text-purple-900">Session #</th>
                        <th className="p-3 text-left font-semibold text-purple-900">Date</th>
                        <th className="p-3 text-left font-semibold text-purple-900">Time</th>
                        <th className="p-3 text-left font-semibold text-purple-900">Type</th>
                        <th className="p-3 text-left font-semibold text-purple-900">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAppointment.sessionTracking.sessionNotes.map((note, idx) => (
                        <tr key={idx} className="border-t border-purple-200">
                          <td className="p-3 font-medium">{note.sessionNumber}</td>
                          <td className="p-3">{new Date(note.date).toLocaleDateString()}</td>
                          <td className="p-3">{note.time}</td>
                          <td className="p-3">Counseling</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              note.progress === 'excellent' ? 'bg-green-100 text-green-700' :
                              note.progress === 'good' ? 'bg-blue-100 text-blue-700' :
                              note.progress === 'fair' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {note.progress}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-purple-300 mx-auto mb-2" />
                  <p className="text-purple-600 font-medium">No History</p>
                  <p className="text-purple-500 text-sm">This is the patient's first session</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowPatientProfileModal(false);
                  setShowFollowUpModal(true);
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg shadow-md transition-all"
              >
                Set new appointment?
              </button>
              <button 
                onClick={() => {
                  if (window.confirm('Mark this program as complete?')) {
                    alert('Complete program feature - to be implemented');
                  }
                }}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 rounded-lg shadow-md transition-all"
              >
                Complete Program
              </button>
            </div>

            <button
              onClick={() => setShowPatientProfileModal(false)}
              className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Appointment Details Modal - Existing code */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Appointment Management</h3>
              <button onClick={() => setShowDetailsModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Patient Info */}
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <div className="font-semibold text-lg">{selectedAppointment.user?.name || selectedAppointment.user?.username}</div>
              <div className="text-sm text-gray-600">{selectedAppointment.user?.email}</div>
            </div>

            {/* Appointment Details */}
            <div className="mb-4 space-y-2">
              <div><strong>Service:</strong> {selectedAppointment.service}</div>
              <div><strong>Date:</strong> {new Date(selectedAppointment.date).toLocaleDateString()}</div>
              <div><strong>Time:</strong> {selectedAppointment.time}</div>
              <div>
                <strong>Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  selectedAppointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  selectedAppointment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  selectedAppointment.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {selectedAppointment.status.toUpperCase()}
                </span>
              </div>
              {selectedAppointment.note && (
                <div><strong>Note:</strong> {selectedAppointment.note}</div>
              )}
            </div>

            {/* Case Manager Section */}
            {isAdmin() && canAssignCaseManager(selectedAppointment) && (
              <div className="mb-4 p-4 bg-blue-50 rounded">
                <h4 className="font-semibold mb-2">Case Manager</h4>
                {selectedAppointment.assignedCaseManager ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{selectedAppointment.assignedCaseManager.name}</div>
                      <div className="text-sm text-gray-600">{selectedAppointment.assignedCaseManager.email}</div>
                    </div>
                    <button
                      onClick={handleUnassignCaseManager}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Unassign
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowAssignCaseManagerModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    + Assign Case Manager
                  </button>
                )}
              </div>
            )}

            {/* Cancel Request */}
            {selectedAppointment.cancelRequest?.requested && !selectedAppointment.cancelRequest?.respondedAt && (
              <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold text-orange-800">Cancellation Requested</span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{selectedAppointment.cancelRequest.reason}</p>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setShowCancelRequestModal(true);
                  }}
                  className="text-sm text-orange-600 hover:text-orange-700"
                >
                  Review Request →
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              {selectedAppointment.status === 'pending' && (
                <button
                  onClick={() => updateAppointmentStatus(selectedAppointment._id, 'confirmed')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirm Appointment
                </button>
              )}

              {['pending', 'confirmed'].includes(selectedAppointment.status) && (
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setShowCompleteModal(true);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded"
                >
                  Complete with Notes
                </button>
              )}

              {['pending', 'confirmed'].includes(selectedAppointment.status) && (
                <button
                  onClick={() => updateAppointmentStatus(selectedAppointment._id, 'cancelled')}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel Appointment
                </button>
              )}

              {isAdmin() && (
                <button
                  onClick={() => handleDeleteAppointment(selectedAppointment._id)}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Appointment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Case Manager Modal */}
      {showAssignCaseManagerModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Assign Case Manager</h3>
              <button onClick={() => setShowAssignCaseManagerModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block font-semibold mb-2">Select Case Manager</label>
              <select
                value={selectedCaseManager}
                onChange={(e) => setSelectedCaseManager(e.target.value)}
                className="w-full border rounded p-2"
              >
                <option value="">Select a case manager...</option>
                {caseManagers.map((cm) => (
                  <option key={cm._id} value={cm._id} disabled={!cm.isAvailable}>
                    {cm.name} - {cm.currentWorkload}/{cm.maxCapacity} active
                    {!cm.isAvailable && ' (Full)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAssignCaseManagerModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignCaseManager}
                disabled={!selectedCaseManager || loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded disabled:bg-gray-300"
              >
                {loading ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Complete Appointment</h3>
              <button onClick={() => setShowCompleteModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <div className="font-semibold">{selectedAppointment.user?.name}</div>
              <div className="text-sm text-gray-600">
                {selectedAppointment.service} - Session {selectedAppointment.sessionTracking?.sessionNumber || 1}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-2">Session Summary *</label>
                <textarea
                  value={sessionSummary}
                  onChange={(e) => setSessionSummary(e.target.value)}
                  placeholder="Describe what was discussed..."
                  className="w-full border rounded p-3 h-32 resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Session Progress *</label>
                <select
                  value={sessionProgress}
                  onChange={(e) => setSessionProgress(e.target.value)}
                  className="w-full border rounded p-2"
                >
                  <option value="poor">Poor</option>
                  <option value="fair">Fair</option>
                  <option value="good">Good</option>
                  <option value="excellent">Excellent</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-2">Next Steps</label>
                <textarea
                  value={nextSteps}
                  onChange={(e) => setNextSteps(e.target.value)}
                  placeholder="Goals for next session..."
                  className="w-full border rounded p-3 h-20 resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Overall Progress</label>
                <select
                  value={overallProgress}
                  onChange={(e) => setOverallProgress(e.target.value)}
                  className="w-full border rounded p-2"
                >
                  <option value="initial">Initial</option>
                  <option value="improving">Improving</option>
                  <option value="stable">Stable</option>
                  <option value="needs_attention">Needs Attention</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCompleteModal(false)}
                  disabled={loading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteWithNotes}
                  disabled={loading || !sessionSummary.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded disabled:bg-gray-300"
                >
                  {loading ? 'Processing...' : 'Complete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Modal */}
      {showFollowUpModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Schedule Follow-up</h3>
              <button onClick={() => setShowFollowUpModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-2">Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Time</label>
                <select
                  value={followUpTime}
                  onChange={(e) => setFollowUpTime(e.target.value)}
                  className="w-full border rounded p-2"
                >
                  <option value="">Select time</option>
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-2">Note</label>
                <textarea
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="Additional notes..."
                  className="w-full border rounded p-3 h-20 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowFollowUpModal(false)}
                  disabled={loading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleFollowUp}
                  disabled={loading || !followUpDate || !followUpTime}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded disabled:bg-gray-300"
                >
                  {loading ? 'Scheduling...' : 'Schedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Request Modal */}
      {showCancelRequestModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Cancellation Request</h3>
              <button onClick={() => {
                setShowCancelRequestModal(false);
                setShowDetailsModal(true);
              }}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-orange-50 border border-orange-200 p-4 rounded mb-4">
              <div className="font-semibold text-orange-800 mb-2">Reason:</div>
              <div className="text-sm text-orange-700">{selectedAppointment.cancelRequest?.reason}</div>
            </div>

            <div className="mb-4">
              <label className="block font-semibold mb-2">Response (optional)</label>
              <textarea
                value={cancelResponse}
                onChange={(e) => setCancelResponse(e.target.value)}
                placeholder="Message to user..."
                className="w-full border rounded p-3 h-20 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleCancelRequest(false)}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded disabled:bg-gray-300"
              >
                {loading ? 'Processing...' : 'Deny'}
              </button>
              <button
                onClick={() => handleCancelRequest(true)}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded disabled:bg-gray-300"
              >
                {loading ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;