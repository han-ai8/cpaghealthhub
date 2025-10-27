import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Filter, Search, X, TrendingUp, Activity, Users, Eye, FileText, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CaseManagerPlanner = () => {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({});
  const [sortBy, setSortBy] = useState('date');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  useEffect(() => {
    fetchPlanner();
  }, [sortBy, statusFilter]);

  // Real-time polling for appointments
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing case manager planner...');
      fetchPlanner();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [sortBy, statusFilter]);

  const fetchPlanner = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        sortBy,
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`${API_URL}/admin/planner?${query}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments);
        setStats(data.stats);
        setLastUpdate(new Date());
        console.log('✅ Planner data updated');
      }
    } catch (err) {
      console.error('Error fetching planner:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const userName = apt.user?.name || apt.user?.username || '';
    return userName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const openPatientModal = (appointment) => {
    setSelectedPatient(appointment);
    setShowPatientModal(true);
  };

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const changeMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + direction);
      return newMonth;
    });
  };

  const getAppointmentsForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return filteredAppointments.filter(apt => apt.date === dateStr);
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPastDate = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Case Manager Dashboard</h1>
            <p className="text-gray-600">Manage your assigned patients and appointments</p>
            <p className="text-sm text-gray-500 mt-2">
              📡 Real-time updates • Last refresh: {formatLastUpdate()}
            </p>
          </div>
          <button
            onClick={() => {
              fetchPlanner();
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Sessions</div>
              <div className="text-2xl font-bold text-gray-800">{stats.total || 0}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Ongoing</div>
              <div className="text-2xl font-bold text-gray-800">{stats.ongoing || 0}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Completed</div>
              <div className="text-2xl font-bold text-gray-800">{stats.completed || 0}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">This Week</div>
              <div className="text-2xl font-bold text-gray-800">{stats.upcomingThisWeek || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                viewMode === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Calendar View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              List View
            </button>
          </div>
          
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by patient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg p-3 pl-10 focus:outline-none focus:border-blue-500 transition"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' ? (
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => changeMonth(-1)}
              className="p-3 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h2 className="text-2xl font-bold text-gray-800">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button 
              onClick={() => changeMonth(1)}
              className="p-3 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="date">Sort by Date</option>
                <option value="time">Sort by Time</option>
                <option value="status">Sort by Status</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status Filter</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="">All Status</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
              </select>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
            <div className="grid grid-cols-7 gap-2 mb-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-bold text-sm text-gray-700 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth(currentMonth).map((date, index) => {
                const dayAppointments = getAppointmentsForDate(date);
                const hasOngoing = dayAppointments.some(apt => ['pending', 'confirmed'].includes(apt.status));
                const hasCompleted = dayAppointments.some(apt => apt.status === 'completed');
                
                return (
                  <div
                    key={index}
                    className={`
                      min-h-[120px] rounded-lg p-2 transition-all
                      ${!date ? 'invisible' : ''}
                      ${isToday(date) ? 'bg-blue-200 border-2 border-blue-600 shadow-lg' : 'bg-white'}
                      ${isPastDate(date) && !isToday(date) ? 'opacity-50' : ''}
                      ${dayAppointments.length > 0 ? 'cursor-pointer hover:shadow-xl hover:scale-105' : ''}
                    `}
                  >
                    {date && (
                      <>
                        <div className={`text-sm font-bold mb-2 ${
                          isToday(date) ? 'text-blue-900' : 'text-gray-700'
                        }`}>
                          {date.getDate()}
                        </div>
                        
                        <div className="space-y-1">
                          {dayAppointments.slice(0, 3).map((apt, idx) => (
                            <div
                              key={apt._id}
                              onClick={() => openPatientModal(apt)}
                              className={`text-xs p-1.5 rounded cursor-pointer hover:scale-105 transition ${
                                apt.status === 'confirmed' ? 'bg-green-100 text-green-800 border border-green-300' :
                                apt.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                                apt.status === 'completed' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                                'bg-gray-100 text-gray-800 border border-gray-300'
                              }`}
                            >
                              <div className="font-semibold truncate flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {apt.time}
                              </div>
                              <div className="truncate text-xs">
                                {apt.user?.name || apt.user?.username || 'Unknown'}
                              </div>
                            </div>
                          ))}
                          
                          {dayAppointments.length > 3 && (
                            <div className="text-xs text-gray-600 font-semibold text-center bg-gray-100 rounded p-1">
                              +{dayAppointments.length - 3} more
                            </div>
                          )}
                        </div>

                        {/* Status indicators */}
                        {dayAppointments.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {hasOngoing && (
                              <div className="w-2 h-2 rounded-full bg-green-500" title="Has ongoing appointments" />
                            )}
                            {hasCompleted && (
                              <div className="w-2 h-2 rounded-full bg-blue-500" title="Has completed appointments" />
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
              <span className="text-sm text-gray-700">Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300"></div>
              <span className="text-sm text-gray-700">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
              <span className="text-sm text-gray-700">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-200 border-2 border-blue-600"></div>
              <span className="text-sm text-gray-700">Today</span>
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Assigned Sessions</h2>
            </div>

            {/* Filters for List View */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition"
                >
                  <option value="date">Sort by Date</option>
                  <option value="time">Sort by Time</option>
                  <option value="status">Sort by Status</option>
                  <option value="name">Sort by Name</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status Filter</label>
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition"
                >
                  <option value="">All Status</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading appointments...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No appointments assigned yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-100 to-indigo-100">
                  <tr>
                    <th className="p-4 text-left text-sm font-bold text-gray-800">Patient</th>
                    <th className="p-4 text-left text-sm font-bold text-gray-800">Date</th>
                    <th className="p-4 text-left text-sm font-bold text-gray-800">Time</th>
                    <th className="p-4 text-left text-sm font-bold text-gray-800">Session</th>
                    <th className="p-4 text-left text-sm font-bold text-gray-800">Status</th>
                    <th className="p-4 text-center text-sm font-bold text-gray-800">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAppointments.map((appointment) => (
                    <tr 
                      key={appointment._id} 
                      className="hover:bg-blue-50 transition-colors cursor-pointer"
                      onClick={() => openPatientModal(appointment)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold">
                            {(appointment.user?.name || appointment.user?.username || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">
                              {appointment.user?.name || appointment.user?.username || 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-600">{appointment.user?.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          {new Date(appointment.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock className="w-4 h-4 text-green-600" />
                          {appointment.time}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                          #{appointment.sessionTracking?.sessionNumber || 1}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          appointment.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {appointment.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openPatientModal(appointment);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Patient Details Modal */}
      {showPatientModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Patient Details</h3>
              <button 
                onClick={() => setShowPatientModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
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
                      {selectedPatient.user?.name || selectedPatient.user?.username || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Age:</span>
                    <span className="text-gray-800 font-semibold">
                      {selectedPatient.user?.profile?.age || selectedPatient.user?.age || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Gender:</span>
                    <span className="text-gray-800 font-semibold">
                      {selectedPatient.user?.profile?.gender || selectedPatient.user?.gender || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Location:</span>
                    <span className="text-gray-800 font-semibold">
                      {selectedPatient.user?.profile?.location || selectedPatient.user?.location || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Email:</span>
                    <span className="text-gray-800 font-semibold text-xs">
                      {selectedPatient.user?.email || 'N/A'}
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
                      {new Date(selectedPatient.date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Time:</span>
                    <span className="text-gray-800 font-semibold">{selectedPatient.time}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedPatient.status === 'confirmed' ? 'bg-green-600 text-white' :
                      selectedPatient.status === 'pending' ? 'bg-yellow-500 text-white' :
                      selectedPatient.status === 'completed' ? 'bg-blue-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {selectedPatient.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Session:</span>
                    <span className="text-gray-800 font-semibold">
                      #{selectedPatient.sessionTracking?.sessionNumber || 1}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Service:</span>
                    <span className="text-gray-800 font-semibold text-xs">
                      {selectedPatient.service}
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
              
              {selectedPatient.sessionTracking?.sessionNotes?.length > 0 ? (
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
                      {selectedPatient.sessionTracking.sessionNotes.map((note, idx) => (
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
                  alert('Set new appointment feature - Navigate to admin appointments page');
                  setShowPatientModal(false);
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg shadow-md transition-all"
              >
                Set new appointment
              </button>
              
              <button 
                onClick={() => {
                  alert('Complete program feature - Mark this patient program as complete');
                }}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 rounded-lg shadow-md transition-all"
              >
                Complete Program
              </button>
            </div>

            <button
              onClick={() => setShowPatientModal(false)}
              className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseManagerPlanner;