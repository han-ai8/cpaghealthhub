// routes/adminAppointmentRoutes.js - COMPLETE WITH HIV STATUS FIX
import express from 'express';
import mongoose from 'mongoose';
import Appointment from '../models/appointment.js';
import User from '../models/User.js';
import { isAuthenticated, isCaseManager, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// GET ALL APPOINTMENTS - Admin Only
// ============================================
router.get('/appointments', isAuthenticated, isAdmin, async (req, res) => {
  try {
    console.log('📋 Admin fetching all appointments');

    const appointments = await Appointment.find()
      .populate('user', 'name email username fullName age gender location')
      .populate('assignedCaseManager', 'name username email')
      .populate('assignedBy', 'name username')
      .populate('sessionTracking.sessionNotes.caseManagerId', 'name username')
      .populate('hivStatus.confirmedBy', 'name username')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${appointments.length} appointments`);
    res.json(appointments);
  } catch (err) {
    console.error('❌ Error fetching appointments:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// ============================================
// GET AVAILABLE CASE MANAGERS WITH WORKLOAD - Admin Only
// ============================================
router.get('/appointments/case-managers/available', isAuthenticated, isAdmin, async (req, res) => {
  try {
    console.log('👥 Fetching case managers with workload info');

    const caseManagers = await User.find({ 
      role: 'case_manager',
      isActive: true
    }).select('name username email').lean();

    console.log(`Found ${caseManagers.length} case managers in database`);

    const MAX_APPOINTMENTS = 5;

    const workloadData = await Promise.all(
      caseManagers.map(async (cm) => {
        const activeCount = await Appointment.countDocuments({
          assignedCaseManager: cm._id,
          status: { $in: ['pending', 'confirmed'] }
        });

        const totalCount = await Appointment.countDocuments({
          assignedCaseManager: cm._id
        });

        const completedCount = await Appointment.countDocuments({
          assignedCaseManager: cm._id,
          status: 'completed'
        });

        console.log(`📊 ${cm.name || cm.username}: Active=${activeCount}, Total=${totalCount}, Completed=${completedCount}`);

        const remainingSlots = MAX_APPOINTMENTS - activeCount;
        const isAvailable = activeCount < MAX_APPOINTMENTS;

        return {
          _id: cm._id,
          name: cm.name,
          username: cm.username,
          email: cm.email,
          activeAppointments: activeCount,
          totalAppointments: totalCount,
          completedAppointments: completedCount,
          remainingSlots: remainingSlots,
          isAvailable: isAvailable,
          workload: {
            active: activeCount,
            total: totalCount,
            completed: completedCount
          }
        };
      })
    );

    workloadData.sort((a, b) => a.activeAppointments - b.activeAppointments);

    console.log('✅ Case Manager Summary:');
    workloadData.forEach(cm => {
      console.log(`   ${cm.name}: ${cm.activeAppointments}/${MAX_APPOINTMENTS} - ${cm.isAvailable ? '✅ Available' : '❌ At Capacity'}`);
    });

    res.json(workloadData);
  } catch (err) {
    console.error('❌ Error fetching case managers:', err);
    res.status(500).json({ 
      error: 'Failed to fetch case managers',
      details: err.message 
    });
  }
});

// ============================================
// RESCHEDULE APPOINTMENT - Case Manager/Admin
// ============================================
router.put('/appointments/:id/reschedule', isAuthenticated, isCaseManager, async (req, res) => {
  try {
    const { date, time, note } = req.body;
    const userId = req.user.id;
    const appointmentId = req.params.id;

    console.log(`📅 Rescheduling appointment ${appointmentId}`);
    console.log(`New date: ${date}, New time: ${time}`);

    // Validate required fields
    if (!date || !time) {
      return res.status(400).json({ 
        error: 'Date and time are required' 
      });
    }

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ 
        error: 'Appointment not found' 
      });
    }

    // Check permissions - case manager can only edit their own assignments
    const user = await User.findById(userId);
    if (user.role === 'case_manager') {
      if (!appointment.assignedCaseManager || 
          appointment.assignedCaseManager.toString() !== userId) {
        return res.status(403).json({ 
          error: 'You can only reschedule appointments assigned to you' 
        });
      }
    }

    // Check if appointment can be rescheduled
    if (appointment.programCompleted) {
      return res.status(400).json({ 
        error: 'Cannot reschedule completed programs' 
      });
    }

    // Check for time slot conflicts (excluding current appointment)
    const conflict = await Appointment.findOne({
      _id: { $ne: appointmentId }, // Exclude current appointment
      date,
      time,
      status: { $in: ['pending', 'confirmed', 'completed'] }
    }).populate('user', 'name username');

    if (conflict) {
      const conflictUser = conflict.user?.name || conflict.user?.username || 'Another user';
      console.log(`⚠️ Time slot conflict with ${conflictUser}`);
      return res.status(400).json({ 
        error: `This time slot is already booked by ${conflictUser}`,
        conflict: true,
        bookedBy: conflictUser
      });
    }

    // Validate date is not in the past
    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      return res.status(400).json({ 
        error: 'Cannot reschedule to a past date' 
      });
    }

    // Update appointment
    appointment.date = date;
    appointment.time = time;
    if (note !== undefined) {
      appointment.note = note;
    }

    await appointment.save();

    // Populate references
    await appointment.populate([
      { path: 'user', select: 'name email username fullName age gender location' },
      { path: 'assignedCaseManager', select: 'name username email' },
      { path: 'assignedBy', select: 'name username' },
      { path: 'sessionTracking.sessionNotes.caseManagerId', select: 'name username' }
    ]);

    console.log(`✅ Appointment ${appointmentId} rescheduled successfully`);

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      appointment
    });

  } catch (error) {
    console.error('❌ Error rescheduling appointment:', error);
    res.status(500).json({ 
      error: 'Failed to reschedule appointment',
      details: error.message
    });
  }
});

// ============================================
// GET APPOINTMENT STATISTICS - Admin Only
// ============================================
router.get('/appointments/stats/overview', isAuthenticated, isAdmin, async (req, res) => {
  try {
    console.log('📊 Fetching appointment statistics');

    const [
      totalCount,
      pendingCount,
      confirmedCount,
      completedCount,
      cancelledCount,
      psychosocialAssignedCount,
      psychosocialUnassignedCount,
      testingTotalCount,
      testingPendingCount,
      testingCompletedCount,
      todayCount
    ] = await Promise.all([
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'pending' }),
      Appointment.countDocuments({ status: 'confirmed' }),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
      Appointment.countDocuments({ 
        service: 'Psychosocial support and assistance',
        assignedCaseManager: { $ne: null } 
      }),
      Appointment.countDocuments({ 
        service: 'Psychosocial support and assistance',
        assignedCaseManager: null 
      }),
      Appointment.countDocuments({ service: 'Testing and Counseling' }),
      Appointment.countDocuments({ 
        service: 'Testing and Counseling',
        status: 'pending' 
      }),
      Appointment.countDocuments({ 
        service: 'Testing and Counseling',
        status: 'completed' 
      }),
      Appointment.countDocuments({
        date: new Date().toISOString().split('T')[0]
      })
    ]);

    const stats = {
      total: totalCount,
      pending: pendingCount,
      confirmed: confirmedCount,
      completed: completedCount,
      cancelled: cancelledCount,
      withCaseManager: psychosocialAssignedCount,
      withoutCaseManager: psychosocialUnassignedCount,
      testing: {
        total: testingTotalCount,
        pending: testingPendingCount,
        completed: testingCompletedCount
      },
      today: todayCount
    };

    console.log('✅ Statistics:', stats);
    res.json(stats);
  } catch (err) {
    console.error('❌ Error fetching statistics:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ============================================
// UPDATE HIV STATUS - Admin Only (FIXED ROUTE)
// ============================================
router.put('/appointments/:id/hiv-status', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const adminId = req.user.id;

    console.log('🔬 Admin updating HIV status:', {
      appointmentId: req.params.id,
      status,
      adminId
    });

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.service !== 'Testing and Counseling') {
      return res.status(400).json({ 
        error: 'HIV status can only be set for Testing and Counseling appointments' 
      });
    }

    if (!status || !['positive', 'negative'].includes(status)) {
      return res.status(400).json({ 
        error: 'Valid status (positive or negative) is required' 
      });
    }

    appointment.hivStatus = {
      status,
      confirmedBy: adminId,
      confirmedAt: new Date(),
      notes: notes || ''
    };

    // Auto-complete the appointment when HIV status is set
    if (appointment.status !== 'completed') {
      appointment.status = 'completed';
      appointment.completedAt = new Date();
      appointment.completedBy = adminId;
    }

    await appointment.save();

    await appointment.populate([
      { path: 'user', select: 'name email username' },
      { path: 'hivStatus.confirmedBy', select: 'name username' },
      { path: 'completedBy', select: 'name username' }
    ]);

    console.log('✅ HIV status updated successfully');

    res.json({
      success: true,
      message: 'HIV status updated and appointment completed',
      appointment
    });
  } catch (error) {
    console.error('❌ Error updating HIV status:', error);
    res.status(500).json({ 
      error: 'Failed to update HIV status',
      details: error.message
    });
  }
});



// ============================================
// CASE MANAGER PLANNER - Get assigned appointments with stats
// ============================================
router.get('/planner', isAuthenticated, isCaseManager, async (req, res) => {
  try {
    const caseManagerId = req.user.id;
    const { sortBy, status } = req.query;

    console.log(`📅 Fetching planner for case manager: ${caseManagerId}`);

    const query = { assignedCaseManager: caseManagerId };
    if (status) {
      query.status = status;
    }

    let appointments = await Appointment.find(query)
      .populate('user', 'name email username fullName age gender location')
      .populate('assignedBy', 'name username')
      .populate('sessionTracking.sessionNotes.caseManagerId', 'name username');

    if (sortBy === 'date') {
      appointments.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortBy === 'status') {
      appointments.sort((a, b) => a.status.localeCompare(b.status));
    } else {
      appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const stats = {
      total: appointments.length,
      pending: appointments.filter(a => a.status === 'pending').length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      ongoing: appointments.filter(a => ['pending', 'confirmed'].includes(a.status)).length
    };

    console.log(`✅ Found ${appointments.length} appointments for case manager`);
    res.json({ appointments, stats });
  } catch (err) {
    console.error('❌ Error fetching planner:', err);
    res.status(500).json({ error: 'Failed to fetch planner data' });
  }
});

// ============================================
// GET CASE MANAGER'S ASSIGNED APPOINTMENTS
// ============================================
router.get('/my-assigned', isAuthenticated, isCaseManager, async (req, res) => {
  try {
    const caseManagerId = req.user.id;
    console.log(`📋 Fetching assigned appointments for case manager: ${caseManagerId}`);

    const appointments = await Appointment.find({ 
      assignedCaseManager: caseManagerId 
    })
    .populate('user', 'name email username fullName age gender location')
    .populate('assignedBy', 'name username')
    .populate('assignedCaseManager', 'name username')
    .populate('sessionTracking.sessionNotes.caseManagerId', 'name username')
    .sort({ date: 1, time: 1 });

    console.log(`✅ Found ${appointments.length} appointments`);
    res.json(appointments);
  } catch (err) {
    console.error('❌ Error fetching case manager appointments:', err);
    res.status(500).json({ error: 'Failed to fetch assigned appointments' });
  }
});

// ============================================
// ASSIGN CASE MANAGER - Admin Only
// ============================================
router.put('/appointments/:id/assign', isAuthenticated, isAdmin, async (req, res) => {
  try {
    console.log('═══════════════════════════════════════════════════');
    console.log('📋 CASE MANAGER ASSIGNMENT REQUEST');
    console.log('═══════════════════════════════════════════════════');
    console.log('📍 Appointment ID:', req.params.id);
    console.log('👤 Admin User:', {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    });
    console.log('📦 Request Body:', req.body);
    
    const { caseManagerId } = req.body;
    const adminId = req.user.id;
    const appointmentId = req.params.id;

    if (!caseManagerId) {
      console.log('❌ FAILED: No case manager ID provided');
      return res.status(400).json({ 
        error: 'Case manager ID is required' 
      });
    }
    console.log('✅ Step 1: Case manager ID provided:', caseManagerId);

    if (!mongoose.Types.ObjectId.isValid(caseManagerId)) {
      console.log('❌ FAILED: Invalid case manager ID format');
      return res.status(400).json({ 
        error: 'Invalid case manager ID format' 
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      console.log('❌ FAILED: Invalid appointment ID format');
      return res.status(400).json({ 
        error: 'Invalid appointment ID format' 
      });
    }
    console.log('✅ Step 2: ID formats are valid');

    console.log('🔍 Looking up case manager in database...');
    const caseManager = await User.findOne({ 
      _id: caseManagerId, 
      role: 'case_manager' 
    });

    if (!caseManager) {
      console.log('❌ FAILED: Case manager not found or wrong role');
      console.log('Searched for ID:', caseManagerId);
      
      const userExists = await User.findById(caseManagerId);
      if (userExists) {
        console.log('⚠️  User exists but has role:', userExists.role);
        return res.status(400).json({ 
          error: `User found but role is '${userExists.role}', not 'case_manager'` 
        });
      }
      
      return res.status(404).json({ 
        error: 'Case manager not found. Please ensure the user has case_manager role.' 
      });
    }
    
    if (!caseManager.isActive) {
      console.log('❌ FAILED: Case manager account is inactive');
      return res.status(400).json({ 
        error: 'This case manager account is inactive' 
      });
    }
    
    console.log('✅ Step 3: Case manager found and active');
    console.log('   Name:', caseManager.name || caseManager.username);
    console.log('   Email:', caseManager.email);

    console.log('🔍 Looking up appointment in database...');
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      console.log('❌ FAILED: Appointment not found');
      console.log('Searched for ID:', appointmentId);
      return res.status(404).json({ 
        error: 'Appointment not found' 
      });
    }
    
    console.log('✅ Step 4: Appointment found');
    console.log('   User ID:', appointment.user);
    console.log('   Service:', appointment.service);
    console.log('   Date:', appointment.date);
    console.log('   Current Status:', appointment.status);
    console.log('   Currently Assigned:', appointment.assignedCaseManager || 'None');

    if (appointment.assignedCaseManager) {
      console.log('⚠️  Appointment already has a case manager assigned');
      console.log('   Current CM:', appointment.assignedCaseManager);
      console.log('   Will reassign to new CM');
    }

    console.log('💾 Updating appointment...');
    const oldStatus = appointment.status;
    
    appointment.assignedCaseManager = caseManagerId;
    appointment.assignedAt = new Date();
    appointment.assignedBy = adminId;
    
    if (appointment.status === 'pending') {
      appointment.status = 'confirmed';
      console.log('✅ Status auto-changed: pending → confirmed');
    }

    await appointment.save();
    console.log('✅ Step 6: Appointment saved to database');

    console.log('💾 Updating user assignedCaseManager field...');
    try {
      const userId = appointment.user;
      console.log('   User ID to update:', userId);
      
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { assignedCaseManager: caseManagerId },
        { new: true }
      ).select('username email assignedCaseManager');
      
      if (updatedUser) {
        console.log('✅ User assignedCaseManager updated successfully');
        console.log('   Username:', updatedUser.username);
        console.log('   Assigned CM:', updatedUser.assignedCaseManager);
      } else {
        console.log('⚠️  User not found for update, but appointment assigned');
      }
    } catch (userUpdateErr) {
      console.error('⚠️  Error updating user assignedCaseManager (non-critical):', userUpdateErr.message);
    }

    console.log('🔄 Populating referenced documents...');
    await appointment.populate([
      { path: 'user', select: 'name email username fullName age gender location' },
      { path: 'assignedCaseManager', select: 'name username email' },
      { path: 'assignedBy', select: 'name username' }
    ]);
    console.log('✅ Step 8: References populated');

    console.log('═══════════════════════════════════════════════════');
    console.log('🎉 ASSIGNMENT SUCCESSFUL!');
    console.log('═══════════════════════════════════════════════════');
    console.log('Appointment ID:', appointment._id);
    console.log('Assigned to:', appointment.assignedCaseManager.name || appointment.assignedCaseManager.username);
    console.log('Assigned by:', req.user.username);
    console.log('Status:', `${oldStatus} → ${appointment.status}`);
    console.log('═══════════════════════════════════════════════════');

    res.json({ 
      success: true,
      message: `Case manager ${caseManager.name || caseManager.username} assigned successfully!`,
      appointment 
    });
    
  } catch (err) {
    console.error('═══════════════════════════════════════════════════');
    console.error('❌ ASSIGNMENT ERROR');
    console.error('═══════════════════════════════════════════════════');
    console.error('Error Message:', err.message);
    console.error('Error Stack:', err.stack);
    console.error('Error Name:', err.name);
    console.error('═══════════════════════════════════════════════════');
    
    res.status(500).json({ 
      error: 'Failed to assign case manager',
      details: err.message,
      errorType: err.name
    });
  }
});

// ============================================
// UNASSIGN CASE MANAGER - Admin Only
// ============================================
router.put('/appointments/:id/unassign', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    console.log(`👤 Admin ${adminId} unassigning case manager from appointment ${req.params.id}`);

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    appointment.assignedCaseManager = null;
    appointment.assignedAt = null;
    appointment.assignedBy = null;
    
    if (appointment.status === 'confirmed') {
      appointment.status = 'pending';
    }

    await appointment.save();
    await appointment.populate('user', 'name email username');

    console.log(`✅ Case manager unassigned from appointment ${req.params.id}`);
    res.json(appointment);
  } catch (err) {
    console.error('❌ Error unassigning case manager:', err);
    res.status(500).json({ error: 'Failed to unassign case manager' });
  }
});

// ============================================
// UPDATE APPOINTMENT STATUS - Admin and Case Manager
// ============================================
router.put('/appointments/:id/status', isAuthenticated, isCaseManager, async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user.id;

    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const appointment = await Appointment.findById(req.params.id).populate('user');
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const user = await User.findById(userId);
    if (user.role === 'case_manager') {
      if (!appointment.assignedCaseManager || 
          appointment.assignedCaseManager.toString() !== userId) {
        return res.status(403).json({ 
          error: 'You can only update appointments assigned to you' 
        });
      }
    }

    appointment.status = status;

    const notificationService = req.app.get('notificationService');

    if (status === 'confirmed') {
      appointment.confirmedAt = new Date();
      await notificationService.notifyAppointmentConfirmed(
        appointment.user._id,
        appointment
      );
    } else if (status === 'cancelled') {
      appointment.cancelledAt = new Date();
      await notificationService.notifyAppointmentCancelled(
        appointment.user._id,
        appointment,
        'Your appointment has been cancelled by the administrator'
      );
    } else if (status === 'completed') {
      appointment.completedAt = new Date();
      appointment.completedBy = userId;
    }

    await appointment.save();
    await appointment.populate([
      { path: 'user', select: 'name email username' },
      { path: 'assignedCaseManager', select: 'name username email' },
      { path: 'completedBy', select: 'name username' }
    ]);

    console.log(`✅ Appointment status updated and notification sent`);
    res.json(appointment);
  } catch (err) {
    console.error('❌ Error updating appointment status:', err);
    res.status(500).json({ error: 'Failed to update appointment status' });
  }
});

// ============================================
// HANDLE CANCEL REQUEST - Admin Only
// ============================================
router.put('/appointments/:id/cancel-request', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { approved } = req.body;
    const adminId = req.user.id;

    console.log(`📋 Admin ${adminId} handling cancel request for appointment ${req.params.id}`);

    if (typeof approved !== 'boolean') {
      return res.status(400).json({ error: 'approved must be true or false' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (!appointment.cancelRequest?.requested) {
      return res.status(400).json({ error: 'No cancellation request found' });
    }

    if (approved) {
      appointment.status = 'cancelled';
      appointment.cancelRequest.approved = true;
    } else {
      appointment.cancelRequest.approved = false;
    }

    appointment.cancelRequest.processedBy = adminId;
    appointment.cancelRequest.processedAt = new Date();

    await appointment.save();
    await appointment.populate([
      { path: 'user', select: 'name email username' },
      { path: 'cancelRequest.processedBy', select: 'name username' }
    ]);

    console.log(`✅ Cancel request ${approved ? 'approved' : 'denied'} for appointment ${req.params.id}`);
    res.json(appointment);
  } catch (err) {
    console.error('❌ Error handling cancel request:', err);
    res.status(500).json({ error: 'Failed to handle cancel request' });
  }
});

// ============================================
// ADD SESSION NOTE - Case Manager Only
// ============================================
router.post('/appointments/:id/session-note', isAuthenticated, isCaseManager, async (req, res) => {
  try {
    const { notes, progress } = req.body;
    const caseManagerId = req.user.id;

    if (!notes) {
      return res.status(400).json({ error: 'Notes are required' });
    }

    const appointment = await Appointment.findById(req.params.id).populate('user');
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const user = await User.findById(caseManagerId);
    if (user.role === 'case_manager') {
      if (!appointment.assignedCaseManager || 
          appointment.assignedCaseManager.toString() !== caseManagerId) {
        return res.status(403).json({ 
          error: 'You can only add notes to appointments assigned to you' 
        });
      }
    }

    const sessionNote = {
      sessionNumber: appointment.sessionTracking.sessionNumber,
      date: appointment.date,
      time: appointment.time,
      notes,
      progress: progress || 'good',
      caseManagerId,
      createdAt: new Date()
    };

    appointment.sessionTracking.sessionNotes.push(sessionNote);
    appointment.sessionTracking.totalSessions += 1;
    appointment.sessionTracking.lastSessionDate = new Date();

    await appointment.save();

    const notificationService = req.app.get('notificationService');
    await notificationService.notifySessionScheduled(
      appointment.user._id,
      appointment,
      sessionNote
    );

    await appointment.populate([
      { path: 'user', select: 'name email username' },
      { path: 'sessionTracking.sessionNotes.caseManagerId', select: 'name username' }
    ]);

    console.log(`✅ Session note added and notification sent`);
    res.json(appointment);
  } catch (err) {
    console.error('❌ Error adding session note:', err);
    res.status(500).json({ error: 'Failed to add session note' });
  }
});

// ============================================
// DELETE APPOINTMENT - Admin Only
// ============================================
router.delete('/appointments/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    console.log(`🗑️ Admin deleting appointment ${req.params.id}`);

    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    console.log(`✅ Appointment ${req.params.id} deleted`);
    res.json({ message: 'Appointment deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting appointment:', err);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

// ============================================
// GET SATURDAY REQUESTS (Pending Approval)
// ============================================
router.get('/saturday-requests', isAuthenticated, isAdmin, async (req, res) => {
  try {
    console.log('📅 Fetching Saturday appointment requests');

    const saturdayRequests = await Appointment.find({
      'saturdayRequest.requested': true,
      'saturdayRequest.approved': null,
      status: 'pending'
    })
    .populate('user', 'name email username')
    .sort({ 'saturdayRequest.requestedAt': -1 });

    console.log(`✅ Found ${saturdayRequests.length} Saturday requests`);
    
    res.json({
      success: true,
      requests: saturdayRequests
    });
  } catch (err) {
    console.error('❌ Error fetching Saturday requests:', err);
    res.status(500).json({ error: 'Failed to fetch Saturday requests' });
  }
});

// ============================================
// APPROVE/REJECT SATURDAY REQUEST
// ============================================
router.post('/saturday-requests/:id/process', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { approved, adminNotes } = req.body;
    const adminId = req.user.id;
    const appointmentId = req.params.id;

    console.log(`📅 Processing Saturday request for appointment: ${appointmentId}`);
    console.log(`Decision: ${approved ? 'APPROVED' : 'REJECTED'}`);

    if (typeof approved !== 'boolean') {
      return res.status(400).json({
        error: 'Approved field is required and must be boolean'
      });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (!appointment.saturdayRequest?.requested) {
      return res.status(400).json({
        error: 'This appointment does not have a Saturday request'
      });
    }

    if (appointment.saturdayRequest.approved !== null) {
      return res.status(400).json({
        error: 'Saturday request has already been processed'
      });
    }

    appointment.saturdayRequest.approved = approved;
    appointment.saturdayRequest.processedBy = adminId;
    appointment.saturdayRequest.processedAt = new Date();
    appointment.saturdayRequest.adminNotes = adminNotes || '';

    if (!approved) {
      appointment.status = 'cancelled';
    }

    await appointment.save();
    await appointment.populate([
      { path: 'user', select: 'name email username' },
      { path: 'saturdayRequest.processedBy', select: 'name username' }
    ]);

    const message = approved 
      ? '✅ Saturday appointment request approved'
      : '❌ Saturday appointment request rejected';

    console.log(message);

    res.json({
      success: true,
      message,
      appointment
    });
  } catch (err) {
    console.error('❌ Error processing Saturday request:', err);
    res.status(500).json({
      error: 'Failed to process Saturday request',
      details: err.message
    });
  }
});

// ============================================
// GET ALL SATURDAY REQUESTS (including processed)
// ============================================
router.get('/saturday-requests/all', isAuthenticated, isAdmin, async (req, res) => {
  try {
    console.log('📅 Fetching all Saturday appointment requests');

    const allRequests = await Appointment.find({
      'saturdayRequest.requested': true
    })
    .populate('user', 'name email username')
    .populate('saturdayRequest.processedBy', 'name username')
    .sort({ 'saturdayRequest.requestedAt': -1 });

    const pending = allRequests.filter(r => r.saturdayRequest.approved === null);
    const approved = allRequests.filter(r => r.saturdayRequest.approved === true);
    const rejected = allRequests.filter(r => r.saturdayRequest.approved === false);

    res.json({
      success: true,
      requests: allRequests,
      stats: {
        total: allRequests.length,
        pending: pending.length,
        approved: approved.length,
        rejected: rejected.length
      }
    });
  } catch (err) {
    console.error('❌ Error fetching all Saturday requests:', err);
    res.status(500).json({ error: 'Failed to fetch Saturday requests' });
  }
});

export default router;