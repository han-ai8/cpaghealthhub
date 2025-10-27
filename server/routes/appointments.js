// routes/appointments.js - USER ONLY appointment routes (COMPLETE FIX)
import express from 'express';
import Appointment from '../models/appointment.js';
import { isAuthenticated, isUserRole } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// GET BOOKED SLOTS - Public (no auth required)
// ============================================
router.get('/booked-slots', async (req, res) => {
  try {
    console.log('📅 Fetching booked slots for calendar');

    const bookedSlots = await Appointment.find({ 
      status: { $in: ['pending', 'confirmed'] } 
    }).select('date time -_id');

    console.log(`✅ Found ${bookedSlots.length} booked slots`);
    res.json(bookedSlots);
  } catch (err) {
    console.error('❌ Error fetching booked slots:', err);
    res.status(500).json({ error: 'Failed to fetch booked slots' });
  }
});

// ============================================
// GET USER'S APPOINTMENTS - User Only
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
      all: allAppointments 
    });
  } catch (err) {
    console.error('❌ Error fetching user appointments:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// ============================================
// GET APPOINTMENT HISTORY - User Only
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
    .sort({ date: -1 });

    console.log(`✅ Found ${history.length} historical appointments`);
    res.json(history);
  } catch (err) {
    console.error('❌ Error fetching appointment history:', err);
    res.status(500).json({ error: 'Failed to fetch appointment history' });
  }
});

