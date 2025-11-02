// routes/appointments.js - FIXED TO SAVE testingInfo FOR TESTING AND COUNSELING
import express from 'express';
import Appointment from '../models/appointment.js';
import { isAuthenticated, isUserRole } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// 🇵🇭 PHILIPPINE TIMEZONE HELPER FUNCTIONS
// ============================================
const getPhilippineDate = () => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
};

const isWeekend = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

const formatPhilippineDate = (date) => {
  return new Date(date).toLocaleString('en-US', { 
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

const normalizeDate = (dateString) => {
  // Parse date as local time to avoid timezone shifts
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// ============================================
// ✅ ENHANCED GET BOOKED SLOTS
// ============================================
router.get('/booked-slots', async (req, res) => {
  try {
    console.log('📅 Fetching ALL booked slots (including user names)');

    const appointments = await Appointment.find({ 
      status: { $in: ['pending', 'confirmed', 'completed'] }
    })
    .populate('user', 'name username')
    .populate('assignedCaseManager', 'name username')
    .select('date time status user assignedCaseManager _id')
    .lean();

    const bookedSlots = appointments.map(apt => ({
      _id: apt._id,
      date: apt.date,
      time: apt.time,
      status: apt.status,
      appointmentId: apt._id,
      userName: apt.user?.name || apt.user?.username || 'Unknown User',
      userId: apt.user?._id,
      caseManagerName: apt.assignedCaseManager?.name || apt.assignedCaseManager?.username,
      caseManagerId: apt.assignedCaseManager?._id
    }));

    console.log(`✅ Found ${bookedSlots.length} booked slots with user information`);
    res.json(bookedSlots);
  } catch (err) {
    console.error('❌ Error fetching booked slots:', err);
    res.status(500).json({ error: 'Failed to fetch booked slots' });
  }
});

// ============================================
// GET USER'S APPOINTMENTS
// ============================================
router.get('/my-appointments', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📋 Fetching appointments for user: ${userId}`);

    const currentAppointment = await Appointment.findOne({
      user: userId,
      status: { $in: ['pending', 'confirmed'] }
    })
    .populate('user', 'name email username')
    .populate('assignedCaseManager', 'name email username')
    .populate('assignedBy', 'name username')
    .sort({ createdAt: -1 });

    const allAppointments = await Appointment.find({ user: userId })
      .populate('user', 'name email username')
      .populate('assignedCaseManager', 'name email username')
      .populate('assignedBy', 'name username')
      .sort({ createdAt: -1 });

    console.log(`✅ Found appointments for user ${userId}:`, {
      current: currentAppointment ? 'Yes' : 'No',
      total: allAppointments.length,
      hasCaseManager: currentAppointment?.assignedCaseManager ? 'Yes' : 'No'
    });

    res.json({ 
      current: currentAppointment,
      all: allAppointments,
      philippineTime: getPhilippineDate()
    });
  } catch (err) {
    console.error('❌ Error fetching user appointments:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// ============================================
// GET APPOINTMENT HISTORY
// ============================================
router.get('/history', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📚 Fetching appointment history for user: ${userId}`);

    const history = await Appointment.find({
      user: userId,
      status: { $in: ['completed', 'cancelled'] }
    })
    .populate('user', 'name email username')
    .populate('assignedCaseManager', 'name email username')
    .populate('completedBy', 'name username')
    .populate('sessionTracking.sessionNotes.caseManagerId', 'name username')
    .sort({ date: -1 });

    console.log(`✅ Found ${history.length} historical appointments`);
    res.json(history);
  } catch (err) {
    console.error('❌ Error fetching appointment history:', err);
    res.status(500).json({ error: 'Failed to fetch appointment history' });
  }
});

// ============================================
// ✅ FIXED: CREATE NEW APPOINTMENT
// NOW PROPERLY SAVES testingInfo FOR TESTING AND COUNSELING
// ============================================
router.post('/', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const userId = req.user.id;
    const { service, date, time, note, psychosocialInfo, requestSaturday, saturdayReason } = req.body;

    console.log(`📝 User ${userId} attempting to book appointment for ${date} at ${time}`);
    console.log('Service:', service);
    console.log('Demographic data received:', psychosocialInfo);

    // Validate required fields
    if (!service || !date || !time) {
      return res.status(400).json({ 
        error: 'Service, date, and time are required' 
      });
    }

    // Validate service type
    const validServices = ['Testing and Counseling', 'Psychosocial support and assistance'];
    if (!validServices.includes(service)) {
      return res.status(400).json({ error: 'Invalid service type' });
    }

    // ✅ VALIDATE DEMOGRAPHIC INFO FOR BOTH SERVICES
    if (psychosocialInfo) {
      const { fullName, age, gender, location } = psychosocialInfo;
      
      if (!fullName || !age || !gender || !location) {
        return res.status(400).json({
          error: 'Please provide: fullName, age, gender, and location'
        });
      }

      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
        return res.status(400).json({
          error: 'Age must be a number between 1 and 150'
        });
      }

      const validGenders = ['Male', 'Female', 'Other', 'Prefer not to say'];
      if (!validGenders.includes(gender)) {
        return res.status(400).json({
          error: 'Invalid gender value'
        });
      }
    }

    // 🇵🇭 Check if date is weekend
    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();

    // Sunday is completely unavailable
    if (dayOfWeek === 0) {
      return res.status(400).json({
        error: '❌ Sundays are not available. Please select a weekday.',
        isWeekend: true,
        day: 'Sunday'
      });
    }

    // Saturday requires special request
    if (dayOfWeek === 6) {
      if (!requestSaturday) {
        return res.status(400).json({
          error: '⚠️ Saturday appointments require a special request.',
          isWeekend: true,
          day: 'Saturday',
          requiresRequest: true
        });
      }

      if (!saturdayReason || saturdayReason.trim().length < 10) {
        return res.status(400).json({
          error: 'Please provide a detailed reason (minimum 10 characters) for Saturday appointment.',
          requiresRequest: true
        });
      }
    }

    // Check for existing active appointment
    const existingAppointment = await Appointment.findOne({
      user: userId,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ 
        error: 'You already have an active appointment. Please cancel or complete it first.' 
      });
    }

    // ✅ STRICT SLOT AVAILABILITY CHECK
    const slotTaken = await Appointment.findOne({
      date,
      time,
      status: { $in: ['pending', 'confirmed', 'completed'] }
    })
    .populate('user', 'name username');

    if (slotTaken) {
      const bookedBy = slotTaken.user?.name || slotTaken.user?.username || 'Another user';
      return res.status(400).json({ 
        error: `This time slot is already booked by ${bookedBy}. Please select a different time.`,
        conflict: true,
        bookedBy: bookedBy
      });
    }

    // Validate date is not in the past
    const today = getPhilippineDate();
    today.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      return res.status(400).json({ 
        error: 'Cannot book appointments in the past' 
      });
    }

    // ✅ CREATE APPOINTMENT WITH PROPER FIELD NAMES
    const appointmentData = {
      user: userId,
      service,
      date,
      time,
      note: note || '',
      status: 'pending',
      bookedAt: getPhilippineDate(),
      saturdayRequest: dayOfWeek === 6 ? {
        requested: true,
        reason: saturdayReason,
        requestedAt: getPhilippineDate(),
        approved: null,
        processedBy: null,
        processedAt: null
      } : undefined
    };

    // ✅ KEY FIX: Save demographic data with correct field name based on service
    if (psychosocialInfo) {
      const demographicData = {
        fullName: psychosocialInfo.fullName,
        age: parseInt(psychosocialInfo.age),
        gender: psychosocialInfo.gender,
        location: psychosocialInfo.location
      };

      if (service === 'Testing and Counseling') {
        // ✅ FOR TESTING AND COUNSELING → Save as testingInfo
        appointmentData.testingInfo = demographicData;
        console.log('✅ Testing demographic info saved as testingInfo:', demographicData);
      } else if (service === 'Psychosocial support and assistance') {
        // ✅ FOR PSYCHOSOCIAL → Save as psychosocialInfo
        appointmentData.psychosocialInfo = demographicData;
        console.log('✅ Psychosocial info saved as psychosocialInfo:', demographicData);
      }
    }

    const appointment = new Appointment(appointmentData);
    await appointment.save();

    await appointment.populate([
      { path: 'user', select: 'name email username' },
      { path: 'assignedCaseManager', select: 'name email username' },
      { path: 'assignedBy', select: 'name username' }
    ]);

    const responseMessage = dayOfWeek === 6 
      ? '📅 Saturday appointment request submitted! Waiting for admin approval.'
      : '✅ Appointment created successfully!';

    console.log(`✅ Appointment created: ${appointment._id}`);
    console.log('✅ Saved data:', {
      service: appointment.service,
      testingInfo: appointment.testingInfo,
      psychosocialInfo: appointment.psychosocialInfo
    });

    res.status(201).json({
      ...appointment.toObject(),
      message: responseMessage,
      isSaturdayRequest: dayOfWeek === 6
    });
  } catch (err) {
    console.error('❌ Error creating appointment:', err);
    res.status(500).json({ 
      error: 'Failed to create appointment',
      details: err.message 
    });
  }
});

