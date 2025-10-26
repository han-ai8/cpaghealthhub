import React, { useState, useEffect } from 'react';
import { Eye, X, Calendar, Clock, MapPin, AlertCircle, Edit, Mail, History, FileText, UserCheck, MessageCircle, RefreshCw, CheckCircle, XCircle, TrendingUp, Award, Activity, Phone, User as UserIcon } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Schedule = () => {
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showCancelRequestModal, setShowCancelRequestModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSessionDetailsModal, setShowSessionDetailsModal] = useState(false);
  const [clinicSchedule, setClinicSchedule] = useState([]);

  // User Profile States
  const [userProfile, setUserProfile] = useState({
    fullName: '',
    age: '',
    gender: '',
    location: ''
  });
  const [hasProfile, setHasProfile] = useState(false);

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
    { id: 'Psychosocial support and assistance', name: 'Psychosocial support and assistance', color: 'bg-green-600' }
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
    fetchClinicSchedule();  // ⭐ ADD THIS LINE
    checkUserProfile();
  }, []);
  
  // Real-time appointment status polling
  useEffect(() => {
    const interval = setInterval(() => {
      if (bookedAppointment) {
        fetchUserAppointment();
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [bookedAppointment]);

  // Real-time calendar slots polling
  useEffect(() => {
    const calendarInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing calendar slots...');
      fetchBookedSlots();
      fetchClinicSchedule();  // ⭐ ADD THIS LINE
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(calendarInterval);
  }, []);

  // Refresh when calendar modal opens
  useEffect(() => {
    if (showDateTimeModal) {
      console.log('📅 Calendar opened - refreshing slots');
      fetchBookedSlots();
      fetchClinicSchedule();  // ⭐ ADD THIS LINE
      setLastUpdate(new Date());
    }
  }, [showDateTimeModal]);

  const checkUserProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/user/profile`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        if (data.fullName && data.age && data.gender && data.location) {
          setUserProfile(data);
          setHasProfile(true);
        }
      }
    } catch (err) {
      console.error('Error checking user profile:', err);
    }
  };

  const saveUserProfile = async () => {
    if (!userProfile.fullName || !userProfile.age || !userProfile.gender || !userProfile.location) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/user/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(userProfile)
      });

      if (response.ok) {
        setHasProfile(true);
        setShowProfileModal(false);
        setShowDateTimeModal(true);
      } else {
        alert('Failed to save profile');
      }
    } catch (err) {
      alert('Error saving profile: ' + err.message);
    }
  };

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
  const dateStr = date.toISOString().split('T')[0];
  const dayOfWeek = date.getDay();
  
  // Check if date has a closure
  const closure = clinicSchedule.find(schedule => {
    const start = new Date(schedule.startDate);
    const end = new Date(schedule.endDate);
    const checkDate = new Date(dateStr);
    return schedule.type === 'closure' && checkDate >= start && checkDate <= end;
  });
  
  if (closure) {
    console.log(`❌ Date ${dateStr} is closed: ${closure.title}`);
    return false;
  }
  
  // Check if it's a special opening (Saturday)
  const specialOpening = clinicSchedule.find(schedule => {
    const scheduleDate = new Date(schedule.date).toISOString().split('T')[0];
    return schedule.type === 'special_opening' && scheduleDate === dateStr;
  });
  
  if (specialOpening) {
    console.log(`✅ Date ${dateStr} is special opening: ${specialOpening.title}`);
    return true;
  }
  
  // Default: closed on Sundays
  if (dayOfWeek === 0) {
    console.log(`❌ Date ${dateStr} is Sunday - closed`);
    return false;
  }
  
    return true;
  };

  const handleServiceSelection = (service) => {
    setSelectedService(service);
    setShowServiceModal(false);
    
    // 🆕 ONLY show profile modal for Psychosocial support
    if (service === 'Psychosocial support and assistance') {
      if (!hasProfile) {
        setShowProfileModal(true);
      } else {
        setShowDateTimeModal(true);
      }
    } else {
      // For Testing and Counseling, go straight to date/time
      setShowDateTimeModal(true);
    }
  };

  const handleCreateAppointment = () => {
    setSelectedService('');
    setSelectedDate(null);
    setSelectedTime('');
    setNote('');
    setIsEditing(false);
    setShowServiceModal(true);
  };

  const handleEditAppointment = () => {
    if (bookedAppointment) {
      setSelectedService(bookedAppointment.service);
      setSelectedDate(new Date(bookedAppointment.date));
      setSelectedTime(bookedAppointment.time);
      setNote(bookedAppointment.note || '');
      setIsEditing(true);
      setShowServiceModal(true);
    }
  };

  const handleDateSelection = (date) => {
    setSelectedDate(date);
  };

  const handleTimeSelection = (time) => {
    setSelectedTime(time);
  };

  const handleProceedToReview = () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select both date and time');
      return;
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
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        note: note || ''
      };

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
      console.log('Appointment saved:', newAppointment);

      setBookedAppointment(newAppointment);
      await fetchBookedSlots();
      await fetchAppointmentHistory();

      setShowReviewModal(false);
      setShowConfirmationModal(true);

      setTimeout(() => {
        setShowConfirmationModal(false);
        resetForm();
      }, 3000);

    } catch (err) {
      console.error('Error booking appointment:', err);
      setError(err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!bookedAppointment) return;

    const bookedTime = new Date(bookedAppointment.bookedAt);
    const now = new Date();
    const hoursSinceBooking = (now - bookedTime) / (1000 * 60 * 60);

    if (hoursSinceBooking <= 24) {
      if (!window.confirm('Are you sure you want to cancel this appointment?')) {
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/appointments/${bookedAppointment._id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to cancel appointment');
        }

        alert('Appointment cancelled successfully');
        setBookedAppointment(null);
        await fetchBookedSlots();
        await fetchAppointmentHistory();
        setShowAppointmentModal(false);
      } catch (err) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      setShowCancelRequestModal(true);
    }
  };

  const submitCancelRequest = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/appointments/${bookedAppointment._id}/cancel-request`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason: cancelReason })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit cancellation request');
      }

      const data = await response.json();
      alert(data.message);
      setBookedAppointment(data.appointment);
      setShowCancelRequestModal(false);
      setShowAppointmentModal(false);
      setCancelReason('');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedService('');
    setSelectedDate(null);
    setSelectedTime('');
    setNote('');
    setIsEditing(false);
    setError('');
  };

  const isSlotBooked = (date, time) => {
    if (!date) return false;
    const dateStr = date.toISOString().split('T')[0];
    return bookedSlots.some(slot => slot.date === dateStr && slot.time === time);
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

  const isPastDate = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return date1.toDateString() === date2.toDateString();
  };

  const changeMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + direction);
      return newMonth;
    });
  };

  const getNextHalfHour = (time) => {
    const [hourMin, period] = time.split(' ');
    const [hour, minute] = hourMin.split(':').map(Number);
    
    let nextHour = hour;
    let nextMinute = minute + 30;
    let nextPeriod = period;
    
    if (nextMinute >= 60) {
      nextMinute = 0;
      nextHour += 1;
      if (nextHour === 12 && period === 'AM') {
        nextPeriod = 'PM';
      } else if (nextHour === 13) {
        nextHour = 1;
      }
    }
    
    return `${nextHour}:${nextMinute.toString().padStart(2, '0')} ${nextPeriod}`;
  };

  const formatLastUpdate = () => {
    return lastUpdate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      
      {/* 🆕 CPAG HEADER COVER SECTION */}
      <div className="bg-white shadow-lg">
        {/* Header Image Banner */}
        <div className="bg-gradient-to-r from-sky-400 via-cyan-300 to-sky-400 h-48 md:h-64 relative overflow-hidden">
          {/* Logo and Branding - Replace src with your actual image path */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4">
              {/* You can replace this with an actual image tag */}
              <img 
                src="/cpag-banner.png" 
                alt="CPAG Region IV-A Banner" 
                className="w-full max-w-4xl mx-auto h-auto"
                onError={(e) => {
                  // Fallback if image doesn't load - shows text instead
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              {/* Fallback text if image fails to load */}
              <div className="hidden">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="bg-white/90 p-4 rounded-full">
                    <Activity className="w-16 h-16 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h1 className="text-2xl md:text-4xl font-bold text-blue-900">CPAG REGION IV-A</h1>
                    <p className="text-lg md:text-2xl text-blue-800 italic">Cavite Positive Action Group</p>
                  </div>
                </div>
                <div className="text-sm md:text-base text-blue-900 font-semibold">
                  <span className="bg-white/80 px-3 py-1 rounded">#CPAGcares2023</span>
                  <span className="bg-white/80 px-3 py-1 rounded ml-2">#BeInspired</span>
                  <span className="bg-white/80 px-3 py-1 rounded ml-2">#WeDontWaitWeAct</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 text-center">
              CAVITE POSITIVE ACTION GROUP THE JCH ADVOCACY INC.
            </h2>
            
            {/* Contact Details Grid */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Address */}
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

              {/* Contact Info */}
              <div className="space-y-3">
                {/* Phone */}
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-700 text-sm">Phone</p>
                    <p className="text-gray-600 text-sm">(046) 542 9246</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-700 text-sm">Email</p>
                    <p className="text-gray-600 text-sm">cavitepositiveactiongroup@outlook.com</p>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-700 text-sm">Office Hours</p>
                    <p className="text-gray-600 text-sm">Monday-Friday | 9 AM - 5:30 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={handleCreateAppointment}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                REQUEST SERVICE
              </button>
              <button
                onClick={() => setShowHistoryModal(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <History className="w-5 h-5" />
                VIEW APPOINTMENT HISTORY
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* END CPAG HEADER COVER SECTION */}

      {/* Main Content Section */}
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Real-time Update Info */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Schedule Your Appointment</h2>
              <p className="text-sm text-gray-600 mt-1">
                📡 Real-time updates • Last refresh: {formatLastUpdate()}
              </p>
            </div>
            <button
              onClick={() => {
                fetchBookedSlots();
                setLastUpdate(new Date());
              }}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Current Appointment Card */}
        {bookedAppointment ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border-l-8 border-green-500">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                  Current Appointment
                </h2>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${
                  bookedAppointment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  bookedAppointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  bookedAppointment.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {bookedAppointment.status === 'pending' && <AlertCircle className="w-4 h-4" />}
                  {bookedAppointment.status === 'confirmed' && <CheckCircle className="w-4 h-4" />}
                  {bookedAppointment.status === 'completed' && <Award className="w-4 h-4" />}
                  {bookedAppointment.status.toUpperCase()}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAppointmentModal(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800">Service</h3>
                </div>
                <p className="text-gray-700 font-medium pl-11">{bookedAppointment.service}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-600 p-2 rounded-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800">Date & Time</h3>
                </div>
                <div className="pl-11 space-y-1">
                  <p className="text-gray-700 font-medium">
                    {new Date(bookedAppointment.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-gray-600">
                    {bookedAppointment.time} - {getNextHalfHour(bookedAppointment.time)}
                  </p>
                </div>
              </div>

              {bookedAppointment.assignedCaseManager && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-purple-600 p-2 rounded-lg">
                      <UserCheck className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-800">Case Manager</h3>
                  </div>
                  <div className="pl-11 space-y-1">
                    <p className="text-gray-700 font-medium">{bookedAppointment.assignedCaseManager.name}</p>
                    <p className="text-gray-600 text-sm flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {bookedAppointment.assignedCaseManager.email}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border-2 border-orange-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-orange-600 p-2 rounded-lg">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800">Location</h3>
                </div>
                <div className="pl-11 space-y-1 text-gray-700">
                  <p className="font-medium">CPAG Region IV-A Office</p>
                  <p className="text-sm">9002 J. Miranda Street</p>
                  <p className="text-sm">Brgy. Lao Lao Caridad</p>
                  <p className="text-sm">Cavite City 4100, Philippines</p>
                </div>
              </div>
            </div>

            {bookedAppointment.cancelRequest?.requested && (
              <div className="mt-6 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-yellow-800 mb-2">Cancellation Request Pending</h4>
                    <p className="text-sm text-yellow-700 mb-3">
                      Your cancellation request has been submitted and is awaiting admin review.
                    </p>
                    <div className="bg-white rounded-lg p-3 text-sm">
                      <p className="text-gray-600 font-medium mb-1">Reason:</p>
                      <p className="text-gray-800">{bookedAppointment.cancelRequest.reason}</p>
                    </div>
                    {bookedAppointment.cancelRequest.adminResponse && (
                      <div className="bg-white rounded-lg p-3 text-sm mt-3">
                        <p className="text-gray-600 font-medium mb-1">Admin Response:</p>
                        <p className="text-gray-800">{bookedAppointment.cancelRequest.adminResponse}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-16 mb-6 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">No Active Appointment</h2>
              <p className="text-gray-600 mb-8">Schedule your appointment today and take control of your health</p>
              <button
                onClick={handleCreateAppointment}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 text-lg"
              >
                Book Appointment Now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Service Selection Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Select Service</h3>
              <button 
                onClick={() => {
                  setShowServiceModal(false);
                  resetForm();
                }} 
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid gap-4">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelection(service.id)}
                  className="flex items-center gap-4 p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-200 text-left group"
                >
                  <div className={`${service.color} w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 text-lg group-hover:text-green-700 transition">
                      {service.name}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {service.id === 'Testing and Counseling' 
                        ? 'Get tested and receive professional counseling' 
                        : 'Comprehensive psychosocial support sessions'}
                    </p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-gray-300 group-hover:text-green-600 transition" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal - ONLY for Psychosocial support */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Complete Your Profile</h3>
              <button 
                onClick={() => {
                  setShowProfileModal(false);
                  setShowServiceModal(true);
                }} 
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  For Psychosocial support services, we need some additional information to better assist you.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <UserIcon className="w-4 h-4 inline mr-1" />
                  Full Name *
                </label>
                <input
                  type="text"
                  value={userProfile.fullName}
                  onChange={(e) => setUserProfile({...userProfile, fullName: e.target.value})}
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  value={userProfile.age}
                  onChange={(e) => setUserProfile({...userProfile, age: e.target.value})}
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter your age"
                  min="1"
                  max="120"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  value={userProfile.gender}
                  onChange={(e) => setUserProfile({...userProfile, gender: e.target.value})}
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location *
                </label>
                <input
                  type="text"
                  value={userProfile.location}
                  onChange={(e) => setUserProfile({...userProfile, location: e.target.value})}
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
                  placeholder="City, Province"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setShowServiceModal(true);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
              >
                Back
              </button>
              <button
                onClick={saveUserProfile}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date & Time Selection Modal */}
      {showDateTimeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-8 my-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Select Date & Time</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Service: <span className="font-semibold text-blue-600">{selectedService}</span>
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowDateTimeModal(false);
                  setShowServiceModal(true);
                }} 
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Calendar */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <button 
                    onClick={() => changeMonth(-1)}
                    className="p-2 hover:bg-blue-200 rounded-lg transition"
                  >
                    ←
                  </button>
                  <h4 className="font-bold text-gray-800">
                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h4>
                  <button 
                    onClick={() => changeMonth(1)}
                    className="p-2 hover:bg-blue-200 rounded-lg transition"
                  >
                    →
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center font-semibold text-sm text-gray-600 py-2">
                      {day}
                    </div>
                  ))}
                  {getDaysInMonth(currentMonth).map((date, index) => (
                    <button
                      key={index}
                      onClick={() => date && !isPastDate(date) && handleDateSelection(date)}
                      disabled={isPastDate(day) || !isDateAvailable(day)}  // ⭐ ADD !isDateAvailable(day)
                      className={`
                        aspect-square rounded-lg font-semibold text-sm transition-all
                        ${!date ? 'invisible' : ''}
                        ${isPastDate(date) ? 'text-gray-300 cursor-not-allowed' : ''}
                        ${date && !isPastDate(date) && !isSameDay(date, selectedDate) 
                          ? 'bg-white hover:bg-blue-500 hover:text-white text-gray-700' 
                          : ''}
                        ${isSameDay(date, selectedDate) 
                          ? 'bg-blue-600 text-white shadow-lg transform scale-110' 
                          : ''}
                      `}
                    >
                      {date && date.getDate()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slots */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200 overflow-y-auto max-h-96">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  Available Time Slots
                </h4>
                
                {!selectedDate ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Please select a date first</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {timeSlots.map((time) => {
                      const isBooked = isSlotBooked(selectedDate, time);
                      const isSelected = selectedTime === time;
                      
                      return (
                        <button
                          key={time}
                          onClick={() => !isBooked && handleTimeSelection(time)}
                          disabled={isBooked}
                          className={`
                            p-3 rounded-lg font-semibold text-sm transition-all
                            ${isBooked 
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed line-through' 
                              : isSelected
                                ? 'bg-green-600 text-white shadow-lg transform scale-105'
                                : 'bg-white text-gray-700 hover:bg-green-500 hover:text-white border-2 border-green-200'
                            }
                          `}
                        >
                          {time}
                          {isBooked && (
                            <div className="text-xs mt-1">Booked</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none resize-none"
                rows="3"
                placeholder="Any special requests or information..."
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDateTimeModal(false);
                  if (selectedService === 'Psychosocial support and assistance' && !hasProfile) {
                    setShowProfileModal(true);
                  } else {
                    setShowServiceModal(true);
                  }
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
              >
                Back
              </button>
              <button
                onClick={handleProceedToReview}
                disabled={!selectedDate || !selectedTime}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition disabled:bg-gray-300 disabled:cursor-not-allowed"
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
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Review Your Appointment</h3>
              <button 
                onClick={() => {
                  setShowReviewModal(false);
                  setShowDateTimeModal(true);
                }} 
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-gray-800">Service</h4>
                </div>
                <p className="text-gray-700 pl-8">{selectedService}</p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <h4 className="font-bold text-gray-800">Date</h4>
                </div>
                <p className="text-gray-700 pl-8">
                  {selectedDate?.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-200">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <h4 className="font-bold text-gray-800">Time</h4>
                </div>
                <p className="text-gray-700 pl-8">
                  {selectedTime} - {getNextHalfHour(selectedTime)}
                </p>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-5 border-2 border-orange-200">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-5 h-5 text-orange-600" />
                  <h4 className="font-bold text-gray-800">Location</h4>
                </div>
                <div className="pl-8 text-gray-700 space-y-1">
                  <p className="font-medium">CPAG Region IV-A Office</p>
                  <p className="text-sm">9002 J. Miranda Street</p>
                  <p className="text-sm">Brgy. Lao Lao Caridad</p>
                  <p className="text-sm">Cavite City 4100, Philippines</p>
                </div>
              </div>

              {note && (
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-5 border-2 border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <h4 className="font-bold text-gray-800">Notes</h4>
                  </div>
                  <p className="text-gray-700 pl-8">{note}</p>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Important:</p>
                  <p>You can cancel within 24 hours of booking. After that, you'll need to request cancellation from admin.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setShowDateTimeModal(true);
                }}
                disabled={loading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
              >
                Back
              </button>
              <button
                onClick={bookAppointment}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition disabled:bg-gray-300"
              >
                {loading ? 'Booking...' : isEditing ? 'Update Appointment' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl text-center">
            <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              {isEditing ? 'Updated!' : 'Booked Successfully!'}
            </h3>
            <p className="text-gray-600 mb-6">
              Your appointment has been {isEditing ? 'updated' : 'confirmed'}. We look forward to seeing you!
            </p>
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      {showAppointmentModal && bookedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Appointment Details</h3>
              <button 
                onClick={() => setShowAppointmentModal(false)} 
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-gray-800">Service</h4>
                </div>
                <p className="text-gray-700 pl-8">{bookedAppointment.service}</p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <h4 className="font-bold text-gray-800">Schedule</h4>
                </div>
                <div className="pl-8 space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="text-gray-800 font-medium">
                      {new Date(bookedAppointment.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="text-gray-800 font-medium">
                      {bookedAppointment.time} - {getNextHalfHour(bookedAppointment.time)}
                    </p>
                  </div>
                </div>
              </div>

              {bookedAppointment.assignedCaseManager && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-200">
                  <div className="flex items-center gap-3 mb-3">
                    <UserCheck className="w-5 h-5 text-purple-600" />
                    <h4 className="font-bold text-gray-800">Case Manager</h4>
                  </div>
                  <div className="pl-8 space-y-1">
                    <p className="font-medium text-gray-800">{bookedAppointment.assignedCaseManager.name}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {bookedAppointment.assignedCaseManager.email}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-5 border-2 border-orange-200">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="w-5 h-5 text-orange-600" />
                  <h4 className="font-bold text-gray-800">Location</h4>
                </div>
                <div className="pl-8 space-y-1 text-gray-700">
                  <p className="font-medium">CPAG Region IV-A Office</p>
                  <p className="text-sm">9002 J. Miranda Street</p>
                  <p className="text-sm">Brgy. Lao Lao Caridad</p>
                  <p className="text-sm">Cavite City 4100, Philippines</p>
                </div>
              </div>

              {bookedAppointment.note && (
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-5 border-2 border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <h4 className="font-bold text-gray-800">Notes</h4>
                  </div>
                  <p className="text-gray-700 pl-8">{bookedAppointment.note}</p>
                </div>
              )}
            </div>

            {bookedAppointment.status !== 'cancelled' && bookedAppointment.status !== 'completed' && (
              <div className="flex gap-3">
                <button
                  onClick={handleEditAppointment}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleCancelAppointment}
                  disabled={bookedAppointment.cancelRequest?.requested}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {bookedAppointment.cancelRequest?.requested ? 'Cancel Requested' : 'Cancel'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancel Request Modal */}
      {showCancelRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Request Cancellation</h3>
              <button 
                onClick={() => setShowCancelRequestModal(false)} 
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-orange-800">
                  It's been more than 24 hours since booking. Please provide a reason for cancellation. Admin will review your request.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason for Cancellation *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none resize-none"
                rows="4"
                placeholder="Please explain why you need to cancel..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelRequestModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
              >
                Back
              </button>
              <button
                onClick={submitCancelRequest}
                disabled={loading || !cancelReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition disabled:bg-gray-300"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Appointment History</h3>
                <p className="text-sm text-gray-600 mt-1">View your past appointments</p>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)} 
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {appointmentHistory.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-gray-100 to-slate-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <History className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-gray-600 text-lg">No appointment history yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointmentHistory.map((item) => (
                  <div 
                    key={item._id}
                    onClick={() => {
                      setSelectedHistoryItem(item);
                      setShowHistoryModal(false);
                      setShowSessionDetailsModal(true);
                    }}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 text-lg mb-2">{item.service}</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(item.date).toLocaleDateString('en-US', { 
                              weekday: 'short',
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{item.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.status === 'completed' ? 'bg-green-100 text-green-700' :
                        item.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.status.toUpperCase()}
                      </div>
                    </div>
                    
                    {item.assignedCaseManager && (
                      <div className="text-sm text-gray-600 flex items-center gap-2 mt-2">
                        <UserCheck className="w-4 h-4 text-blue-600" />
                        <span>Case Manager: {item.assignedCaseManager.name}</span>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        View Full Details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Session Details Modal (from History) */}
      {showSessionDetailsModal && selectedHistoryItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Session Details</h3>
                <p className="text-sm text-gray-600 mt-1">Complete appointment information</p>
              </div>
              <button 
                onClick={() => {
                  setShowSessionDetailsModal(false);
                  setShowHistoryModal(true);
                }} 
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 space-y-6">
              
              {/* Status */}
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-lg text-gray-800">Status</h4>
                <div className={`px-4 py-2 rounded-full font-semibold text-sm shadow-md ${
                  selectedHistoryItem.status === 'completed' ? 'bg-green-600 text-white' :
                  selectedHistoryItem.status === 'cancelled' ? 'bg-red-600 text-white' :
                  'bg-gray-600 text-white'
                }`}>
                  {selectedHistoryItem.status.toUpperCase()}
                </div>
              </div>

              {/* Service */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  <h5 className="font-semibold text-gray-800">Service</h5>
                </div>
                <p className="text-gray-700 ml-7">{selectedHistoryItem.service}</p>
              </div>

              {/* Case Manager */}
              {selectedHistoryItem.assignedCaseManager && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                    <h5 className="font-semibold text-gray-800">Case Manager</h5>
                  </div>
                  <div className="ml-7 space-y-1">
                    <p className="font-medium text-gray-800">{selectedHistoryItem.assignedCaseManager.name}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{selectedHistoryItem.assignedCaseManager.email}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Date & Time */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <h5 className="font-semibold text-gray-800">Schedule</h5>
                </div>
                <div className="ml-7 space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium text-gray-800">
                      {new Date(selectedHistoryItem.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="font-medium text-gray-800">
                      {selectedHistoryItem.time} - {getNextHalfHour(selectedHistoryItem.time)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-red-600" />
                  <h5 className="font-semibold text-gray-800">Location</h5>
                </div>
                <div className="ml-7 space-y-1 text-gray-700">
                  <p className="font-medium">CPAG Region IV-A Office</p>
                  <p>9002 J. Miranda Street</p>
                  <p>Barangay Lao Lao Caridad</p>
                  <p>Cavite City 4100, Philippines</p>
                </div>
              </div>

              {/* Session Notes (if available) */}
              {selectedHistoryItem.sessionTracking?.sessionNotes && selectedHistoryItem.sessionTracking.sessionNotes.length > 0 && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <h5 className="font-semibold text-gray-800">Session Notes</h5>
                  </div>
                  <div className="ml-7 space-y-3">
                    {selectedHistoryItem.sessionTracking.sessionNotes.map((note, idx) => (
                      <div key={idx} className="border-l-4 border-indigo-400 pl-3 py-2 bg-indigo-50/50 rounded">
                        <p className="text-sm text-gray-600 mb-1">Session {note.sessionNumber}</p>
                        <p className="text-gray-700 text-sm">{note.summary}</p>
                        <p className="text-xs text-gray-500 mt-1">Progress: <span className="font-medium">{note.progress}</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  <h5 className="font-semibold text-gray-800">Notes</h5>
                </div>
                <p className="text-gray-700 ml-7">
                  {selectedHistoryItem.note || 'No additional notes'}
                </p>
              </div>

            </div>

            <button
              onClick={() => {
                setShowSessionDetailsModal(false);
                setShowHistoryModal(true);
              }}
              className="w-full mt-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
            >
              BACK TO HISTORY
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;