// ============================================
// CREATE NEW APPOINTMENT - User Only
// ✅ FIXED: Now properly handles psychosocialInfo
// ============================================
router.post('/', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const userId = req.user.id;
    const { service, date, time, note, psychosocialInfo } = req.body;

    console.log(`📝 User ${userId} attempting to book appointment for ${date} at ${time}`);
    console.log('Service:', service);
    console.log('PsychosocialInfo provided:', !!psychosocialInfo);

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

    // ✅ NEW: Validate psychosocialInfo for Psychosocial support
    if (service === 'Psychosocial support and assistance' && psychosocialInfo) {
      const { fullName, age, gender, location } = psychosocialInfo;
      
      if (!fullName || !age || !gender || !location) {
        return res.status(400).json({
          error: 'Psychosocial support requires: fullName, age, gender, and location'
        });
      }

      // Validate age
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
        return res.status(400).json({
          error: 'Age must be a number between 1 and 150'
        });
      }

      // Validate gender
      const validGenders = ['Male', 'Female', 'Other', 'Prefer not to say'];
      if (!validGenders.includes(gender)) {
        return res.status(400).json({
          error: 'Invalid gender value'
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

    // Check if slot is already booked
    const slotTaken = await Appointment.findOne({
      date,
      time,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (slotTaken) {
      return res.status(400).json({ 
        error: 'This time slot is already booked. Please select a different time.' 
      });
    }

    // Validate date is not in the past
    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      return res.status(400).json({ 
        error: 'Cannot book appointments in the past' 
      });
    }

    // ✅ FIXED: Create appointment with psychosocialInfo
    const appointmentData = {
      user: userId,
      service,
      date,
      time,
      note: note || '',
      status: 'pending',
      bookedAt: new Date()
    };

    // Add psychosocialInfo if provided
    if (service === 'Psychosocial support and assistance' && psychosocialInfo) {
      appointmentData.psychosocialInfo = {
        fullName: psychosocialInfo.fullName,
        age: parseInt(psychosocialInfo.age),
        gender: psychosocialInfo.gender,
        location: psychosocialInfo.location
      };
      console.log('✅ Psychosocial info added to appointment:', appointmentData.psychosocialInfo);
    }

    const appointment = new Appointment(appointmentData);
    await appointment.save();

    // Populate all fields
    await appointment.populate([
      { path: 'user', select: 'name email username' },
      { path: 'assignedCaseManager', select: 'name email username' },
      { path: 'assignedBy', select: 'name username' }
    ]);

    console.log(`✅ Appointment created: ${appointment._id}`);
    res.status(201).json(appointment);
  } catch (err) {
    console.error('❌ Error creating appointment:', err);
    res.status(500).json({ 
      error: 'Failed to create appointment',
      details: err.message 
    });
  }
});

// ============================================
// UPDATE APPOINTMENT - User Only
// ============================================
router.put('/:id', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const userId = req.user.id;
    const { service, date, time, note, psychosocialInfo } = req.body;

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

    // Cannot edit completed or cancelled appointments
    if (appointment.status === 'completed') {
      return res.status(400).json({ 
        error: 'Cannot edit completed appointments' 
      });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ 
        error: 'Cannot edit cancelled appointments' 
      });
    }

    // Validate date/time changes
    if ((date && date !== appointment.date) || (time && time !== appointment.time)) {
      const newDate = date || appointment.date;
      const newTime = time || appointment.time;

      // Check if new slot is available
      const slotTaken = await Appointment.findOne({
        _id: { $ne: req.params.id },
        date: newDate,
        time: newTime,
        status: { $in: ['pending', 'confirmed'] }
      });

      if (slotTaken) {
        return res.status(400).json({ 
          error: 'The selected time slot is already booked' 
        });
      }

      // Validate new date is not in the past
      if (date) {
        const appointmentDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (appointmentDate < today) {
          return res.status(400).json({ 
            error: 'Cannot reschedule to a past date' 
          });
        }
      }
    }

    // Validate service if being changed
    if (service) {
      const validServices = ['Testing and Counseling', 'Psychosocial support and assistance'];
      if (!validServices.includes(service)) {
        return res.status(400).json({ error: 'Invalid service type' });
      }
    }

    // Update fields
    if (service) appointment.service = service;
    if (date) appointment.date = date;
    if (time) appointment.time = time;
    if (note !== undefined) appointment.note = note;

    // ✅ NEW: Update psychosocialInfo if provided
    if (psychosocialInfo && appointment.service === 'Psychosocial support and assistance') {
      appointment.psychosocialInfo = {
        fullName: psychosocialInfo.fullName,
        age: parseInt(psychosocialInfo.age),
        gender: psychosocialInfo.gender,
        location: psychosocialInfo.location
      };
      console.log('✅ Updated psychosocial info');
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
// REQUEST CANCELLATION - User Only
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
        error: 'Cancellation request already submitted. Waiting for admin approval.' 
      });
    }

    appointment.cancelRequest = {
      requested: true,
      reason: reason || '',
      requestedAt: new Date()
    };

    await appointment.save();

    console.log(`✅ Cancellation requested for appointment ${req.params.id}`);
    res.json({ 
      message: 'Cancellation request submitted. An admin will review it shortly.',
      appointment 
    });
  } catch (err) {
    console.error('❌ Error requesting cancellation:', err);
    res.status(500).json({ error: 'Failed to request cancellation' });
  }
});

// ============================================
// CANCEL APPOINTMENT (within 24 hours) - User Only
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
        error: 'Appointment not found or you do not have permission to cancel it' 
      });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ error: 'Appointment is already cancelled' });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel completed appointments' });
    }

    // Check 24-hour window
    const bookedTime = new Date(appointment.bookedAt);
    const now = new Date();
    const hoursSinceBooking = (now - bookedTime) / (1000 * 60 * 60);

    if (hoursSinceBooking > 24) {
      return res.status(400).json({ 
        error: 'Cannot cancel appointment after 24 hours. Please request cancellation through the system.' 
      });
    }

    await Appointment.findByIdAndDelete(req.params.id);

    console.log(`✅ Appointment ${req.params.id} cancelled and deleted`);
    res.json({ message: 'Appointment cancelled successfully' });
  } catch (err) {
    console.error('❌ Error cancelling appointment:', err);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

export default router;