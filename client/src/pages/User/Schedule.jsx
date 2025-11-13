import React, { useState, useEffect } from 'react';
import { Eye, X, Calendar, Clock, MapPin, AlertCircle, Edit, Mail, History, FileText, UserCheck, MessageCircle, RefreshCw, CheckCircle, XCircle, TrendingUp, Award, Activity, Phone, User as UserIcon } from 'lucide-react';
import SessionTimelineModal from '../../components/SessionTimelineModal';
import CaviteLocationSelect from '../../components/CaviteLocationSelect';
import { GENDER_IDENTITIES } from '../../constants/genderIdentities';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ✅ FIXED: Universal date formatter to prevent timezone issues
const formatDateToLocal = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateFromString = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const Schedule = () => {
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showPsychosocialFormModal, setShowPsychosocialFormModal] = useState(false);
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showCancelRequestModal, setShowCancelRequestModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSessionDetailsModal, setShowSessionDetailsModal] = useState(false);
  const [clinicSchedule, setClinicSchedule] = useState([]);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [timelineAppointment, setTimelineAppointment] = useState(null);

  const [requestSaturday, setRequestSaturday] = useState(false);
  const [saturdayReason, setSaturdayReason] = useState('');

  // ✅ UPDATED: Added contactNumber field
  const [psychosocialForm, setPsychosocialForm] = useState({
    fullName: '',
    age: '',
    gender: '',
    location: '',
    contactNumber: '' // ✅ NEW
  });

  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [note, setNote] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [bookedAppointment, setBookedAppointment] = useState(null);
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const services = [
    { id: 'Testing and Counseling', name: 'Testing and Counseling', color: 'bg-green-600' },
    { id: 'Psychosocial support and assistance', name: 'Psychosocial support and assistance', color: 'bg-blue-600' }
  ];

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

  const openTimelineModal = (appointment) => {
    setTimelineAppointment(appointment);
    setShowTimelineModal(true);
  };

  // ✅ FIXED: Weekend Helper Functions
  const isWeekend = (date) => {
    if (!date) return false;
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const isSunday = (date) => {
    if (!date) return false;
    return date.getDay() === 0;
  };

  const isSaturday = (date) => {
    if (!date) return false;
    return date.getDay() === 6;
  };

  const fetchClinicSchedule = async () => {
    try {
      const response = await fetch(`${API_URL}/clinic-schedule/active`);
      if (response.ok) {
        const data = await response.json();
        setClinicSchedule(data);
        console.log('✅ Clinic schedule loaded:', data.length);
      }
    } catch (err) {
      console.error('Error fetching clinic schedule:', err);
    }
  };

  useEffect(() => {
    fetchBookedSlots();
    fetchUserAppointment();
    fetchAppointmentHistory();
    fetchClinicSchedule();
  }, []);
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (bookedAppointment) {
        fetchUserAppointment();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [bookedAppointment]);

  useEffect(() => {
    const calendarInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing calendar slots...');
      fetchBookedSlots();
      fetchClinicSchedule();
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(calendarInterval);
  }, []);

  useEffect(() => {
    if (showDateTimeModal) {
      console.log('📅 Calendar opened - refreshing slots');
      fetchBookedSlots();
      fetchClinicSchedule();
      setLastUpdate(new Date());
    }
  }, [showDateTimeModal]);

  const fetchBookedSlots = async () => {
    try {
      const response = await fetch(`${API_URL}/appointments/booked-slots`);
      const data = await response.json();
      setBookedSlots(data);
      console.log('✅ Booked slots updated:', data.length);
    } catch (err) {
      console.error('Error fetching booked slots:', err);
    }
  };

  const fetchUserAppointment = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found');
        return;
      }
      
      const response = await fetch(`${API_URL}/appointments/my-appointments`, {
        headers: getAuthHeaders()
      });
      
      if (response.status === 403) {
        alert('Access denied. This feature is only for regular users.');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }
      
      const data = await response.json();
      setBookedAppointment(data.current);
    } catch (err) {
      console.error('Error fetching user appointment:', err);
    }
  };

  const fetchAppointmentHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found for history');
        return;
      }
      
      const response = await fetch(`${API_URL}/appointments/history`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Appointment history:', data);
        setAppointmentHistory(data);
      } else {
        console.error('Failed to fetch history:', response.status);
      }
    } catch (err) {
      console.error('Error fetching appointment history:', err);
    }
  };

  const isDateAvailable = (date) => {
    if (!date) return true;
    const dateStr = formatDateToLocal(date);
    const dayOfWeek = date.getDay();
    
    const closure = clinicSchedule.find(schedule => {
      const start = new Date(schedule.startDate);
      const end = new Date(schedule.endDate);
      const checkDate = parseDateFromString(dateStr);
      
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      checkDate.setHours(0, 0, 0, 0);
      
      return (schedule.type === 'closure' || schedule.type === 'holiday') && 
             schedule.isActive &&
             checkDate >= start && 
             checkDate <= end;
    });
    
    if (closure) {
      console.log(`❌ Date ${dateStr} is closed: ${closure.title}`);
      return false;
    }
    
    const specialOpening = clinicSchedule.find(schedule => {
      const scheduleDate = formatDateToLocal(new Date(schedule.date || schedule.startDate));
      return schedule.type === 'special_opening' && 
             schedule.isActive &&
             scheduleDate === dateStr;
    });
    
    if (specialOpening) {
      console.log(`✅ Date ${dateStr} is special opening: ${specialOpening.title}`);
      return true;
    }
    
    if (dayOfWeek === 0) {
      console.log(`❌ Date ${dateStr} is Sunday - closed`);
      return false;
    }
    
    return true;
  };

  const isTimeSlotAvailable = (date, time) => {
    if (!date || !time) return true;
    
    if (!isDateAvailable(date)) return false;
    
    const dateStr = formatDateToLocal(date);
    
    if (isSlotBooked(date, time)) return false;
    
    const partialClosure = clinicSchedule.find(schedule => {
      const scheduleDate = formatDateToLocal(new Date(schedule.date || schedule.startDate));
      return schedule.type === 'closure' && 
             schedule.isActive &&
             scheduleDate === dateStr &&
             schedule.affectedTimeSlots && 
             schedule.affectedTimeSlots.includes(time);
    });
    
    if (partialClosure) {
      console.log(`❌ Time ${time} on ${dateStr} is closed: ${partialClosure.title}`);
      return false;
    }
    
    return true;
  };

  const handleServiceSelection = (service) => {
    setSelectedService(service);
    setShowServiceModal(false);
    
    if (service === 'Psychosocial support and assistance' || service === 'Testing and Counseling') {
      setShowPsychosocialFormModal(true);
    } else {
      setShowDateTimeModal(true);
    }
  };

  // ✅ UPDATED: Validate contact number
  const handlePsychosocialFormSubmit = () => {
    if (!psychosocialForm.fullName || !psychosocialForm.age || !psychosocialForm.gender || !psychosocialForm.location || !psychosocialForm.contactNumber) {
      alert('Please fill in all fields including contact number');
      return;
    }

    const age = parseInt(psychosocialForm.age);
    if (isNaN(age) || age < 1 || age > 150) {
      alert('Please enter a valid age between 1 and 150');
      return;
    }

    // ✅ Validate contact number (Philippine format)
    const contactRegex = /^(09|\+639)\d{9}$/;
    if (!contactRegex.test(psychosocialForm.contactNumber.replace(/\s+/g, ''))) {
      alert('Please enter a valid Philippine contact number (e.g., 09123456789 or +639123456789)');
      return;
    }

    console.log('✅ Form completed:', psychosocialForm);
    setShowPsychosocialFormModal(false);
    setShowDateTimeModal(true);
  };

  const handleCreateAppointment = () => {
    setSelectedService('');
    setSelectedDate(null);
    setSelectedTime('');
    setNote('');
    setPsychosocialForm({ fullName: '', age: '', gender: '', location: '', contactNumber: '' });
    setRequestSaturday(false);
    setSaturdayReason('');
    setIsEditing(false);
    setShowServiceModal(true);
  };

  const handleEditAppointment = () => {
    if (bookedAppointment) {
      setSelectedService(bookedAppointment.service);
      setSelectedDate(parseDateFromString(bookedAppointment.date));
      setSelectedTime(bookedAppointment.time);
      setNote(bookedAppointment.note || '');
      
      if (bookedAppointment.psychosocialInfo) {
        setPsychosocialForm(bookedAppointment.psychosocialInfo);
      } else if (bookedAppointment.testingInfo) {
        setPsychosocialForm(bookedAppointment.testingInfo);
      }
      
      if (bookedAppointment.saturdayRequest) {
        setRequestSaturday(true);
        setSaturdayReason(bookedAppointment.saturdayRequest.reason || '');
      }
      
      setIsEditing(true);
      setShowServiceModal(true);
    }
  };

  const handleDateSelection = (date) => {
    setSelectedDate(date);
    setSelectedTime('');
    
    if (!isSaturday(date)) {
      setRequestSaturday(false);
      setSaturdayReason('');
    }
  };

  const handleTimeSelection = (time) => {
    setSelectedTime(time);
  };

  const handleProceedToReview = () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select both date and time');
      return;
    }

    if (isSunday(selectedDate)) {
      alert('❌ Sundays are not available. Please select a weekday.');
      return;
    }

    if (isSaturday(selectedDate)) {
      if (!requestSaturday) {
        alert('⚠️ Saturday appointments require a special request. Please enable "Request Saturday" option.');
        return;
      }
      if (!saturdayReason || saturdayReason.trim().length < 10) {
        alert('Please provide a detailed reason (minimum 10 characters) for Saturday appointment.');
        return;
      }
    }

    setShowDateTimeModal(false);
    setShowReviewModal(true);
  };

  const bookAppointment = async () => {
    setLoading(true);
    setError('');

    try {
      const appointmentData = {
        service: selectedService,
        date: formatDateToLocal(selectedDate),
        time: selectedTime,
        note: note || '',
        requestSaturday: requestSaturday,
        saturdayReason: saturdayReason
      };

      if (selectedService === 'Psychosocial support and assistance' || selectedService === 'Testing and Counseling') {
        appointmentData.psychosocialInfo = psychosocialForm;
      }

      const url = isEditing 
        ? `${API_URL}/appointments/${bookedAppointment._id}`
        : `${API_URL}/appointments`;

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(appointmentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to book appointment');
      }

      const newAppointment = await response.json();
      setBookedAppointment(newAppointment);
      
      setShowReviewModal(false);
      setShowSuccessModal(true);
      
      await fetchBookedSlots();
      await fetchUserAppointment();
      await fetchAppointmentHistory();
    } catch (err) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/appointments/${bookedAppointment._id}/request-cancel`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason: cancelReason })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit cancel request');
      }

      alert('Cancellation request submitted successfully!');
      setShowCancelRequestModal(false);
      setCancelReason('');
      await fetchUserAppointment();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDirectCancel = async () => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/appointments/${bookedAppointment._id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel appointment');
      }

      alert('Appointment cancelled successfully!');
      setBookedAppointment(null);
      await fetchBookedSlots();
      await fetchUserAppointment();
      await fetchAppointmentHistory();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
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

  const isSlotBooked = (date, time) => {
    if (!date || !time) return false;
    const dateStr = formatDateToLocal(date);
    return bookedSlots.some(slot => slot.date === dateStr && slot.time === time);
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

  const canCancelWithin24Hours = () => {
    if (!bookedAppointment) return false;
    const bookedTime = new Date(bookedAppointment.bookedAt);
    const now = new Date();
    const hoursSinceBooking = (now - bookedTime) / (1000 * 60 * 60);
    return hoursSinceBooking <= 24;
  };

  return (
    <div className="min-h-screen flex flex-col items-center">
      {/* CPAG HEADER */}
      <div className="bg-white max-w-6xl rounded-lg shadow-lg w-full mb-6">
        <div className="bg-gradient-to-r from-sky-50 via-cyan-300 to-sky-100 h-48 md:h-64 rounded-lg relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-5">
              <img 
                src="/src/assets/cover-cpag-new.png" 
                alt="CPAG Region IV-A Banner" 
                className=" rounded-lg w-full max-w-4xl mx-auto h-auto"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center bg-white max-w-6xl mx-auto px-4 py-6 rounded-lg shadow-md p-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 text-center">
            CAVITE POSITIVE ACTION GROUP THE JCH ADVOCACY INC.
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-gray-700 text-sm">Address</p>
                <p className="text-gray-600 text-sm">
                  9002 J. Miranda Street<br />
                  Barangay Lao Lao Caridad<br />
                  Cavite City 4100, Philippines
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-700 text-sm">Phone</p>
                  <p className="text-gray-600 text-sm">(046) 542 9246</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-700 text-sm">Email</p>
                  <p className="text-gray-600 text-sm">cavitepositiveactiongroup@outlook.com</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-700 text-sm">Office Hours</p>
                  <p className="text-gray-600 text-sm">Monday-Friday | 9 AM - 5:30 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white max-w-6xl rounded-lg shadow-lg w-full mb-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              HIV Testing & Counseling Schedule
            </h1>
            <p className="text-gray-600">Book your appointment for testing, counseling, or psychosocial support</p>
            <p className="text-sm text-gray-500 mt-2">
              📡 Real-time updates • Last refresh: {formatLastUpdate()}
            </p>
          </div>
          <button
            onClick={() => {
              fetchBookedSlots();
              fetchUserAppointment();
              fetchClinicSchedule();
              setLastUpdate(new Date());
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Current Appointment or No Appointment */}
      {bookedAppointment ? (
        <div className="bg-white max-w-6xl rounded-lg shadow-lg w-full p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Your Current Appointment
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAppointmentModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Service
              </h3>
              <p className="text-gray-700 font-medium">{bookedAppointment.service}</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
              <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Date & Time
              </h3>
              <p className="text-gray-700 font-medium">
                {parseDateFromString(bookedAppointment.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
              <p className="text-gray-600 flex items-center gap-1 mt-1">
                <Clock className="w-4 h-4" />
                {bookedAppointment.time}
              </p>
            </div>

            {bookedAppointment.assignedCaseManager && (
              <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                <h3 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Assigned Case Manager
                </h3>
                <p className="text-gray-700 font-medium">
                  {bookedAppointment.assignedCaseManager.name || bookedAppointment.assignedCaseManager.username}
                </p>
              </div>
            )}

            <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Status
              </h3>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                bookedAppointment.status === 'confirmed' ? 'bg-green-600 text-white' :
                bookedAppointment.status === 'pending' ? 'bg-yellow-500 text-white' :
                'bg-gray-600 text-white'
              }`}>
                {bookedAppointment.status.toUpperCase()}
              </span>
              {bookedAppointment.cancelRequest?.requested && (
                <p className="text-orange-600 text-sm mt-2 font-medium">
                  ⚠️ Cancellation requested - Pending admin review
                </p>
              )}
            </div>
          </div>

{/* ✅ ENHANCED: Saturday Request Display in Current Appointment */}
{bookedAppointment.saturdayRequest?.requested && (
  <div className="mt-4 bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
    <h3 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
      <Calendar className="w-5 h-5" />
      📅 Saturday Appointment Request
    </h3>
    <div className="space-y-3">
      <div className="bg-white rounded-lg p-3 border border-purple-200">
        <p className="text-sm font-medium text-gray-700 mb-1">Your Reason:</p>
        <p className="text-gray-800 pl-3 border-l-4 border-purple-400">
          {bookedAppointment.saturdayRequest.reason}
        </p>
      </div>
      
      {bookedAppointment.saturdayRequest.approved !== null ? (
        <div className={`rounded-lg p-4 border-2 ${
          bookedAppointment.saturdayRequest.approved 
            ? 'bg-green-50 border-green-300' 
            : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-start gap-2 mb-2">
            {bookedAppointment.saturdayRequest.approved ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`font-bold text-lg ${
                bookedAppointment.saturdayRequest.approved ? 'text-green-800' : 'text-red-800'
              }`}>
                {bookedAppointment.saturdayRequest.approved ? '✅ REQUEST APPROVED' : '❌ REQUEST DENIED'}
              </p>
            </div>
          </div>
          
          {bookedAppointment.saturdayRequest.adminResponse && (
            <div className="mt-3">
              <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                Admin's Response:
              </p>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-gray-800 italic">
                  "{bookedAppointment.saturdayRequest.adminResponse}"
                </p>
              </div>
            </div>
          )}
          
          {bookedAppointment.saturdayRequest.processedAt && (
            <p className="text-xs text-gray-600 mt-3 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Processed on {new Date(bookedAppointment.saturdayRequest.processedAt).toLocaleString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
        </div>
      ) : (
        <div className="bg-orange-50 rounded-lg p-3 border border-orange-300">
          <p className="text-sm text-orange-800 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            ⏳ Awaiting admin review...
          </p>
          <p className="text-xs text-orange-600 mt-1">
            Your request will be reviewed by an administrator soon.
          </p>
        </div>
      )}
    </div>
  </div>
)}


          {/* Personal Information Display */}
          {((bookedAppointment.service === 'Psychosocial support and assistance' && bookedAppointment.psychosocialInfo) ||
           (bookedAppointment.service === 'Testing and Counseling' && bookedAppointment.testingInfo)) && (
            <div className="mt-4 bg-indigo-50 rounded-lg p-4 border-2 border-indigo-200">
              <h3 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Personal Information
              </h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                {(() => {
                  const info = bookedAppointment.psychosocialInfo || bookedAppointment.testingInfo;
                  return (
                    <>
                      <div>
                        <span className="text-gray-600">Full Name:</span>
                        <p className="font-medium text-gray-800">{info.fullName}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Age:</span>
                        <p className="font-medium text-gray-800">{info.age}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Gender:</span>
                        <p className="font-medium text-gray-800">{info.gender}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Location:</span>
                        <p className="font-medium text-gray-800">{info.location}</p>
                      </div>
                      {info.contactNumber && (
                        <div>
                          <span className="text-gray-600">Contact Number:</span>
                          <p className="font-medium text-gray-800">{info.contactNumber}</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            {canCancelWithin24Hours() && !bookedAppointment.cancelRequest?.requested && (
              <button
                onClick={handleDirectCancel}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
              >
                <XCircle className="w-5 h-5" />
                Cancel Appointment
              </button>
            )}
            {!canCancelWithin24Hours() && !bookedAppointment.cancelRequest?.requested && (
              <button
                onClick={() => setShowCancelRequestModal(true)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold"
              >
                <AlertCircle className="w-5 h-5" />
                Request Cancellation
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white max-w-6xl rounded-lg shadow-lg w-full p-12 mb-6 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-700 mb-2">No Active Appointment</h3>
          <p className="text-gray-600 mb-6">You currently don't have any active appointment</p>
          <button
            onClick={handleCreateAppointment}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 font-semibold text-lg"
          >
            <Calendar className="w-6 h-6" />
            Book New Appointment
          </button>
        </div>
      )}

      {/* View History Button */}
      <div className="bg-white max-w-6xl rounded-lg shadow-lg w-full mb-6 p-6">
        <button
          onClick={() => setShowHistoryModal(true)}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 font-semibold text-lg"
        >
          <History className="w-6 h-6" />
          View Appointment History ({appointmentHistory.length})
        </button>
      </div>

      {/* Service Selection Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-3xl font-bold text-gray-800">Select a Service</h3>
              <button onClick={() => setShowServiceModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="grid gap-4">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelection(service.id)}
                  className={`${service.color} text-white p-6 rounded-xl hover:opacity-90 transition-all transform hover:scale-105 shadow-lg`}
                >
                  <h4 className="text-2xl font-bold mb-2">{service.name}</h4>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ✅ UPDATED: Psychosocial/Testing Form Modal with 72 Gender Identities and Contact Number */}
      {showPsychosocialFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <UserIcon className="w-7 h-7 text-blue-600" />
                {selectedService === 'Testing and Counseling' 
                  ? 'Patient Information for Testing' 
                  : 'Personal Information'}
              </h3>
              <button 
                onClick={() => {
                  setShowPsychosocialFormModal(false);
                  setShowServiceModal(true);
                }} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              Please provide your information for the service
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={psychosocialForm.fullName}
                  onChange={(e) => setPsychosocialForm({ ...psychosocialForm, fullName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Age <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={psychosocialForm.age}
                  onChange={(e) => setPsychosocialForm({ ...psychosocialForm, age: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your age"
                  min="1"
                  max="150"
                  required
                />
              </div>

              {/* ✅ NEW: 72 Gender Identities Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gender Identity <span className="text-red-500">*</span>
                </label>
                <select
                  value={psychosocialForm.gender}
                  onChange={(e) => setPsychosocialForm({ ...psychosocialForm, gender: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select gender identity</option>
                  {GENDER_IDENTITIES.map((gender) => (
                    <option key={gender} value={gender}>
                      {gender}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <CaviteLocationSelect
                  value={psychosocialForm.location}
                  onChange={(e) => setPsychosocialForm({ ...psychosocialForm, location: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* ✅ NEW: Contact Number Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={psychosocialForm.contactNumber}
                  onChange={(e) => setPsychosocialForm({ ...psychosocialForm, contactNumber: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="09123456789 or +639123456789"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Please enter a valid Philippine contact number
                </p>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => {
                  setShowPsychosocialFormModal(false);
                  setShowServiceModal(true);
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Back
              </button>
              <button
                onClick={handlePsychosocialFormSubmit}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition font-semibold"
              >
                Next: Select Date & Time
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Calendar Modal */}
      {showDateTimeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-3xl font-bold text-gray-800">Select Date & Time</h3>
                <p className="text-sm text-gray-500 mt-1">
                  ⏰ Last updated: {formatLastUpdate()}
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowDateTimeModal(false);
                  if (selectedService === 'Psychosocial support and assistance' || selectedService === 'Testing and Counseling') {
                    setShowPsychosocialFormModal(true);
                  } else {
                    setShowServiceModal(true);
                  }
                }} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            {/* Calendar Component */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => changeMonth(-1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Previous
                </button>
                <h4 className="text-2xl font-bold text-gray-800">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h4>
                <button
                  onClick={() => changeMonth(1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Next
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center font-bold text-gray-700 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {getDaysInMonth(currentMonth).map((date, index) => {
                  if (!date) return <div key={`empty-${index}`} />;

                  const isPast = isPastDate(date);
                  const isTodayDate = isToday(date);
                  const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                  const available = isDateAvailable(date);
                  const isSun = isSunday(date);
                  const isSat = isSaturday(date);

                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => available && !isPast && !isSun && handleDateSelection(date)}
                      disabled={!available || isPast || isSun}
                      className={`
                        p-3 rounded-lg text-center font-semibold transition-all relative
                        ${isSelected ? 'bg-blue-600 text-white ring-4 ring-blue-300' : ''}
                        ${isTodayDate && !isSelected ? 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-400' : ''}
                        ${isSun ? 'bg-red-100 text-red-400 cursor-not-allowed' : ''}
                        ${isSat && !isSelected && available && !isPast ? 'bg-orange-100 text-orange-700 border-2 border-orange-300' : ''}
                        ${!available || isPast ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : ''}
                        ${available && !isPast && !isSelected && !isTodayDate && !isSun && !isSat ? 'bg-white text-gray-700 hover:bg-blue-100 hover:text-blue-700 border-2 border-gray-200' : ''}
                      `}
                    >
                      {date.getDate()}
                      {isSat && available && !isPast && (
                        <span className="absolute top-0 right-0 text-xs bg-orange-500 text-white rounded-full w-4 h-4 flex items-center justify-center">!</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex gap-4 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-400 rounded"></div>
                  <span className="text-gray-600">Today</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-600 rounded"></div>
                  <span className="text-gray-600">Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-100 border-2 border-orange-300 rounded"></div>
                  <span className="text-gray-600">Saturday (Special Request)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 rounded"></div>
                  <span className="text-gray-600">Sunday (Closed)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <span className="text-gray-600">Not Available</span>
                </div>
              </div>
            </div>

            {/* Weekend Warning Messages */}
            {selectedDate && isSunday(selectedDate) && (
              <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                <p className="text-red-700 font-medium flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  ❌ Sundays are not available. Please select a weekday or Saturday.
                </p>
              </div>
            )}

            {/* Saturday Request Section */}
            {selectedDate && isSaturday(selectedDate) && (
              <div className="mb-6 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-5">
                <h4 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  ⚠️ Saturday Appointment Request
                </h4>
                <p className="text-yellow-800 text-sm mb-4">
                  Saturday appointments require special approval. Please check the box below and provide a reason.
                </p>
                
                <label className="flex items-center gap-2 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requestSaturday}
                    onChange={(e) => setRequestSaturday(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-700">I request a Saturday appointment</span>
                </label>

                {requestSaturday && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Reason for Saturday Request <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={saturdayReason}
                      onChange={(e) => setSaturdayReason(e.target.value)}
                      rows="3"
                      placeholder="Please explain why you need a Saturday appointment (minimum 10 characters)"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {saturdayReason.length}/10 characters minimum
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Time Slots */}
            {selectedDate && !isSunday(selectedDate) && (
              <div className="mb-6">
                <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-blue-600" />
                  Select Time Slot for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </h4>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {timeSlots.map((time) => {
                    const booked = isSlotBooked(selectedDate, time);
                    const available = isTimeSlotAvailable(selectedDate, time);
                    const selected = selectedTime === time;

                    return (
                      <button
                        key={time}
                        onClick={() => available && !booked && handleTimeSelection(time)}
                        disabled={booked || !available}
                        className={`
                          p-3 rounded-lg font-semibold transition-all
                          ${selected ? 'bg-blue-600 text-white ring-4 ring-blue-300' : ''}
                          ${booked || !available ? 'bg-gray-200 text-gray-400 cursor-not-allowed line-through' : ''}
                          ${!booked && available && !selected ? 'bg-white text-gray-700 hover:bg-blue-100 hover:text-blue-700 border-2 border-gray-200' : ''}
                        `}
                      >
                        {time}
                        {booked && <span className="block text-xs mt-1">Booked</span>}
                        {!booked && !available && <span className="block text-xs mt-1">Closed</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes Section */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-800 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Any special requests or information..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDateTimeModal(false);
                  if (selectedService === 'Psychosocial support and assistance' || selectedService === 'Testing and Counseling') {
                    setShowPsychosocialFormModal(true);
                  } else {
                    setShowServiceModal(true);
                  }
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Back
              </button>
              <button
                onClick={handleProceedToReview}
                disabled={!selectedDate || !selectedTime || isSunday(selectedDate)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Review Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-3xl font-bold text-gray-800">Review Your Appointment</h3>
              <button onClick={() => {
                setShowReviewModal(false);
                setShowDateTimeModal(true);
              }} className="text-gray-500 hover:text-gray-700">
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Service</h4>
                <p className="text-gray-700 text-lg">{selectedService}</p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Date & Time</h4>
                <p className="text-gray-700 text-lg">
                  {selectedDate.toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric'
                  })} at {selectedTime}
                </p>
                {isSaturday(selectedDate) && requestSaturday && (
                  <span className="inline-block mt-2 px-3 py-1 bg-orange-500 text-white text-sm font-semibold rounded-full">
                    Saturday Special Request
                  </span>
                )}
              </div>

              {requestSaturday && saturdayReason && (
                <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">Saturday Request Reason</h4>
                  <p className="text-gray-700">{saturdayReason}</p>
                </div>
              )}

              {(selectedService === 'Psychosocial support and assistance' || selectedService === 'Testing and Counseling') && (
                <div className="bg-indigo-50 rounded-lg p-4 border-2 border-indigo-200">
                  <h4 className="font-semibold text-indigo-800 mb-3">Personal Information</h4>
                  <div className="grid md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <p className="font-medium text-gray-800">{psychosocialForm.fullName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Age:</span>
                      <p className="font-medium text-gray-800">{psychosocialForm.age}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Gender:</span>
                      <p className="font-medium text-gray-800">{psychosocialForm.gender}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <p className="font-medium text-gray-800">{psychosocialForm.location}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Contact:</span>
                      <p className="font-medium text-gray-800">{psychosocialForm.contactNumber}</p>
                    </div>
                  </div>
                </div>
              )}

              {note && (
                <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">Notes</h4>
                  <p className="text-gray-700">{note}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setShowDateTimeModal(true);
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Back to Calendar
              </button>
              <button
                onClick={bookAppointment}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition font-semibold disabled:opacity-50"
              >
                {loading ? 'Booking...' : isEditing ? 'Update Appointment' : 'Confirm Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
            <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-gray-800 mb-2">Appointment {isEditing ? 'Updated' : 'Booked'}!</h3>
            <p className="text-gray-600 mb-6">
              Your appointment has been successfully {isEditing ? 'updated' : 'booked'}. 
              {requestSaturday && ' Your Saturday request will be reviewed by admin.'}
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Cancel Request Modal */}
      {showCancelRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Request Cancellation</h3>
              <button onClick={() => setShowCancelRequestModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-7 h-7" />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Since it's been more than 24 hours since booking, please provide a reason for cancellation. Admin will review your request.
            </p>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              rows="4"
              placeholder="Please explain why you need to cancel..."
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelRequestModal(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCancelRequest}
                className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      {showAppointmentModal && bookedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-3xl font-bold text-gray-800">Appointment Details</h3>
              <button onClick={() => setShowAppointmentModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-5 border-2 border-blue-200">
                <h4 className="font-bold text-blue-800 mb-2 text-lg">Service</h4>
                <p className="text-gray-700 text-lg">{bookedAppointment.service}</p>
              </div>

              <div className="bg-green-50 rounded-lg p-5 border-2 border-green-200">
                <h4 className="font-bold text-green-800 mb-2 text-lg">Date & Time</h4>
                <p className="text-gray-700 text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {new Date(bookedAppointment.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-gray-700 flex items-center gap-2 mt-2">
                  <Clock className="w-5 h-5" />
                  {bookedAppointment.time}
                </p>
              </div>
              
{bookedAppointment.saturdayRequest?.requested && (
  <div className="bg-purple-50 rounded-lg p-5 border-2 border-purple-200">
    <h4 className="font-bold text-purple-800 mb-3 text-lg flex items-center gap-2">
      <Calendar className="w-5 h-5" />
      📅 Saturday Appointment Request
    </h4>
    <div className="space-y-3">
      <div className="bg-white rounded-lg p-3 border border-purple-200">
        <p className="text-sm font-semibold text-gray-700 mb-1">Your Reason:</p>
        <p className="text-gray-800 pl-3 border-l-4 border-purple-400">
          {bookedAppointment.saturdayRequest.reason}
        </p>
      </div>
      
      {bookedAppointment.saturdayRequest.approved !== null ? (
        <div className={`rounded-lg p-4 border-2 ${
          bookedAppointment.saturdayRequest.approved 
            ? 'bg-green-50 border-green-300' 
            : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            {bookedAppointment.saturdayRequest.approved ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
            <p className={`font-bold text-lg ${
              bookedAppointment.saturdayRequest.approved ? 'text-green-800' : 'text-red-800'
            }`}>
              {bookedAppointment.saturdayRequest.approved ? 'REQUEST APPROVED' : 'REQUEST DENIED'}
            </p>
          </div>
          
          {bookedAppointment.saturdayRequest.adminResponse && (
            <div className="mt-3">
              <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                Administrator's Response:
              </p>
              <div className="bg-white rounded-lg p-4 border border-gray-300 shadow-sm">
                <p className="text-gray-800 leading-relaxed">
                  {bookedAppointment.saturdayRequest.adminResponse}
                </p>
              </div>
            </div>
          )}
          
          {bookedAppointment.saturdayRequest.adminNotes && (
            <div className="mt-3">
              <p className="text-sm font-semibold text-gray-700 mb-1">Internal Notes:</p>
              <p className="text-xs text-gray-600 italic">{bookedAppointment.saturdayRequest.adminNotes}</p>
            </div>
          )}
          
          <div className="mt-3 pt-3 border-t border-gray-300">
            <p className="text-xs text-gray-600">
              Processed on {new Date(bookedAppointment.saturdayRequest.processedAt).toLocaleString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-300">
          <p className="text-sm text-orange-800 font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Pending Administrative Review
          </p>
          <p className="text-xs text-orange-600 mt-2">
            Your Saturday appointment request is awaiting admin approval. You will be notified once a decision is made.
          </p>
        </div>
      )}
    </div>
  </div>
              )}

              {bookedAppointment.sessionTracking?.sessionNotes?.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-5 border-2 border-purple-200">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-purple-800 text-lg">Session History</h4>
                    <button
                      onClick={() => openTimelineModal(bookedAppointment)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-semibold"
                    >
                      <FileText className="w-5 h-5" />
                      View Timeline
                    </button>
                  </div>
                  <p className="text-gray-700">
                    {bookedAppointment.sessionTracking.sessionNotes.length} session(s) completed
                  </p>
                </div>
              )}

              {bookedAppointment.assignedCaseManager && (
                <div className="bg-purple-50 rounded-lg p-5 border-2 border-purple-200">
                  <h4 className="font-bold text-purple-800 mb-2 text-lg flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    Assigned Case Manager
                  </h4>
                  <p className="text-gray-700 text-lg font-medium">
                    {bookedAppointment.assignedCaseManager.name || bookedAppointment.assignedCaseManager.username}
                  </p>
                  {bookedAppointment.assignedCaseManager.email && (
                    <p className="text-gray-600 text-sm flex items-center gap-1 mt-1">
                      <Mail className="w-4 h-4" />
                      {bookedAppointment.assignedCaseManager.email}
                    </p>
                  )}
                </div>
              )}

              {((bookedAppointment.service === 'Psychosocial support and assistance' && bookedAppointment.psychosocialInfo) ||
                (bookedAppointment.service === 'Testing and Counseling' && bookedAppointment.testingInfo)) && (
                <div className="bg-indigo-50 rounded-lg p-5 border-2 border-indigo-200">
                  <h4 className="font-bold text-indigo-800 mb-3 text-lg flex items-center gap-2">
                    <UserIcon className="w-5 h-5" />
                    Personal Information
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {(() => {
                      const info = bookedAppointment.psychosocialInfo || bookedAppointment.testingInfo;
                      return (
                        <>
                          <div>
                            <span className="text-gray-600 text-sm">Full Name:</span>
                            <p className="font-medium text-gray-800">{info.fullName}</p>
                          </div>
                          <div>
                            <span className="text-gray-600 text-sm">Age:</span>
                            <p className="font-medium text-gray-800">{info.age}</p>
                          </div>
                          <div>
                            <span className="text-gray-600 text-sm">Gender:</span>
                            <p className="font-medium text-gray-800">{info.gender}</p>
                          </div>
                          <div>
                            <span className="text-gray-600 text-sm">Location:</span>
                            <p className="font-medium text-gray-800">{info.location}</p>
                          </div>
                          {info.contactNumber && (
                            <div>
                              <span className="text-gray-600 text-sm">Contact Number:</span>
                              <p className="font-medium text-gray-800">{info.contactNumber}</p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {bookedAppointment.note && (
                <div className="bg-yellow-50 rounded-lg p-5 border-2 border-yellow-200">
                  <h4 className="font-bold text-yellow-800 mb-2 text-lg">Notes</h4>
                  <p className="text-gray-700">{bookedAppointment.note}</p>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-5 border-2 border-gray-200">
                <h4 className="font-bold text-gray-800 mb-2 text-lg">Status</h4>
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                  bookedAppointment.status === 'confirmed' ? 'bg-green-600 text-white' :
                  bookedAppointment.status === 'pending' ? 'bg-yellow-500 text-white' :
                  'bg-gray-600 text-white'
                }`}>
                  {bookedAppointment.status.toUpperCase()}
                </span>
                {bookedAppointment.cancelRequest?.requested && (
                  <p className="text-orange-600 text-sm mt-2 font-medium">
                    ⚠️ Cancellation requested - Pending admin review
                  </p>
                )}
                <p className="text-gray-600 text-sm mt-3">
                  Booked on: {new Date(bookedAppointment.bookedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAppointmentModal(false)}
              className="mt-6 w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <History className="w-8 h-8 text-purple-600" />
                Appointment History
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-8 h-8" />
              </button>
            </div>

            {appointmentHistory.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No appointment history yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointmentHistory.map((apt) => (
                  <div key={apt._id} className="bg-gray-50 rounded-lg p-5 border-2 border-gray-200 hover:border-purple-300 transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 text-lg mb-2">{apt.service}</h4>
                        <p className="text-gray-600 flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(apt.date).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })} at {apt.time}
                        </p>
                        {apt.assignedCaseManager && (
                          <p className="text-gray-600 flex items-center gap-2">
                            <UserCheck className="w-4 h-4" />
                            Case Manager: {apt.assignedCaseManager.name || apt.assignedCaseManager.username}
                          </p>
                        )}
                        {apt.saturdayRequest?.requested && (
                          <span className="inline-block mt-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded">
                            Saturday Request
                          </span>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        apt.status === 'completed' ? 'bg-blue-600 text-white' :
                        apt.status === 'cancelled' ? 'bg-red-600 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {apt.status.toUpperCase()}
                      </span>
                    </div>
                    
                    {apt.sessionTracking?.sessionNumber && apt.service !== 'Testing and Counseling' && (
                      <p className="text-sm text-gray-500 mt-2">
                        Session #{apt.sessionTracking.sessionNumber}
                      </p>
                    )}

                    <button
                      onClick={() => {
                        setSelectedHistoryItem(apt);
                        setShowSessionDetailsModal(true);
                      }}
                      className="mt-3 text-purple-600 hover:text-purple-700 font-semibold text-sm flex items-center gap-1"
                    >
                      <FileText className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowHistoryModal(false)}
              className="mt-6 w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      {showSessionDetailsModal && selectedHistoryItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Session Details</h3>
              <button onClick={() => setShowSessionDetailsModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-7 h-7" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Service</h4>
                <p className="text-gray-700">{selectedHistoryItem.service}</p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Date & Time</h4>
                <p className="text-gray-700">
                  {new Date(selectedHistoryItem.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })} at {selectedHistoryItem.time}
                </p>
              </div>

              {selectedHistoryItem.saturdayRequest?.requested && (
  <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
    <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
      <Calendar className="w-5 h-5" />
      Saturday Request Details
    </h4>
    <div className="space-y-2">
      <div className="bg-white rounded p-3 border border-purple-200">
        <p className="text-sm font-medium text-gray-700">Your Reason:</p>
        <p className="text-gray-800 text-sm mt-1">{selectedHistoryItem.saturdayRequest.reason}</p>
      </div>
      
      {selectedHistoryItem.saturdayRequest.approved !== null && (
        <div className={`rounded-lg p-3 ${
          selectedHistoryItem.saturdayRequest.approved 
            ? 'bg-green-50 border border-green-300' 
            : 'bg-red-50 border border-red-300'
        }`}>
          <p className={`font-semibold text-sm flex items-center gap-2 mb-2 ${
            selectedHistoryItem.saturdayRequest.approved ? 'text-green-800' : 'text-red-800'
          }`}>
            {selectedHistoryItem.saturdayRequest.approved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Approved
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Denied
              </>
            )}
          </p>
          
          {selectedHistoryItem.saturdayRequest.adminResponse && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-gray-700 mb-1">Admin Response:</p>
              <div className="bg-white rounded p-2 border border-gray-200">
                <p className="text-sm text-gray-800">
                  {selectedHistoryItem.saturdayRequest.adminResponse}
                </p>
              </div>
            </div>
          )}
          
          {selectedHistoryItem.saturdayRequest.processedAt && (
            <p className="text-xs text-gray-600 mt-2">
              Processed: {new Date(selectedHistoryItem.saturdayRequest.processedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  </div>
)}


              {((selectedHistoryItem.service === 'Psychosocial support and assistance' && selectedHistoryItem.psychosocialInfo) ||
                (selectedHistoryItem.service === 'Testing and Counseling' && selectedHistoryItem.testingInfo)) && (
                <div className="bg-indigo-50 rounded-lg p-4 border-2 border-indigo-200">
                  <h4 className="font-semibold text-indigo-800 mb-3">Personal Information</h4>
                  <div className="grid md:grid-cols-2 gap-2 text-sm">
                    {(() => {
                      const info = selectedHistoryItem.psychosocialInfo || selectedHistoryItem.testingInfo;
                      return (
                        <>
                          <div>
                            <span className="text-gray-600">Name:</span>
                            <p className="font-medium text-gray-800">{info.fullName}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Age:</span>
                            <p className="font-medium text-gray-800">{info.age}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Gender:</span>
                            <p className="font-medium text-gray-800">{info.gender}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Location:</span>
                            <p className="font-medium text-gray-800">{info.location}</p>
                          </div>
                          {info.contactNumber && (
                            <div>
                              <span className="text-gray-600">Contact:</span>
                              <p className="font-medium text-gray-800">{info.contactNumber}</p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {selectedHistoryItem.assignedCaseManager && (
                <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2">Case Manager</h4>
                  <p className="text-gray-700 font-medium">
                    {selectedHistoryItem.assignedCaseManager.name || selectedHistoryItem.assignedCaseManager.username}
                  </p>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">Status</h4>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  selectedHistoryItem.status === 'completed' ? 'bg-blue-600 text-white' :
                  selectedHistoryItem.status === 'cancelled' ? 'bg-red-600 text-white' :
                  'bg-gray-600 text-white'
                }`}>
                  {selectedHistoryItem.status.toUpperCase()}
                </span>
              </div>

              {selectedHistoryItem.sessionTracking?.sessionNotes?.length > 0 && (
                <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-3">Session Notes</h4>
                  <div className="space-y-2">
                    {selectedHistoryItem.sessionTracking.sessionNotes.map((note, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border border-yellow-200">
                        <p className="text-sm text-gray-600">Session #{note.sessionNumber}</p>
                        <p className="text-gray-700 mt-1">{note.notes || 'No notes'}</p>
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
              onClick={() => setShowSessionDetailsModal(false)}
              className="mt-6 w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showTimelineModal && timelineAppointment && (
        <SessionTimelineModal
          appointment={timelineAppointment}
          onClose={() => {
            setShowTimelineModal(false);
            setTimelineAppointment(null);
          }}
        />
      )}
    </div>
  );
};

export default Schedule;