// ============================================
// UPDATE APPOINTMENT
// ============================================
router.put('/:id', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const userId = req.user.id;
    const { service, date, time, note, psychosocialInfo, requestSaturday, saturdayReason } = req.body;

    console.log(`📝 User ${userId} attempting to update appointment ${req.params.id}`);

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      user: userId
    });

    if (!appointment) {
      return res.status(404).json({ 
        error: 'Appointment not found or you do not have permission to edit it' 
      });
    }

    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(400).json({ 
        error: `Cannot edit ${appointment.status} appointments` 
      });
    }

    // Validate date/time changes
    if ((date && date !== appointment.date) || (time && time !== appointment.time)) {
      const newDate = date || appointment.date;
      const newTime = time || appointment.time;
      const newAppointmentDate = new Date(newDate);
      const dayOfWeek = newAppointmentDate.getDay();

      if (dayOfWeek === 0) {
        return res.status(400).json({
          error: '❌ Sundays are not available',
          isWeekend: true
        });
      }

      if (dayOfWeek === 6 && !requestSaturday) {
        return res.status(400).json({
          error: '⚠️ Saturday requires special request',
          requiresRequest: true
        });
      }

      const slotTaken = await Appointment.findOne({
        _id: { $ne: req.params.id },
        date: newDate,
        time: newTime,
        status: { $in: ['pending', 'confirmed', 'completed'] }
      })
      .populate('user', 'name username');

      if (slotTaken) {
        const bookedBy = slotTaken.user?.name || slotTaken.user?.username || 'Another user';
        return res.status(400).json({ 
          error: `The selected time slot is already booked by ${bookedBy}`,
          conflict: true,
          bookedBy: bookedBy
        });
      }

      if (date) {
        const today = getPhilippineDate();
        today.setHours(0, 0, 0, 0);
        newAppointmentDate.setHours(0, 0, 0, 0);

        if (newAppointmentDate < today) {
          return res.status(400).json({ 
            error: 'Cannot reschedule to a past date' 
          });
        }
      }
    }

    // Update fields
    if (service) appointment.service = service;
    if (date) appointment.date = date;
    if (time) appointment.time = time;
    if (note !== undefined) appointment.note = note;

    // ✅ UPDATE DEMOGRAPHIC INFO WITH CORRECT FIELD NAME
    if (psychosocialInfo) {
      const demographicData = {
        fullName: psychosocialInfo.fullName,
        age: parseInt(psychosocialInfo.age),
        gender: psychosocialInfo.gender,
        location: psychosocialInfo.location
      };

      if (appointment.service === 'Testing and Counseling') {
        appointment.testingInfo = demographicData;
        console.log('✅ Updated testingInfo');
      } else if (appointment.service === 'Psychosocial support and assistance') {
        appointment.psychosocialInfo = demographicData;
        console.log('✅ Updated psychosocialInfo');
      }
    }

    await appointment.save();

    await appointment.populate([
      { path: 'user', select: 'name email username' },
      { path: 'assignedCaseManager', select: 'name email username' },
      { path: 'assignedBy', select: 'name username' }
    ]);

    console.log(`✅ Appointment ${req.params.id} updated`);
    res.json(appointment);
  } catch (err) {
    console.error('❌ Error updating appointment:', err);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// ============================================
// REQUEST CANCELLATION
// ============================================
router.post('/:id/request-cancel', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const userId = req.user.id;
    const { reason } = req.body;

    console.log(`🚫 User ${userId} requesting cancellation for appointment ${req.params.id}`);

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      user: userId
    });

    if (!appointment) {
      return res.status(404).json({ 
        error: 'Appointment not found or you do not have permission' 
      });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ error: 'Appointment is already cancelled' });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel completed appointments' });
    }

    if (appointment.cancelRequest?.requested) {
      return res.status(400).json({ 
        error: 'Cancellation request already submitted.' 
      });
    }

    appointment.cancelRequest = {
      requested: true,
      reason: reason || '',
      requestedAt: getPhilippineDate()
    };

    await appointment.save();

    console.log(`✅ Cancellation requested for appointment ${req.params.id}`);
    res.json({ 
      message: 'Cancellation request submitted.',
      appointment 
    });
  } catch (err) {
    console.error('❌ Error requesting cancellation:', err);
    res.status(500).json({ error: 'Failed to request cancellation' });
  }
});

// ============================================
// CANCEL APPOINTMENT (within 24 hours ONLY)
// ============================================
router.delete('/:id', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`🗑️ User ${userId} attempting to cancel appointment ${req.params.id}`);

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      user: userId
    });

    if (!appointment) {
      return res.status(404).json({ 
        error: 'Appointment not found' 
      });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ error: 'Appointment is already cancelled' });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel completed appointments' });
    }

    const bookedTime = new Date(appointment.bookedAt);
    const now = getPhilippineDate();
    const hoursSinceBooking = (now - bookedTime) / (1000 * 60 * 60);

    if (hoursSinceBooking > 24) {
      return res.status(400).json({ 
        error: '⏰ Cannot cancel after 24 hours. Please request cancellation.',
        canCancel: false
      });
    }

    await Appointment.findByIdAndDelete(req.params.id);

    console.log(`✅ Appointment ${req.params.id} cancelled`);
    res.json({ 
      message: '✅ Appointment cancelled successfully',
      cancelledWithin24Hours: true 
    });
  } catch (err) {
    console.error('❌ Error cancelling appointment:', err);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

export default router;