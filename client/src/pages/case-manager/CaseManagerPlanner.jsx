// CaseManagerPlanner.jsx - COMPLETE VERSION with Clinic Schedule Integration
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Filter, Search, X, TrendingUp, Activity, Users, Eye, FileText, ChevronLeft, ChevronRight, RefreshCw, Plus, CheckCircle, AlertCircle, Edit, Printer, Save, Ban } from 'lucide-react';
import SessionTimelineModal from '../../components/SessionTimelineModal';
import UnifiedSessionHistoryModal from '../../components/UnifiedSessionHistoryModal';
import { useAuth } from '../../context/AuthContext';
import PrintableCompletionReport from '../../components/PrintableCompletionReport';
import api from '../../utils/api';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const parseDate = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDateString = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CaseManagerPlanner = () => {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({});
  const [sortBy, setSortBy] = useState('date');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showNextSessionModal, setShowNextSessionModal] = useState(false);
  const [showSessionSummaryModal, setShowSessionSummaryModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showViewSessionModal, setShowViewSessionModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAllPatientsReportModal, setShowAllPatientsReportModal] = useState(false);
  const [selectedSessionNote, setSelectedSessionNote] = useState(null);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState('calendar');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [clinicSchedule, setClinicSchedule] = useState([]); // ✅ NEW: Clinic schedule state
  const [programReport, setProgramReport] = useState(null);
  const [allPatientsReport, setAllPatientsReport] = useState(null);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showUnifiedHistoryModal, setShowUnifiedHistoryModal] = useState(false);
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState(null);
  
  const [nextSessionForm, setNextSessionForm] = useState({
    date: '',
    time: '',
    note: ''
  });

  const [editAppointmentForm, setEditAppointmentForm] = useState({
    date: '',
    time: '',
    note: ''
  });

  const [sessionSummaryForm, setSessionSummaryForm] = useState({
    notes: '',
    sessionSummary: '',
    progress: 'good'
  });

  const [completionNotes, setCompletionNotes] = useState('');

  const timeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
    '5:00 PM', '5:30 PM'
  ];

  const { user } = useAuth();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  useEffect(() => {
    fetchPlanner();
    fetchClinicSchedule(); // ✅ NEW: Fetch clinic schedule on mount
  }, [sortBy, statusFilter]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchPlanner();
      fetchClinicSchedule(); // ✅ NEW: Include in auto-refresh
    }, 30000);
    return () => clearInterval(interval);
  }, [sortBy, statusFilter]);

  const fetchPlanner = async () => {
  setLoading(true);
  try {
    const query = new URLSearchParams({
      sortBy,
      ...(statusFilter && { status: statusFilter })
    });

    const data = await api.get(`/admin/planner?${query}`);
    setAppointments(data.appointments);
    setStats(data.stats);
    setLastUpdate(new Date());
  } catch (err) {
    console.error('Error fetching planner:', err);
  } finally {
    setLoading(false);
  }
};

  const fetchBookedSlots = async () => {
  try {
    const data = await api.get('/appointments/booked-slots');
    setBookedSlots(data);
  } catch (err) {
    console.error('Error fetching booked slots:', err);
  }
};

  // ✅ NEW: Fetch clinic schedule
  const fetchClinicSchedule = async () => {
  try {
    const data = await api.get('/clinic-schedule/active');
    setClinicSchedule(data);
  } catch (err) {
    console.error('❌ Error fetching clinic schedule:', err);
  }
};

  // ✅ NEW: Check if date is available based on clinic schedule
  const isDateAvailable = (date) => {
    if (!date) return true;
    const dateStr = formatDateString(date);
    const dayOfWeek = date.getDay();
    
    // Check for clinic closures/holidays
    const closure = clinicSchedule.find(schedule => {
      const start = new Date(schedule.startDate);
      const end = new Date(schedule.endDate);
      const checkDate = new Date(dateStr);
      
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      checkDate.setHours(0, 0, 0, 0);
      
      return (schedule.type === 'closure' || schedule.type === 'holiday') && 
             schedule.isActive &&
             checkDate >= start && 
             checkDate <= end;
    });
    
    if (closure) {
      return false;
    }
    
    // Check for special opening (overrides Sunday closure)
    const specialOpening = clinicSchedule.find(schedule => {
      const scheduleDate = formatDateString(new Date(schedule.date || schedule.startDate));
      return schedule.type === 'special_opening' && 
             schedule.isActive &&
             scheduleDate === dateStr;
    });
    
    if (specialOpening) {
      return true;
    }
    
    // Sunday is closed by default
    if (dayOfWeek === 0) {
      return false;
    }
    
    return true;
  };

  // Check if slot is available (excluding current appointment when editing)
  const isSlotAvailable = (date, time, excludeAppointmentId = null) => {
    return !bookedSlots.some(slot => 
      slot.date === date && 
      slot.time === time && 
      slot.appointmentId !== excludeAppointmentId
    );
  };

  // Get conflicting appointments for a time slot
  const getConflictingAppointments = (date, time, excludeAppointmentId = null) => {
    return bookedSlots.filter(slot => 
      slot.date === date && 
      slot.time === time && 
      slot.appointmentId !== excludeAppointmentId
    );
  };

  const hasLastSessionSummary = (appointment) => {
    if (!appointment.sessionTracking?.sessionNotes?.length) {
      return false;
    }
    const lastNote = appointment.sessionTracking.sessionNotes[appointment.sessionTracking.sessionNotes.length - 1];
    return lastNote && lastNote.notes && lastNote.notes.trim() !== '';
  };

  const canSetNewSession = (appointment) => {
    if (appointment.programCompleted) return false;
    if (appointment.status === 'completed') {
      return hasLastSessionSummary(appointment);
    }
    return false;
  };

  const filteredAppointments = appointments.filter(apt => {
    const userName = apt.user?.name || apt.user?.username || '';
    return userName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const openPatientModal = (appointment) => {
    setSelectedPatient(appointment);
    setShowPatientModal(true);
  };

  const openEditModal = () => {
    setEditAppointmentForm({
      date: selectedPatient.date,
      time: selectedPatient.time,
      note: selectedPatient.note || ''
    });
    setShowEditModal(true);
    setShowPatientModal(false);
    fetchBookedSlots();
  };

  const handleEditAppointment = async () => {
  if (!editAppointmentForm.date || !editAppointmentForm.time) {
    alert('Please select both date and time');
    return;
  }

  const formattedDate = formatDateString(new Date(editAppointmentForm.date));

  if (!isDateAvailable(new Date(editAppointmentForm.date))) {
    alert('❌ The selected date is not available (holiday/closure). Please select another date.');
    return;
  }

  const conflicts = getConflictingAppointments(
    formattedDate, 
    editAppointmentForm.time,
    selectedPatient._id
  );

  if (conflicts.length > 0) {
    const conflictNames = conflicts.map(c => c.userName).join(', ');
    if (!confirm(`⚠️ This time slot is already booked by: ${conflictNames}\n\nDo you want to continue anyway?`)) {
      return;
    }
  }

  try {
    setLoading(true);
    const data = await api.put(
      `/admin/appointments/${selectedPatient._id}/reschedule`,
      {
        date: formattedDate,
        time: editAppointmentForm.time,
        note: editAppointmentForm.note
      }
    );

    if (data.success) {
      alert('✅ Appointment updated successfully!');
      setShowEditModal(false);
      setEditAppointmentForm({ date: '', time: '', note: '' });
      await fetchPlanner();
      await fetchBookedSlots();
    } else {
      alert(`❌ Error: ${data.error || 'Failed to update appointment'}`);
    }
  } catch (error) {
    console.error('Error updating appointment:', error);
    alert(`Failed to update appointment: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  const openNextSessionModal = () => {
    if (!canSetNewSession(selectedPatient)) {
      alert('⚠️ Please add a session summary for the current session before creating the next one.');
      return;
    }
    
    setShowNextSessionModal(true);
    setShowPatientModal(false);
    fetchBookedSlots();
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setNextSessionForm({
      ...nextSessionForm,
      date: formatDateString(tomorrow)
    });
  };

  const openSessionSummaryModal = () => {
    setShowSessionSummaryModal(true);
    setShowPatientModal(false);
  };

  const openViewSessionModal = (note, index) => {
    setSelectedSessionNote(note);
    setSelectedNoteIndex(index);
    setSessionSummaryForm({
      notes: note.notes || '',
      sessionSummary: note.sessionSummary || '',
      progress: note.progress || 'good'
    });
    setShowViewSessionModal(true);
    setShowPatientModal(false);
  };

  const handleUpdateSessionSummary = async () => {
  if (!sessionSummaryForm.notes) {
    alert('Please enter session notes');
    return;
  }

  try {
    setLoading(true);
    const data = await api.put(
      `/sessions/appointments/${selectedPatient._id}/session-notes/${selectedNoteIndex}`,
      sessionSummaryForm
    );

    if (data.success) {
      alert('✅ Session summary updated successfully');
      setShowViewSessionModal(false);
      setSessionSummaryForm({ notes: '', sessionSummary: '', progress: 'good' });
      await fetchPlanner();
    } else {
      alert(`❌ Error: ${data.error || 'Failed to update summary'}`);
    }
  } catch (error) {
    console.error('Error updating session summary:', error);
    alert(`Failed to update session summary: ${error.message}`);
  } finally {
    setLoading(false);
  }
};
 const openCompleteModal = async () => {
  try {
    setLoading(true);
    const data = await api.get(
      `/sessions/patients/${selectedPatient.user._id}/program-report`
    );

    if (data.success) {
      setProgramReport(data.report);
      setShowCompleteModal(true);
      setShowPatientModal(false);
    }
  } catch (error) {
    console.error('Error generating report:', error);
    alert('Failed to generate program report');
  } finally {
    setLoading(false);
  }
};


  const handleSetNextSession = async () => {
  if (!nextSessionForm.date || !nextSessionForm.time) {
    alert('Please select both date and time');
    return;
  }

  const formattedDate = formatDateString(new Date(nextSessionForm.date));

  // ✅ Check if date is available (not a holiday/closure)
  if (!isDateAvailable(new Date(nextSessionForm.date))) {
    alert('❌ The selected date is not available (holiday/closure). Please select another date.');
    return;
  }

  // Check for conflicts using the formatted date
  const conflicts = getConflictingAppointments(formattedDate, nextSessionForm.time);
  if (conflicts.length > 0) {
    const conflictNames = conflicts.map(c => c.userName).join(', ');
    alert(`⚠️ This time slot is already booked by: ${conflictNames}\n\nPlease select another time.`);
    return;
  }

  try {
    setLoading(true);
    
    // ✅ Use api.js instead of raw fetch
    const data = await api.post(
      `/sessions/appointments/${selectedPatient._id}/next-session`,
      {
        date: formattedDate,
        time: nextSessionForm.time,
        note: nextSessionForm.note
      }
    );

    if (data.success) {
      alert(`✅ ${data.message}`);
      setShowNextSessionModal(false);
      setNextSessionForm({ date: '', time: '', note: '' });
      await fetchPlanner();
      await fetchBookedSlots();
    } else {
      alert(`❌ Error: ${data.error || 'Failed to create session'}`);
    }
  } catch (error) {
    console.error('Error creating next session:', error);
    alert(`Failed to create next session: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  const handleAddSessionSummary = async () => {
  if (!sessionSummaryForm.notes) {
    alert('Please enter session notes');
    return;
  }

  try {
    setLoading(true);
    const data = await api.post(
      `/sessions/appointments/${selectedPatient._id}/session-summary`,
      sessionSummaryForm
    );

    if (data.success) {
      alert('✅ Session summary added successfully');
      setShowSessionSummaryModal(false);
      setSessionSummaryForm({ notes: '', sessionSummary: '', progress: 'good' });
      await fetchPlanner();
    } else {
      alert(`❌ Error: ${data.error || 'Failed to add summary'}`);
    }
  } catch (error) {
    alert(`Failed to add session summary: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

 const handleCompleteProgram = async () => {
  if (!confirm('Are you sure you want to mark this patient\'s program as complete? This will generate a final report.')) {
    return;
  }

  try {
    setLoading(true);
    const data = await api.post(
      `/sessions/appointments/${selectedPatient._id}/complete-program`,
      { completionNotes }
    );

    if (data.success) {
      alert('✅ Patient program completed successfully!');
      setShowCompleteModal(false);
      setShowPrintModal(true);
      setCompletionNotes('');
      await fetchPlanner();
    } else {
      alert(`❌ Error: ${data.error || 'Failed to complete program'}`);
    }
  } catch (error) {
    console.error('Error completing program:', error);
    alert(`Failed to complete program: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  const handlePrintReport = () => {
    window.print();
  };

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
    const dateStr = formatDateString(date);
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
      {/* Print-only section */}
      <div className="hidden print:block">
        {showPrintModal && programReport && (
          <PrintableCompletionReport 
            report={programReport}
            patient={selectedPatient?.user}
            appointment={selectedPatient}
          />
        )}
        {showAllPatientsReportModal && allPatientsReport && (
          <ComprehensiveReport report={allPatientsReport} />
        )}
      </div>

      {/* Screen-only section */}
      <div className="print:hidden">
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
            <div className="flex gap-3">
              <button
                onClick={fetchPlanner}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>
            </div>
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
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Completed</div>
                <div className="text-2xl font-bold text-gray-800">{stats.completed || 0}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Pending</div>
                <div className="text-2xl font-bold text-gray-800">{stats.pending || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    viewMode === 'calendar'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Calendar className="w-5 h-5 inline mr-2" />
                  Calendar
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Filter className="w-5 h-5 inline mr-2" />
                  List
                </button>
              </div>

              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Sort by Date</option>
                <option value="status">Sort by Status</option>
                <option value="recent">Most Recent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => changeMonth(-1)}
                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition font-semibold"
                >
                  Today
                </button>
                <button
                  onClick={() => changeMonth(1)}
                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
              
              {getDaysInMonth(currentMonth).map((date, index) => {
                const dayAppointments = getAppointmentsForDate(date);
                const isCurrentDay = isToday(date);
                const isPast = isPastDate(date);
                
                return (
                  <div
                    key={index}
                    className={`min-h-24 p-2 border rounded-lg transition ${
                      !date ? 'bg-gray-50' :
                      isCurrentDay ? 'bg-blue-100 border-blue-500 border-2' :
                      isPast ? 'bg-gray-50' :
                      'bg-white hover:bg-gray-50'
                    }`}
                  >
                    {date && (
                      <>
                        <div className={`text-sm font-semibold mb-1 flex items-center gap-1 ${
                          isCurrentDay ? 'text-blue-600' : 'text-gray-700'
                        }`}>
                          {date.getDate()}
                          {/* ✅ NEW: Show closure indicator */}
                          {!isDateAvailable(date) && (
                            <span className="text-xs text-red-600">🚫</span>
                          )}
                        </div>
                        <div className="space-y-1">
                          {dayAppointments.slice(0, 2).map((apt, idx) => (
                            <div
                              key={idx}
                              onClick={() => openPatientModal(apt)}
                              className={`text-xs p-1 rounded cursor-pointer ${
                                apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                apt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                apt.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}
                            >
                              <div className="truncate font-medium">
                                {apt.user?.name || apt.user?.username}
                              </div>
                              <div className="truncate">{apt.time}</div>
                            </div>
                          ))}
                          {dayAppointments.length > 2 && (
                            <div className="text-xs text-blue-600 font-semibold">
                              +{dayAppointments.length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Appointments List</h2>
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No appointments found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAppointments.map((apt) => (
                  <div
                    key={apt._id}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition cursor-pointer"
                    onClick={() => openPatientModal(apt)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg text-gray-800">
                            {apt.user?.name || apt.user?.username}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            apt.status === 'confirmed' ? 'bg-green-600 text-white' :
                            apt.status === 'pending' ? 'bg-yellow-500 text-white' :
                            apt.status === 'completed' ? 'bg-blue-600 text-white' :
                            'bg-gray-600 text-white'
                          }`}>
                            {apt.status.toUpperCase()}
                          </span>
                          {apt.programCompleted && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-600 text-white">
                              PROGRAM COMPLETED
                            </span>
                          )}
                        </div>
                        <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {parseDate(apt.date).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {apt.time}
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Session #{apt.sessionTracking?.sessionNumber || 1}
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            {apt.service}
                          </div>
                        </div>
                      </div>
                      <Eye className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                ))}
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
                        {selectedPatient.psychosocialInfo?.fullName || 
                        selectedPatient.user?.name || 
                        selectedPatient.user?.username || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Age:</span>
                      <span className="text-gray-800 font-semibold">
                        {selectedPatient.psychosocialInfo?.age || 
                        selectedPatient.user?.age || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Gender:</span>
                      <span className="text-gray-800 font-semibold">
                        {selectedPatient.psychosocialInfo?.gender || 
                        selectedPatient.user?.gender || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Location:</span>
                      <span className="text-gray-800 font-semibold">
                        {selectedPatient.psychosocialInfo?.location || 
                        selectedPatient.user?.location || 'N/A'}
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
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-green-800 text-lg">Current Session</h3>
                    <button
                      onClick={openEditModal}
                      disabled={selectedPatient.programCompleted}
                      className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Edit appointment date/time"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Date:</span>
                      <span className="text-gray-800 font-semibold">
                        {parseDate(selectedPatient.date).toLocaleDateString('en-US', {
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
                    {selectedPatient.programCompleted && (
                      <div className="pt-2 border-t border-green-300">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-600 text-white">
                          ✅ PROGRAM COMPLETED
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Session History */}
              <div className="bg-purple-50 rounded-lg p-5 border-2 border-purple-200 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-indigo-800 text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Complete Session History
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedPatientForHistory(selectedPatient);
                      setShowUnifiedHistoryModal(true);
                      setShowPatientModal(false);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition font-semibold shadow-lg"
                  >
                    <Activity className="w-5 h-5" />
                    View All Sessions & Print Report
                  </button>
                </div>
                <p className="text-sm text-indigo-700">
                  View comprehensive timeline of all {selectedPatient.sessionTracking?.totalSessions || 0} session(s) 
                  across all appointments with professional printable report
                </p>
                
                {selectedPatient.sessionTracking?.sessionNotes?.length > 0 ? (
                  <div className="space-y-3 mt-4">
                    {selectedPatient.sessionTracking.sessionNotes.map((note, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-4 border border-purple-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-bold text-purple-900">Session #{note.sessionNumber}</span>
                            <p className="text-sm text-gray-600">
                              {parseDate(note.date).toLocaleDateString()} at {note.time}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              note.progress === 'excellent' ? 'bg-green-100 text-green-700' :
                              note.progress === 'good' ? 'bg-blue-100 text-blue-700' :
                              note.progress === 'fair' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {note.progress}
                            </span>
                            <button
                              onClick={() => openViewSessionModal(note, idx)}
                              className="px-3 py-1 bg-purple-600 text-white rounded text-xs font-semibold hover:bg-purple-700 transition flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              View/Edit
                            </button>
                          </div>
                        </div>
                        {note.sessionSummary && (
                          <p className="text-sm text-gray-700 italic">"{note.sessionSummary}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-purple-300 mx-auto mb-2" />
                    <p className="text-purple-600 font-medium">No Session History Yet</p>
                    <p className="text-purple-500 text-sm">Add a session summary to start tracking</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <button 
                    onClick={openNextSessionModal}
                    disabled={selectedPatient.programCompleted || !canSetNewSession(selectedPatient)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!canSetNewSession(selectedPatient) ? 'Add session summary first' : ''}
                  >
                    <Plus className="w-5 h-5" />
                    Set New Session
                  </button>
                  {!canSetNewSession(selectedPatient) && !selectedPatient.programCompleted && (
                    <p className="text-xs text-red-600 mt-1 text-center">
                      ⚠️ Add summary first
                    </p>
                  )}
                </div>
                
                <button 
                  onClick={openSessionSummaryModal}
                  disabled={selectedPatient.status !== 'confirmed' || selectedPatient.programCompleted}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-5 h-5" />
                  Add Summary
                </button>
                
                <button 
                  onClick={openCompleteModal}
                  disabled={selectedPatient.programCompleted}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-5 h-5" />
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

        {/* Edit Appointment Modal */}
        {showEditModal && selectedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                <Edit className="w-7 h-7 text-blue-600" />
                <h3 className="text-2xl font-bold text-gray-800">Edit Appointment</h3>
              </div>
              
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800 font-semibold">⚠️ Changes will be visible to the user immediately</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={editAppointmentForm.date}
                    onChange={(e) => setEditAppointmentForm({ ...editAppointmentForm, date: e.target.value })}
                    min={formatDateString(new Date())}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Time
                  </label>
                  <select
                    value={editAppointmentForm.time}
                    onChange={(e) => setEditAppointmentForm({ ...editAppointmentForm, time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select time</option>
                    {timeSlots.map(slot => {
                      const available = isSlotAvailable(editAppointmentForm.date, slot, selectedPatient._id);
                      const dateAvailable = editAppointmentForm.date ? isDateAvailable(new Date(editAppointmentForm.date)) : true;
                      const slotEnabled = available && dateAvailable;
                      
                      return (
                        <option 
                          key={slot} 
                          value={slot}
                          className={!slotEnabled ? 'text-red-600' : ''}
                        >
                          {slot} {!available ? '(Booked by other users)' : !dateAvailable ? '(Clinic Closed)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    🔴 Red times are booked or closed - you can still select but will get a confirmation
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Note (Optional)
                  </label>
                  <textarea
                    value={editAppointmentForm.note}
                    onChange={(e) => setEditAppointmentForm({ ...editAppointmentForm, note: e.target.value })}
                    rows="3"
                    placeholder="Add any notes about the change..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleEditAppointment}
                  disabled={loading || !editAppointmentForm.date || !editAppointmentForm.time}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditAppointmentForm({ date: '', time: '', note: '' });
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Ban className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Set Next Session Modal */}
        {showNextSessionModal && selectedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Schedule Next Session</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={nextSessionForm.date}
                    onChange={(e) => setNextSessionForm({ ...nextSessionForm, date: e.target.value })}
                    min={formatDateString(new Date())}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Time
                  </label>
                  <select
                    value={nextSessionForm.time}
                    onChange={(e) => setNextSessionForm({ ...nextSessionForm, time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select time</option>
                    {timeSlots.map(slot => {
                      const conflicts = getConflictingAppointments(nextSessionForm.date, slot);
                      const available = conflicts.length === 0;
                      const dateAvailable = nextSessionForm.date ? isDateAvailable(new Date(nextSessionForm.date)) : true;
                      const slotEnabled = available && dateAvailable;
                      
                      return (
                        <option 
                          key={slot} 
                          value={slot}
                          disabled={!slotEnabled}
                          className={!slotEnabled ? 'text-red-600' : ''}
                        >
                          {slot} {!available ? `(Booked by: ${conflicts.map(c => c.userName).join(', ')})` : !dateAvailable ? '(Clinic Closed)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    🔴 Booked slots show who has that time. 🚫 Closed times are due to holidays/closures.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Note (Optional)
                  </label>
                  <textarea
                    value={nextSessionForm.note}
                    onChange={(e) => setNextSessionForm({ ...nextSessionForm, note: e.target.value })}
                    rows="3"
                    placeholder="Add any notes for this session..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSetNextSession}
                  disabled={loading || !nextSessionForm.date || !nextSessionForm.time}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Scheduling...' : 'Schedule Session'}
                </button>
                <button
                  onClick={() => {
                    setShowNextSessionModal(false);
                    setNextSessionForm({ date: '', time: '', note: '' });
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Session Summary Modal */}
        {showSessionSummaryModal && selectedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Add Session Summary</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Session Notes *
                  </label>
                  <textarea
                    value={sessionSummaryForm.notes}
                    onChange={(e) => setSessionSummaryForm({ ...sessionSummaryForm, notes: e.target.value })}
                    rows="4"
                    placeholder="Enter detailed session notes..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Session Summary
                  </label>
                  <textarea
                    value={sessionSummaryForm.sessionSummary}
                    onChange={(e) => setSessionSummaryForm({ ...sessionSummaryForm, sessionSummary: e.target.value })}
                    rows="3"
                    placeholder="Brief summary of the session..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Progress Level
                  </label>
                  <select
                    value={sessionSummaryForm.progress}
                    onChange={(e) => setSessionSummaryForm({ ...sessionSummaryForm, progress: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddSessionSummary}
                  disabled={loading || !sessionSummaryForm.notes}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Summary'}
                </button>
                <button
                  onClick={() => {
                    setShowSessionSummaryModal(false);
                    setSessionSummaryForm({ notes: '', sessionSummary: '', progress: 'good' });
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View/Edit Session Modal */}
        {showViewSessionModal && selectedSessionNote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  Session #{selectedSessionNote.sessionNumber} Details
                </h3>
                <button
                  onClick={() => setShowViewSessionModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Session Notes *
                  </label>
                  <textarea
                    value={sessionSummaryForm.notes}
                    onChange={(e) => setSessionSummaryForm({ ...sessionSummaryForm, notes: e.target.value })}
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Session Summary
                  </label>
                  <textarea
                    value={sessionSummaryForm.sessionSummary}
                    onChange={(e) => setSessionSummaryForm({ ...sessionSummaryForm, sessionSummary: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Progress Level
                  </label>
                  <select
                    value={sessionSummaryForm.progress}
                    onChange={(e) => setSessionSummaryForm({ ...sessionSummaryForm, progress: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Date:</span> {parseDate(selectedSessionNote.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold">Time:</span> {selectedSessionNote.time}
                  </p>
                  {selectedSessionNote.completedAt && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-semibold">Completed:</span> {new Date(selectedSessionNote.completedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUpdateSessionSummary}
                  disabled={loading || !sessionSummaryForm.notes}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  {loading ? 'Updating...' : 'Update Summary'}
                </button>
                <button
                  onClick={() => setShowViewSessionModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Complete Program Modal */}
        {showCompleteModal && selectedPatient && programReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="text-center mb-6">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Complete Patient Program</h3>
                <p className="text-gray-600">Review the program summary before marking as complete</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6 border-2 border-gray-200">
                <h4 className="font-bold text-lg mb-4 text-gray-800">Program Summary</h4>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Patient:</p>
                    <p className="font-semibold">{programReport.patient.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Sessions:</p>
                    <p className="font-semibold">{programReport.programInfo.totalSessions}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Service:</p>
                    <p className="font-semibold text-sm">{selectedPatient.service}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Progress:</p>
                    <p className="font-semibold">{programReport.statistics.averageProgress}</p>
                  </div>
                </div>

                <div className="bg-white rounded p-4 mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Progress Distribution:</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-green-50 rounded p-2">
                      <p className="text-xs text-gray-600">Excellent</p>
                      <p className="font-bold text-green-700">{programReport.statistics.progressDistribution.excellent}</p>
                    </div>
                    <div className="bg-blue-50 rounded p-2">
                      <p className="text-xs text-gray-600">Good</p>
                      <p className="font-bold text-blue-700">{programReport.statistics.progressDistribution.good}</p>
                    </div>
                    <div className="bg-yellow-50 rounded p-2">
                      <p className="text-xs text-gray-600">Fair</p>
                      <p className="font-bold text-yellow-700">{programReport.statistics.progressDistribution.fair}</p>
                    </div>
                    <div className="bg-red-50 rounded p-2">
                      <p className="text-xs text-gray-600">Poor</p>
                      <p className="font-bold text-red-700">{programReport.statistics.progressDistribution.poor}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Final Completion Notes
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  rows="4"
                  placeholder="Add final notes about the program completion and overall assessment..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800 font-semibold">Important:</p>
                    <p className="text-sm text-yellow-700">
                      This will mark the program as complete and generate a final report that can be printed.
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCompleteProgram}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  {loading ? 'Completing...' : 'Complete Program & Generate Report'}
                </button>
                <button
                  onClick={() => {
                    setShowCompleteModal(false);
                    setCompletionNotes('');
                    setProgramReport(null);
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Print Modal */}
        {showPrintModal && programReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl">
              <div className="text-center mb-6">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Program Completed Successfully!</h3>
                <p className="text-gray-600">The final report is ready to print</p>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handlePrintReport}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition flex items-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  Print Report
                </button>
                <button
                  onClick={() => {
                    setShowPrintModal(false);
                    setProgramReport(null);
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* All Patients Report Modal */}
        {showAllPatientsReportModal && allPatientsReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl">
              <div className="text-center mb-6">
                <FileText className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Comprehensive Report Generated!</h3>
                <p className="text-gray-600">All patient sessions compiled in one document</p>
                <p className="text-sm text-gray-500 mt-2">
                  {allPatientsReport.totalPatients} patients • {allPatientsReport.totalSessions} total sessions
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handlePrintReport}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition flex items-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  Print Full Report
                </button>
                <button
                  onClick={() => {
                    setShowAllPatientsReportModal(false);
                    setAllPatientsReport(null);
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showTimelineModal && selectedPatient && (
        <SessionTimelineModal
          appointment={selectedPatient}
          onClose={() => setShowTimelineModal(false)}
        />
      )}

      {showUnifiedHistoryModal && selectedPatientForHistory && (
        <UnifiedSessionHistoryModal
          patientId={selectedPatientForHistory.user._id}
          caseManagerId={(() => {
            const user = JSON.parse(localStorage.getItem('user'));
            return user?.id || user?._id || localStorage.getItem('userId');
          })()}
          onClose={() => {
            setShowUnifiedHistoryModal(false);
            setSelectedPatientForHistory(null);
            setShowPatientModal(true);
          }}
        />
      )}
    </div>
  );
};

// Comprehensive All Patients Report Component
const ComprehensiveReport = ({ report }) => {
  if (!report) return null;

  return (
    <div className="bg-white p-8 max-w-5xl mx-auto">
      <style>{`
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .page-break { page-break-after: always; }
          @page { size: A4; margin: 20mm; }
        }
      `}</style>
      
      {/* Header */}
      <div className="border-b-4 border-purple-600 pb-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Comprehensive Session Report
        </h1>
        <p className="text-gray-600 text-lg">All Patients - Psychological Support Services</p>
        <p className="text-gray-500 mt-2">
          Report Generated: {new Date(report.generatedAt).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      {/* Overview Statistics */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 font-semibold mb-1">Total Patients</p>
            <p className="text-4xl font-bold text-blue-600">{report.totalPatients}</p>
          </div>
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 font-semibold mb-1">Total Sessions</p>
            <p className="text-4xl font-bold text-green-600">{report.totalSessions}</p>
          </div>
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 font-semibold mb-1">Completed Programs</p>
            <p className="text-4xl font-bold text-purple-600">{report.completedPrograms}</p>
          </div>
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 font-semibold mb-1">Ongoing Programs</p>
            <p className="text-4xl font-bold text-yellow-600">{report.ongoingPrograms}</p>
          </div>
        </div>
      </div>

      <div className="page-break"></div>

      {/* Patient Reports */}
      {report.patients.map((patient, patientIdx) => (
        <div key={patientIdx} className="mb-12">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {patient.patientInfo.name}
                </h2>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
                  <p><span className="font-semibold">Age:</span> {patient.patientInfo.age || 'N/A'}</p>
                  <p><span className="font-semibold">Gender:</span> {patient.patientInfo.gender || 'N/A'}</p>
                  <p><span className="font-semibold">Total Sessions:</span> {patient.totalSessions}</p>
                  <p><span className="font-semibold">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                      patient.programCompleted ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                    }`}>
                      {patient.programCompleted ? 'COMPLETED' : 'ONGOING'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Sessions */}
          <div className="space-y-3">
            {patient.sessions.map((session, sessionIdx) => (
              <div key={sessionIdx} className="border-2 border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-gray-900">Session #{session.sessionNumber}</h4>
                    <p className="text-sm text-gray-600">
                      {parseDate(session.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })} at {session.time}
                    </p>
                  </div>
                  {session.notes[0]?.progress && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      session.notes[0].progress === 'excellent' ? 'bg-green-600 text-white' :
                      session.notes[0].progress === 'good' ? 'bg-blue-600 text-white' :
                      session.notes[0].progress === 'fair' ? 'bg-yellow-600 text-white' :
                      'bg-red-600 text-white'
                    }`}>
                      {session.notes[0].progress.toUpperCase()}
                    </span>
                  )}
                </div>
                
                {session.notes[0]?.sessionSummary && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Summary:</p>
                    <p className="text-sm text-gray-700 italic">"{session.notes[0].sessionSummary}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {patientIdx < report.patients.length - 1 && (
            <div className="page-break"></div>
          )}
        </div>
      ))}

      {/* Footer */}
      <div className="border-t-2 border-gray-300 pt-6 mt-8">
        <div className="text-center">
          <p className="text-gray-600">Case Manager: {report.caseManager.name}</p>
          <p className="text-gray-600">{report.caseManager.email}</p>
          <div className="mt-4 bg-gray-100 rounded-lg p-4">
            <p className="text-xs text-gray-600">
              This is a comprehensive report of all patient sessions.
              All information is confidential and protected under privacy regulations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseManagerPlanner;