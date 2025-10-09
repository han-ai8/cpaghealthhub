import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, AlertCircle, Edit, Mail } from 'lucide-react';

const ScheduleSystem = () => {
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showCancelRequestModal, setShowCancelRequestModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [note, setNote] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [bookedAppointment, setBookedAppointment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Mock booked slots for demonstration
  const [bookedSlots, setBookedSlots] = useState([
    { date: '2025-08-04', time: '10:00 AM' },
    { date: '2025-08-04', time: '11:00 AM' },
    { date: '2025-08-05', time: '9:00 AM' },
  ]);

  const services = [
    { id: 'testing', name: 'Testing and Counseling', color: 'bg-green-600' },
    { id: 'psychosocial', name: 'Psychosocial support and assistance', color: 'bg-green-600' }
  ];

  const timeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
    '5:00 PM', '5:30 PM'
  ];

  // Utility to get days in currentMonth calendar grid with offset
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null); // empty placeholder for days before month start
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  // Format selected day to YYYY-MM-DD for matching booked slots
  const formatDate = (day) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  // Check if a time slot is already booked for specific date
  const isSlotBooked = (date, time) => {
    // When editing, allow current booking as available to reschedule it
    if (isEditing && bookedAppointment &&
        bookedAppointment.date === date &&
        bookedAppointment.time === time) {
      return false;
    }
    return bookedSlots.some(slot => slot.date === date && slot.time === time);
  };

  // Service button click handler - proceed to date/time modal
  const handleServiceSelect = (serviceId) => {
    if (bookedAppointment && !isEditing) {
      alert('You already have a booked appointment. Please cancel or edit your existing appointment first.');
      setShowServiceModal(false);
      return;
    }
    setSelectedService(serviceId);
    setShowServiceModal(false);
    setShowDateTimeModal(true);
  };

  const handleDateSelect = (day) => {
    if (day) {
      setSelectedDate(day);
      setSelectedTime('');
    }
  };

  const handleTimeSelect = (time) => {
    if (!selectedDate) return;
    const dateStr = formatDate(selectedDate);
    if (!isSlotBooked(dateStr, time)) {
      setSelectedTime(time);
    }
  };

  // Booking progression handlers
  const handleBookAppointment = () => {
    setShowDateTimeModal(false);
    setShowReviewModal(true);
  };

  const handleSubmitReview = () => {
    setShowReviewModal(false);
    setShowConfirmationModal(true);
  };

  // Confirm appointment booking or update
  const handleConfirm = () => {
    const newAppointment = {
      service: services.find(s => s.id === selectedService).name,
      date: formatDate(selectedDate),
      time: selectedTime,
      note: note,
      address: '9002 J. Miranda Street Barangay Lao Lao Caridad Cavite City 4100 Philippines',
      bookedAt: new Date().toISOString()
    };

    // Remove previous booking if editing
    if (isEditing && bookedAppointment) {
      setBookedSlots(bookedSlots.filter(
        slot => !(slot.date === bookedAppointment.date && slot.time === bookedAppointment.time)
      ));
    }

    setBookedAppointment(newAppointment);

    setBookedSlots([...bookedSlots.filter(
      slot => !(isEditing && bookedAppointment && slot.date === bookedAppointment.date && slot.time === bookedAppointment.time)
    ), { date: newAppointment.date, time: newAppointment.time }]);

    setShowConfirmationModal(false);
    setIsEditing(false);
    setShowSuccessModal(true);
  };

  // Edit appointment button in modal
  const handleEditAppointment = () => {
    setIsEditing(true);
    setSelectedService(services.find(s => s.name === bookedAppointment.service)?.id || '');

    const dateParts = bookedAppointment.date.split('-');
    const appointmentDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, 1);
    setCurrentMonth(appointmentDate);
    setSelectedDate(parseInt(dateParts[2]));

    setSelectedTime(bookedAppointment.time);
    setNote(bookedAppointment.note);
    setShowAppointmentModal(false);
    setShowDateTimeModal(true);
  };

  // Check if user can cancel their appointment immediately within 24 hours of booking
  const canCancelImmediately = () => {
    if (!bookedAppointment) return false;
    const bookedTime = new Date(bookedAppointment.bookedAt);
    const now = new Date();
    const hoursSinceBooking = (now - bookedTime) / (1000 * 60 * 60);
    return hoursSinceBooking <= 24;
  };

  // Handle direct appointment cancellation within 24 hours
  const handleCancelAppointment = () => {
    if (canCancelImmediately()) {
      if (window.confirm('Are you sure you want to cancel this appointment? You will be able to book a new appointment after cancellation.')) {
        setBookedSlots(bookedSlots.filter(
          slot => !(slot.date === bookedAppointment.date && slot.time === bookedAppointment.time)
        ));
        setBookedAppointment(null);
        setSelectedService('');
        setSelectedDate(null);
        setSelectedTime('');
        setNote('');
        setShowAppointmentModal(false);
        alert('Appointment cancelled successfully. You can now book a new appointment.');
      }
    }
  };

  // Show modal to request cancellation after 24h cancellation window
  const handleRequestCancel = () => {
    setShowAppointmentModal(false);
    setShowCancelRequestModal(true);
  };

  // Submit cancellation request notification (here only alert for demo)
  const handleSubmitCancelRequest = () => {
    alert('Your cancellation request has been sent to the admin. You will be contacted shortly.');
    setShowCancelRequestModal(false);
    setCancelReason('');
  };

  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth(currentMonth);

  return (
    <div className="min-h-screen bg-blue-200 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Placeholder for top image banner */}
          <div className="bg-red-400 h-32 rounded-lg mb-6"></div>

          {/* Info card with contact details */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-center mb-4">CAVITE POSITIVE ACTION GROUP THE JCH ADVOCAY INC.</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                <span>9002 J. Miranda Street Barangay Lao Lao Caridad Cavite City 4100 Philippines, Cavite, Philippines, 4100</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold">📞</span>
                <span>(046) 542 9246</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold">✉️</span>
                <span>cavitepositiveactiongroup@outlook.com</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-1 flex-shrink-0" />
                <span>Monday-Friday | 9 AM - 5:30 PM</span>
              </div>
            </div>
          </div>

          {/* Display request button or booked appointment summary */}
          {!bookedAppointment ? (
            <button
              onClick={() => setShowServiceModal(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
            >
              REQUEST SERVICE
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <Calendar className="w-5 h-5" />
                  <span className="font-semibold">You have an upcoming appointment</span>
                </div>
                <div className="text-sm text-green-700">
                  {bookedAppointment.service} - {bookedAppointment.time} on {new Date(bookedAppointment.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <button
                onClick={() => setShowAppointmentModal(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
              >
                VIEW APPOINTMENT
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Select Service */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 border border-green-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Request service</h3>
              <button onClick={() => setShowServiceModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 mb-6">
              {services.map(service => (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service.id)}
                  className={`w-full ${service.color} hover:opacity-90 text-white font-semibold py-3 rounded-lg transition`}
                >
                  {service.name}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm mb-4">
              <Clock className="w-4 h-4" />
              <span>Monday-Friday | 9 AM - 5:30 PM</span>
            </div>
            <button
              onClick={() => setShowServiceModal(false)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
            >
              REQUEST SERVICE
            </button>
          </div>
        </div>
      )}

      {/* Modal: Select Date & Time */}
      {showDateTimeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{isEditing ? 'Edit' : 'Request'} date & time</h3>
              <button onClick={() => {
                setShowDateTimeModal(false);
                setIsEditing(false);
              }} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Calendar header and navigation */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-3">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  className="text-gray-600 hover:text-gray-800"
                >
                  ←
                </button>
                <span className="font-semibold">{monthYear}</span>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  className="text-gray-600 hover:text-gray-800"
                >
                  →
                </button>
              </div>

              {/* Weekday labels */}
              <div className="grid grid-cols-7 gap-1 mb-2 text-xs text-center font-semibold text-gray-600">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(day)}
                    disabled={!day}
                    className={`aspect-square text-sm rounded ${
                      day === selectedDate
                        ? 'bg-blue-500 text-white'
                        : day
                        ? 'hover:bg-gray-100 text-gray-700'
                        : 'text-transparent cursor-default'
                    }`}
                  >
                    {day || ''}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-gray-600 mb-3">All times are in Asia/Manila (UTC+08)</div>

            {/* Time selection grid */}
            <div className="grid grid-cols-4 gap-2 mb-4 max-h-48 overflow-y-auto">
              {timeSlots.map(time => {
                const isBooked = selectedDate ? isSlotBooked(formatDate(selectedDate), time) : false;
                return (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    disabled={isBooked || !selectedDate}
                    className={`text-xs py-2 px-1 rounded font-medium transition ${
                      selectedTime === time
                        ? 'bg-green-600 text-white'
                        : isBooked
                        ? 'bg-red-300 text-red-800 cursor-not-allowed'
                        : selectedDate
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div>{time.split(' ')[0]}</div>
                    <div className="text-xs">{isBooked ? 'Booked' : 'Available'}</div>
                  </button>
                );
              })}
            </div>

            {/* Book appointment button */}
            <button
              onClick={handleBookAppointment}
              disabled={!selectedDate || !selectedTime}
              className={`w-full font-semibold py-3 rounded-lg mb-2 transition ${
                selectedDate && selectedTime
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isEditing ? 'UPDATE APPOINTMENT' : 'BOOK APPOINTMENT'}
            </button>

            {/* Cancel button */}
            <button
              onClick={() => {
                setShowDateTimeModal(false);
                setIsEditing(false);
              }}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Modal: Review request */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Review request</h3>
              <button onClick={() => setShowReviewModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold mb-2">Date & Address</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 mt-1" />
                  <div>
                    <div className="font-medium">{selectedTime} - {getNextHalfHour(selectedTime)}</div>
                    <div className="text-gray-600">{new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1" />
                  <div>
                    <div>9002 J. Miranda Street Barangay Lao Lao Caridad Cavite City 4100 Philippines</div>
                    <div className="text-gray-600">Cavite, Philippines</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold mb-2">Note</h4>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Let Cavite Positive Action Group The Jch Advocacy Inc know if you have a special request."
                className="w-full border border-gray-300 rounded-lg p-3 text-sm h-32 resize-none focus:outline-none focus:border-green-500"
              />
            </div>

            <button
              onClick={handleSubmitReview}
              className="w-full bg-red-300 hover:bg-red-400 text-red-900 font-semibold py-3 rounded-lg transition"
            >
              SUBMIT
            </button>
          </div>
        </div>
      )}

      {/* Modal: Confirmation */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{isEditing ? 'Update' : 'Confirm'} Appointment</h3>
              <button onClick={() => setShowConfirmationModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold mb-2">Date & Address</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 mt-1" />
                  <div>
                    <div className="font-medium">{selectedTime} - {getNextHalfHour(selectedTime)}</div>
                    <div className="text-gray-600">{new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1" />
                  <div>
                    <div>9002 J. Miranda Street Barangay Lao Lao Caridad Cavite City 4100 Philippines</div>
                    <div className="text-gray-600">Cavite, Philippines</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold mb-2">Note</h4>
              <div className="text-sm text-gray-700">{note || 'No message provided'}</div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmationModal(false)}
                className="flex-1 bg-red-300 hover:bg-red-400 text-red-900 font-semibold py-3 rounded-lg transition"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
              >
                CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Success */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Success!</h3>
              <button onClick={() => setShowSuccessModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <p className="text-lg font-semibold mb-2">
                {isEditing ? 'Appointment Updated!' : 'Appointment Booked!'}
              </p>
              <p className="text-sm text-gray-600">
                Your appointment has been {isEditing ? 'updated' : 'scheduled'} successfully.
              </p>
            </div>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                setShowAppointmentModal(true);
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
            >
              VIEW APPOINTMENT
            </button>
          </div>
        </div>
      )}

      {/* Modal: Appointment Details */}
      {showAppointmentModal && bookedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Scheduled Appointment</h3>
              <button onClick={() => setShowAppointmentModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold mb-2">Service</h4>
              <div className="text-sm text-gray-700 mb-4">{bookedAppointment.service}</div>

              <h4 className="font-semibold mb-2">Date & Address</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 mt-1" />
                  <div>
                    <div className="font-medium">{bookedAppointment.time} - {getNextHalfHour(bookedAppointment.time)}</div>
                    <div className="text-gray-600">{new Date(bookedAppointment.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1" />
                  <div>
                    <div>{bookedAppointment.address}</div>
                    <div className="text-gray-600">Cavite, Philippines</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold mb-2">Note</h4>
              <div className="text-sm text-gray-700">{bookedAppointment.note || 'No additional notes'}</div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleEditAppointment}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                EDIT APPOINTMENT
              </button>

              {canCancelImmediately() ? (
                <>
                  <button
                    onClick={handleCancelAppointment}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition"
                  >
                    CANCEL APPOINTMENT
                  </button>
                  <div className="flex items-start gap-2 text-xs text-green-700 bg-green-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>You can cancel this appointment directly within 24 hours of booking.</span>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={handleRequestCancel}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    REQUEST CANCELLATION
                  </button>
                  <div className="flex items-start gap-2 text-xs text-orange-700 bg-orange-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>The 24-hour cancellation period has passed. Please contact admin to request cancellation.</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Request Cancelation */}
      {showCancelRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Request Cancellation</h3>
              <button onClick={() => setShowCancelRequestModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Since 24 hours have passed since booking, please provide a reason for cancellation. An admin will review your request.
              </p>

              <h4 className="font-semibold mb-2">Reason for Cancellation</h4>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please explain why you need to cancel this appointment..."
                className="w-full border border-gray-300 rounded-lg p-3 text-sm h-32 resize-none focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2 text-xs text-orange-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Your request will be sent to the admin. They will contact you at your registered email or phone number.</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelRequestModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
              >
                BACK
              </button>
              <button
                onClick={handleSubmitCancelRequest}
                disabled={!cancelReason.trim()}
                className={`flex-1 font-semibold py-3 rounded-lg transition ${
                  cancelReason.trim()
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                SUBMIT REQUEST
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper: Add 30 minutes to time string and return formatted time string (e.g., "10:00 AM" -> "10:30 AM")
function getNextHalfHour(time) {
  const [hourMin, ampm] = time.split(' ');
  let [hours, minutes] = hourMin.split(':').map(Number);

  minutes += 30;
  if (minutes >= 60) {
    hours += 1;
    minutes -= 60;
  }
  // handle 12 hour clock rollover
  let newAmPm = ampm;
  if (hours > 12) {
    hours -= 12;
    newAmPm = (ampm === 'AM') ? 'PM' : 'AM';
  } else if (hours === 12 && minutes === 0) {
    newAmPm = (ampm === 'AM') ? 'PM' : 'AM';
  }

  const minStr = minutes.toString().padStart(2, '0');
  return `${hours}:${minStr} ${newAmPm}`;
}

export default ScheduleSystem;