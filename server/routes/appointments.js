// routes/appointments.js - USER ONLY appointment routes (FIXED)
import express from 'express';
import Appointment from '../models/appointment.js';
import { isAuthenticated, isUserRole } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// GET BOOKED SLOTS - Public (no auth required)
// ============================================
router.get('/booked-slots', async (req, res) => {
  try {
    console.log('Fetching booked slots for calendar');
    
    const bookedSlots = await Appointment.find({ 
      status: { $in: ['pending', 'confirmed'] } 
    }).select('date time -_id');

    res.json(bookedSlots);
  } catch (err) {
    console.error('Error fetching booked slots:', err);
    res.status(500).json({ error: 'Failed to fetch booked slots' });
  }
});

// ============================================
// GET USER'S APPOINTMENTS - User Only
// ✅ FIXED: Added assignedCaseManager population
// ============================================
router.get('/my-appointments', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Fetching appointments for user: ${userId}`);
    
    const currentAppointment = await Appointment.findOne({
      user: userId,
      status: { $in: ['pending', 'confirmed'] }
    })
    .populate('user', 'name email username')
    .populate('assignedCaseManager', 'name email username') // ✅ FIXED: Added case manager population
    .populate('assignedBy', 'name username')
    .sort({ createdAt: -1 });

    const allAppointments = await Appointment.find({ user: userId })
      .populate('user', 'name email username')
      .populate('assignedCaseManager', 'name email username') // ✅ FIXED: Added case manager population
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
    console.error('Error fetching user appointments:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// ============================================
// CREATE NEW APPOINTMENT - User Only
// ✅ FIXED: Better validation and error messages
// ============================================
router.post('/', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const userId = req.user.id;
    const { service, date, time, note } = req.body;

    console.log(`User ${userId} attempting to book appointment for ${date} at ${time}`);

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

    // Create appointment
    const appointment = new Appointment({
      user: userId,
      service,
      date,
      time,
      note: note || '',
      status: 'pending',
      bookedAt: new Date()
    });

    await appointment.save();
    
    // ✅ FIXED: Populate all fields including case manager
    await appointment.populate([
      { path: 'user', select: 'name email username' },
      { path: 'assignedCaseManager', select: 'name email username' },
      { path: 'assignedBy', select: 'name username' }
    ]);

    console.log(`✅ Appointment created: ${appointment._id}`);
    res.status(201).json(appointment);
  } catch (err) {
    console.error('Error creating appointment:', err);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// ============================================
// UPDATE APPOINTMENT - User Only
// ✅ FIXED: Better validation and case manager preservation
// ============================================
router.put('/:id', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const userId = req.user.id;
    const { service, date, time, note } = req.body;

    console.log(`User ${userId} attempting to update appointment ${req.params.id}`);

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

    await appointment.save();
    
    // ✅ FIXED: Populate all fields including case manager
    await appointment.populate([
      { path: 'user', select: 'name email username' },
      { path: 'assignedCaseManager', select: 'name email username' },
      { path: 'assignedBy', select: 'name username' }
    ]);

    console.log(`✅ Appointment ${req.params.id} updated`);
    res.json(appointment);
  } catch (err) {
    console.error('Error updating appointment:', err);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// ============================================
// CANCEL APPOINTMENT (within 24 hours) - User Only
// ============================================
router.delete('/:id', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`User ${userId} attempting to cancel appointment ${req.params.id}`);

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

    console.log(`✅ Appointment ${req.params.id} cancelled by user (within 24hrs)`);
    res.json({ 
      message: 'Appointment cancelled successfully',
      deletedAppointment: appointment
    });
  } catch (err) {
    console.error('Error cancelling appointment:', err);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// ============================================
// REQUEST CANCELLATION (after 24 hours) - User Only
// ============================================
router.post('/:id/cancel-request', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const userId = req.user.id;
    const { reason } = req.body;

    console.log(`User ${userId} submitting cancel request for appointment ${req.params.id}`);

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Please provide a reason for cancellation' 
      });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      user: userId
    });

    if (!appointment) {
      return res.status(404).json({ 
        error: 'Appointment not found or you do not have permission to request cancellation' 
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
        error: 'Cancellation request has already been submitted. Please wait for admin response.' 
      });
    }

    appointment.cancelRequest = {
      requested: true,
      reason: reason.trim(),
      requestedAt: new Date()
    };

    await appointment.save();
    
    // ✅ FIXED: Populate all fields
    await appointment.populate([
      { path: 'user', select: 'name email username' },
      { path: 'assignedCaseManager', select: 'name email username' },
      { path: 'assignedBy', select: 'name username' }
    ]);

    console.log(`✅ Cancel request submitted for appointment ${req.params.id}`);
    res.json({ 
      message: 'Cancellation request submitted successfully. Admin will review your request.',
      appointment 
    });
  } catch (err) {
    console.error('Error submitting cancel request:', err);
    res.status(500).json({ error: 'Failed to submit cancellation request' });
  }
});

// ============================================
// GET APPOINTMENT HISTORY - User Only
// ✅ FIXED: Added case manager population
// ============================================
router.get('/history', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Fetching appointment history for user: ${userId}`);

    const history = await Appointment.find({
      user: userId,
      status: { $in: ['completed', 'cancelled'] }
    })
    .populate('user', 'name email username')
    .populate('assignedCaseManager', 'name email username') // ✅ FIXED: Added case manager population
    .populate('assignedBy', 'name username')
    .populate('sessionTracking.sessionNotes.caseManagerId', 'name username')
    .sort({ createdAt: -1 });

    console.log(`✅ Found ${history.length} history items for user ${userId}`);
    res.json(history);
  } catch (err) {
    console.error('Error fetching appointment history:', err);
    res.status(500).json({ error: 'Failed to fetch appointment history' });
  }
});

// ============================================
// CHECK SLOT AVAILABILITY - Public
// ============================================
router.get('/check-slot/:date/:time', async (req, res) => {
  try {
    const { date, time } = req.params;

    console.log(`Checking slot availability: ${date} at ${time}`);

    const existingAppointment = await Appointment.findOne({
      date,
      time,
      status: { $in: ['pending', 'confirmed'] }
    });

    const isAvailable = !existingAppointment;

    res.json({ 
      available: isAvailable,
      date,
      time
    });
  } catch (err) {
    console.error('Error checking slot availability:', err);
    res.status(500).json({ error: 'Failed to check slot availability' });
  }
});

export default router;