// routes/adminAppointments.js - Admin and Case Manager appointment routes
import express from 'express';
import Appointment from '../models/appointment.js';
import User from '../models/User.js';
import { isAuthenticated, isCaseManager, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// GET CASE MANAGER'S ASSIGNED APPOINTMENTS
// ⭐ THIS IS THE KEY ROUTE FOR THE PLANNER
// ============================================
router.get('/my-assigned', isAuthenticated, isCaseManager, async (req, res) => {
  try {
    const caseManagerId = req.user.id;
    console.log(`Fetching assigned appointments for case manager: ${caseManagerId}`);

    // Verify the user is actually a case manager
    const user = await User.findById(caseManagerId);
    if (!user || user.role !== 'case_manager') {
      return res.status(403).json({ 
        error: 'Access denied. Only case managers can view assigned appointments.' 
      });
    }

    // Fetch all appointments assigned to this case manager
    const appointments = await Appointment.find({ 
      assignedCaseManager: caseManagerId 
    })
    .populate('user', 'name email username')
    .populate('assignedBy', 'name username')
    .populate('assignedCaseManager', 'name username')
    .populate('sessionTracking.sessionNotes.caseManagerId', 'name username')
    .sort({ date: 1, time: 1 }); // Sort by date and time ascending

    console.log(`✅ Found ${appointments.length} appointments for case manager ${caseManagerId}`);
    res.json(appointments);
  } catch (err) {
    console.error('Error fetching case manager appointments:', err);
    res.status(500).json({ error: 'Failed to fetch assigned appointments' });
  }
});

// ============================================
// GET ALL APPOINTMENTS - Admin Only
// ============================================
router.get('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    console.log('Admin fetching all appointments');
    
    const appointments = await Appointment.find()
      .populate('user', 'name email username')
      .populate('assignedCaseManager', 'name username email')
      .populate('assignedBy', 'name username')
      .populate('sessionTracking.sessionNotes.caseManagerId', 'name username')
      .sort({ createdAt: -1 });

    res.json(appointments);
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// ============================================
// GET ALL CASE MANAGERS - Admin Only
// ============================================
router.get('/case-managers', isAuthenticated, isAdmin, async (req, res) => {
  try {
    console.log('Fetching all case managers');
    
    const caseManagers = await User.find({ 
      role: 'case_manager' 
    }).select('name username email');

    res.json(caseManagers);
  } catch (err) {
    console.error('Error fetching case managers:', err);
    res.status(500).json({ error: 'Failed to fetch case managers' });
  }
});

// ============================================
// ASSIGN CASE MANAGER - Admin Only
// ============================================
router.put('/:id/assign', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { caseManagerId } = req.body;
    const adminId = req.user.id;

    console.log(`Admin ${adminId} assigning case manager ${caseManagerId} to appointment ${req.params.id}`);

    if (!caseManagerId) {
      return res.status(400).json({ error: 'Case manager ID is required' });
    }

    // Verify case manager exists and has correct role
    const caseManager = await User.findOne({ 
      _id: caseManagerId, 
      role: 'case_manager' 
    });

    if (!caseManager) {
      return res.status(404).json({ error: 'Case manager not found' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Update appointment with case manager assignment
    appointment.assignedCaseManager = caseManagerId;
    appointment.assignedAt = new Date();
    appointment.assignedBy = adminId;

    await appointment.save();
    await appointment.populate([
      { path: 'user', select: 'name email username' },
      { path: 'assignedCaseManager', select: 'name username email' },
      { path: 'assignedBy', select: 'name username' }
    ]);

    console.log(`✅ Case manager ${caseManagerId} assigned to appointment ${req.params.id}`);
    res.json(appointment);
  } catch (err) {
    console.error('Error assigning case manager:', err);
    res.status(500).json({ error: 'Failed to assign case manager' });
  }
});

// ============================================
// UNASSIGN CASE MANAGER - Admin Only
// ============================================
router.put('/:id/unassign', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;

    console.log(`Admin ${adminId} unassigning case manager from appointment ${req.params.id}`);

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    appointment.assignedCaseManager = null;
    appointment.assignedAt = null;
    appointment.assignedBy = null;

    await appointment.save();
    await appointment.populate('user', 'name email username');

    console.log(`✅ Case manager unassigned from appointment ${req.params.id}`);
    res.json(appointment);
  } catch (err) {
    console.error('Error unassigning case manager:', err);
    res.status(500).json({ error: 'Failed to unassign case manager' });
  }
});

// ============================================
// UPDATE APPOINTMENT STATUS - Admin and Case Manager
// ============================================
router.put('/:id/status', isAuthenticated, isCaseManager, async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user.id;

    console.log(`User ${userId} updating appointment ${req.params.id} status to ${status}`);

    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Case managers can only update appointments assigned to them
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

    if (status === 'confirmed') {
      appointment.confirmedAt = new Date();
    } else if (status === 'cancelled') {
      appointment.cancelledAt = new Date();
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

    console.log(`✅ Appointment ${req.params.id} status updated to ${status}`);
    res.json(appointment);
  } catch (err) {
    console.error('Error updating appointment status:', err);
    res.status(500).json({ error: 'Failed to update appointment status' });
  }
});

// ============================================
// HANDLE CANCEL REQUEST - Admin Only
// ============================================
router.put('/:id/cancel-request', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { action, adminResponse } = req.body;
    const adminId = req.user.id;

    console.log(`Admin ${adminId} handling cancel request for appointment ${req.params.id}`);

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be approve or reject' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (!appointment.cancelRequest?.requested) {
      return res.status(400).json({ error: 'No cancellation request found' });
    }

    if (action === 'approve') {
      appointment.status = 'cancelled';
      appointment.cancelledAt = new Date();
    }

    appointment.cancelRequest.adminResponse = adminResponse || '';
    appointment.cancelRequest.respondedAt = new Date();
    appointment.cancelRequest.respondedBy = adminId;

    await appointment.save();
    await appointment.populate([
      { path: 'user', select: 'name email username' },
      { path: 'cancelRequest.respondedBy', select: 'name username' }
    ]);

    console.log(`✅ Cancel request ${action}d for appointment ${req.params.id}`);
    res.json(appointment);
  } catch (err) {
    console.error('Error handling cancel request:', err);
    res.status(500).json({ error: 'Failed to handle cancel request' });
  }
});

// ============================================
// ADD SESSION NOTE - Case Manager Only
// ============================================
router.post('/:id/session-note', isAuthenticated, isCaseManager, async (req, res) => {
  try {
    const { summary, progress, nextSteps } = req.body;
    const caseManagerId = req.user.id;

    console.log(`Case manager ${caseManagerId} adding session note to appointment ${req.params.id}`);

    if (!summary || !progress) {
      return res.status(400).json({ 
        error: 'Summary and progress are required' 
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Verify case manager is assigned to this appointment
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
      summary,
      progress,
      nextSteps: nextSteps || '',
      caseManagerId,
      createdAt: new Date()
    };

    appointment.sessionTracking.sessionNotes.push(sessionNote);
    
    await appointment.save();
    await appointment.populate([
      { path: 'user', select: 'name email username' },
      { path: 'sessionTracking.sessionNotes.caseManagerId', select: 'name username' }
    ]);

    console.log(`✅ Session note added to appointment ${req.params.id}`);
    res.json(appointment);
  } catch (err) {
    console.error('Error adding session note:', err);
    res.status(500).json({ error: 'Failed to add session note' });
  }
});

export default router;