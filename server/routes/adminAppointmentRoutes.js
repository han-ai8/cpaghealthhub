// routes/adminAppointmentRoutes.js - COMPLETE WITH HIV STATUS REMOVED
import express from 'express';
import mongoose from 'mongoose';
import Appointment from '../models/appointment.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { isAuthenticated, isCaseManager, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// GET ALL APPOINTMENTS - Admin Only
// ============================================
router.get('/appointments', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('user', 'name email username fullName age gender location')
      .populate('assignedCaseManager', 'name username email')
      .populate('assignedBy', 'name username')
      .populate('sessionTracking.sessionNotes.caseManagerId', 'name username')
      .sort({ createdAt: -1 });

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// ============================================
// GET AVAILABLE CASE MANAGERS WITH WORKLOAD - Admin Only
// ============================================
router.get('/appointments/case-managers/available', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const caseManagers = await User.find({ 
      role: 'case_manager',
      isActive: true
    }).select('name username email').lean();


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

    workloadData.forEach(cm => {
    });

    res.json(workloadData);
  } catch (err) {
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

    if (!date || !time) {
      return res.status(400).json({ 
        error: 'Date and time are required' 
      });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ 
        error: 'Appointment not found' 
      });
    }

    const user = await User.findById(userId);
    if (user.role === 'case_manager') {
      if (!appointment.assignedCaseManager || 
          appointment.assignedCaseManager.toString() !== userId) {
        return res.status(403).json({ 
          error: 'You can only reschedule appointments assigned to you' 
        });
      }
    }

    if (appointment.programCompleted) {
      return res.status(400).json({ 
        error: 'Cannot reschedule completed programs' 
      });
    }

    const conflict = await Appointment.findOne({
      _id: { $ne: appointmentId },
      date,
      time,
      status: { $in: ['pending', 'confirmed', 'completed'] }
    }).populate('user', 'name username');

    if (conflict) {
      const conflictUser = conflict.user?.name || conflict.user?.username || 'Another user';
      return res.status(400).json({ 
        error: `This time slot is already booked by ${conflictUser}`,
        conflict: true,
        bookedBy: conflictUser
      });
    }

    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      return res.status(400).json({ 
        error: 'Cannot reschedule to a past date' 
      });
    }

    appointment.date = date;
    appointment.time = time;
    if (note !== undefined) {
      appointment.note = note;
    }

    await appointment.save();

    await appointment.populate([
      { path: 'user', select: 'name email username fullName age gender location' },
      { path: 'assignedCaseManager', select: 'name username email' },
      { path: 'assignedBy', select: 'name username' },
      { path: 'sessionTracking.sessionNotes.caseManagerId', select: 'name username' }
    ]);


    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      appointment
    });

  } catch (error) {
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
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ============================================
// CASE MANAGER PLANNER - Get assigned appointments with stats
// ============================================
router.get('/planner', isAuthenticated, isCaseManager, async (req, res) => {
  try {
    const caseManagerId = req.user.id;
    const { sortBy, status } = req.query;


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
    res.json({ appointments, stats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch planner data' });
  }
});

// ============================================
// GET CASE MANAGER'S ASSIGNED APPOINTMENTS
// ============================================
router.get('/my-assigned', isAuthenticated, isCaseManager, async (req, res) => {
  try {
    const caseManagerId = req.user.id;

    const appointments = await Appointment.find({ 
      assignedCaseManager: caseManagerId 
    })
    .populate('user', 'name email username fullName age gender location')
    .populate('assignedBy', 'name username')
    .populate('assignedCaseManager', 'name username')
    .populate('sessionTracking.sessionNotes.caseManagerId', 'name username')
    .sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assigned appointments' });
  }
});


// Update the ASSIGN CASE MANAGER route
router.put('/appointments/:id/assign', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { caseManagerId } = req.body;
    const adminId = req.user.id;
    const appointmentId = req.params.id;

    if (!caseManagerId) {
      return res.status(400).json({ 
        error: 'Case manager ID is required' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(caseManagerId)) {
      return res.status(400).json({ 
        error: 'Invalid case manager ID format' 
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ 
        error: 'Invalid appointment ID format' 
      });
    }
  
    const caseManager = await User.findOne({ 
      _id: caseManagerId, 
      role: 'case_manager' 
    });

    if (!caseManager) {
      const userExists = await User.findById(caseManagerId);
      if (userExists) {
        return res.status(400).json({ 
          error: `User found but role is '${userExists.role}', not 'case_manager'` 
        });
      }
      
      return res.status(404).json({ 
        error: 'Case manager not found. Please ensure the user has case_manager role.' 
      });
    }
    
    if (!caseManager.isActive) {
      return res.status(400).json({ 
        error: 'This case manager account is inactive' 
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ 
        error: 'Appointment not found' 
      });
    }

    const userId = appointment.user;
    const oldCaseManagerId = appointment.assignedCaseManager;
    
    // Update appointment
    const oldStatus = appointment.status;
    
    appointment.assignedCaseManager = caseManagerId;
    appointment.assignedAt = new Date();
    appointment.assignedBy = adminId;
    
    if (appointment.status === 'pending') {
      appointment.status = 'confirmed';
    }

    await appointment.save();

    console.log('✅ Appointment updated with new case manager');
    
    // ✅ UPDATE USER'S ASSIGNED CASE MANAGER
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { assignedCaseManager: caseManagerId },
        { new: true }
      ).select('username email assignedCaseManager');
      
      if (updatedUser) {
        console.log('✅ User assignedCaseManager updated to:', caseManagerId);
      } else {
        console.log('⚠️ User not found for update');
      }
    } catch (userUpdateErr) {
      console.error('⚠️ Failed to update user assignedCaseManager:', userUpdateErr);
    }

    // ✅ FIX: UPDATE OR CREATE CONVERSATION
    try {
      // Check if there's an existing conversation with the OLD case manager
      if (oldCaseManagerId) {
        const oldConversation = await Conversation.findOne({
          userId: userId,
          caseManagerId: oldCaseManagerId
        });

        if (oldConversation) {
          console.log('📝 Found old conversation with previous case manager');
          
          // Archive the old conversation
          await Conversation.findByIdAndUpdate(oldConversation._id, {
            status: 'archived'
          });
          
          console.log('✅ Old conversation archived');
        }
      }

      // Check if there's already a conversation with the NEW case manager
      let newConversation = await Conversation.findOne({
        userId: userId,
        caseManagerId: caseManagerId
      });

      if (newConversation) {
        console.log('📝 Found existing conversation with new case manager');
        
        // Reactivate it if archived
        if (newConversation.status === 'archived') {
          newConversation.status = 'active';
          await newConversation.save();
          console.log('✅ Conversation reactivated');
        }
      } else {
        // Create a new conversation
        newConversation = await Conversation.create({
          userId: userId,
          caseManagerId: caseManagerId,
          lastMessage: 'New case manager assigned',
          lastMessageTime: new Date(),
          status: 'active',
          unreadCount: {
            user: 0,
            caseManager: 0
          }
        });
        
        console.log('✅ New conversation created with new case manager');
      }

      // ✅ Emit socket notification to both user and case manager
      const io = req.app.get('io');
      if (io) {
        // Notify user about case manager assignment
        io.to(userId.toString()).emit('caseManagerAssigned', {
          caseManager: {
            id: caseManagerId,
            name: caseManager.name || caseManager.username
          },
          message: 'A case manager has been assigned to you'
        });

        // Notify case manager about new assignment
        io.to(caseManagerId.toString()).emit('userAssigned', {
          user: {
            id: userId,
            username: updatedUser?.username
          },
          appointment: appointment
        });

        console.log('✅ Socket notifications sent');
      }
    } catch (conversationErr) {
      console.error('⚠️ Failed to update conversation:', conversationErr);
      // Don't fail the whole request if conversation update fails
    }

    await appointment.populate([
      { path: 'user', select: 'name email username fullName age gender location' },
      { path: 'assignedCaseManager', select: 'name username email' },
      { path: 'assignedBy', select: 'name username' }
    ]);

    res.json({ 
      success: true,
      message: `Case manager ${caseManager.name || caseManager.username} assigned successfully!`,
      appointment 
    });
    
  } catch (err) {
    console.error('❌ Assign case manager error:', err);
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

    res.json(appointment);
  } catch (err) {
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

    res.json(appointment);
  } catch (err) {
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
    res.json(appointment);
  } catch (err) {
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

    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add session note' });
  }
});

// ============================================
// DELETE APPOINTMENT - Admin Only
// ============================================
router.delete('/appointments/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {

    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ message: 'Appointment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

// ============================================
// GET SATURDAY REQUESTS (Pending Approval)
// ============================================
router.get('/saturday-requests', isAuthenticated, isAdmin, async (req, res) => {
  try {

    const saturdayRequests = await Appointment.find({
      'saturdayRequest.requested': true,
      'saturdayRequest.approved': null,
      status: 'pending'
    })
    .populate('user', 'name email username')
    .sort({ 'saturdayRequest.requestedAt': -1 });
    
    res.json({
      success: true,
      requests: saturdayRequests
    });
  } catch (err) {

    res.status(500).json({ error: 'Failed to fetch Saturday requests' });
  }
});

// ============================================
// APPROVE/REJECT SATURDAY REQUEST WITH ADMIN RESPONSE
// ============================================
router.post('/saturday-requests/:id/process', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { approved, adminNotes, adminResponse } = req.body;
    const adminId = req.user.id;
    const appointmentId = req.params.id;

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
    appointment.saturdayRequest.adminResponse = adminResponse || (approved ? 'Your Saturday request has been approved.' : 'Your Saturday request has been denied.');

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

    res.json({
      success: true,
      message,
      appointment
    });
  } catch (err) {

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
    res.status(500).json({ error: 'Failed to fetch Saturday requests' });
  }
});

export default router;