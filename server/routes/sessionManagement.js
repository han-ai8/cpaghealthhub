// routes/sessionRoutes.js
import express from 'express';
import Appointment from '../models/appointment.js';
import { isAuthenticated, isCaseManager } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// 🆕 CREATE NEXT SESSION APPOINTMENT
// ============================================
router.post('/appointments/:id/next-session', isAuthenticated, isCaseManager, async (req, res) => {
  try {
    const { date, time, note } = req.body;
    const caseManagerId = req.user.id;
    const currentAppointmentId = req.params.id;

    console.log('📅 Creating next session for appointment:', currentAppointmentId);

    // Get current appointment
    const currentAppointment = await Appointment.findById(currentAppointmentId)
      .populate('user');

    if (!currentAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Verify case manager is assigned
    if (currentAppointment.assignedCaseManager.toString() !== caseManagerId) {
      return res.status(403).json({ 
        error: 'You can only create sessions for your assigned patients' 
      });
    }

    // Validate inputs
    if (!date || !time) {
      return res.status(400).json({ error: 'Date and time are required' });
    }

    // Create next session appointment
    const nextSessionNumber = (currentAppointment.sessionTracking?.sessionNumber || 0) + 1;

    const nextAppointment = new Appointment({
      user: currentAppointment.user._id,
      service: currentAppointment.service,
      date,
      time,
      note: note || `Session #${nextSessionNumber}`,
      status: 'confirmed',
      assignedCaseManager: caseManagerId,
      assignedAt: new Date(),
      assignedBy: caseManagerId,
      sessionTracking: {
        sessionNumber: nextSessionNumber,
        sessionNotes: [],
        totalSessions: 0,
        lastSessionDate: null
      },
      // Copy psychosocial info if exists
      ...(currentAppointment.psychosocialInfo && {
        psychosocialInfo: currentAppointment.psychosocialInfo
      })
    });

    await nextAppointment.save();
    await nextAppointment.populate([
      { path: 'user', select: 'name email username' },
      { path: 'assignedCaseManager', select: 'name username email' }
    ]);

    console.log('✅ Next session created:', nextAppointment._id);

    res.status(201).json({
      success: true,
      message: `Session #${nextSessionNumber} scheduled successfully`,
      appointment: nextAppointment
    });
  } catch (err) {
    console.error('❌ Error creating next session:', err);
    res.status(500).json({ 
      error: 'Failed to create next session',
      details: err.message 
    });
  }
});

// ============================================
// 🆕 ADD/UPDATE SESSION SUMMARY
// ============================================
router.post('/appointments/:id/session-summary', isAuthenticated, isCaseManager, async (req, res) => {
  try {
    const { notes, progress } = req.body;
    const caseManagerId = req.user.id;
    const appointmentId = req.params.id;

    console.log('📝 Adding session summary for appointment:', appointmentId);

    if (!notes) {
      return res.status(400).json({ error: 'Session notes are required' });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Verify case manager
    if (appointment.assignedCaseManager.toString() !== caseManagerId) {
      return res.status(403).json({ 
        error: 'You can only add summaries for your assigned patients' 
      });
    }

    // Add session note
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

    // Mark appointment as completed after adding summary
    if (appointment.status !== 'completed') {
      appointment.status = 'completed';
      appointment.completedAt = new Date();
      appointment.completedBy = caseManagerId;
    }

    await appointment.save();
    await appointment.populate([
      { path: 'user', select: 'name email username' },
      { path: 'assignedCaseManager', select: 'name username email' },
      { path: 'sessionTracking.sessionNotes.caseManagerId', select: 'name username' }
    ]);

    console.log('✅ Session summary added');

    res.json({
      success: true,
      message: 'Session summary added successfully',
      appointment
    });
  } catch (err) {
    console.error('❌ Error adding session summary:', err);
    res.status(500).json({ 
      error: 'Failed to add session summary',
      details: err.message 
    });
  }
});

// ============================================
// 🆕 EDIT SESSION NOTE
// ============================================
router.put('/appointments/:appointmentId/session-notes/:noteIndex', isAuthenticated, isCaseManager, async (req, res) => {
  try {
    const { notes, progress } = req.body;
    const { appointmentId, noteIndex } = req.params;
    const caseManagerId = req.user.id;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.assignedCaseManager.toString() !== caseManagerId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const index = parseInt(noteIndex);
    if (index < 0 || index >= appointment.sessionTracking.sessionNotes.length) {
      return res.status(400).json({ error: 'Invalid note index' });
    }

    // Update the note
    if (notes) appointment.sessionTracking.sessionNotes[index].notes = notes;
    if (progress) appointment.sessionTracking.sessionNotes[index].progress = progress;

    await appointment.save();

    res.json({
      success: true,
      message: 'Session note updated successfully',
      appointment
    });
  } catch (err) {
    console.error('❌ Error updating session note:', err);
    res.status(500).json({ error: 'Failed to update session note' });
  }
});

// ============================================
// 🆕 DELETE SESSION NOTE
// ============================================
router.delete('/appointments/:appointmentId/session-notes/:noteIndex', isAuthenticated, isCaseManager, async (req, res) => {
  try {
    const { appointmentId, noteIndex } = req.params;
    const caseManagerId = req.user.id;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.assignedCaseManager.toString() !== caseManagerId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const index = parseInt(noteIndex);
    if (index < 0 || index >= appointment.sessionTracking.sessionNotes.length) {
      return res.status(400).json({ error: 'Invalid note index' });
    }

    // Remove the note
    appointment.sessionTracking.sessionNotes.splice(index, 1);
    appointment.sessionTracking.totalSessions = Math.max(0, appointment.sessionTracking.totalSessions - 1);

    await appointment.save();

    res.json({
      success: true,
      message: 'Session note deleted successfully',
      appointment
    });
  } catch (err) {
    console.error('❌ Error deleting session note:', err);
    res.status(500).json({ error: 'Failed to delete session note' });
  }
});

// ============================================
// 🆕 COMPLETE PROGRAM
// ============================================
router.post('/appointments/:id/complete-program', isAuthenticated, isCaseManager, async (req, res) => {
  try {
    const { completionNotes } = req.body;
    const caseManagerId = req.user.id;
    const appointmentId = req.params.id;

    console.log('✅ Completing program for appointment:', appointmentId);

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.assignedCaseManager.toString() !== caseManagerId) {
      return res.status(403).json({ 
        error: 'You can only complete programs for your assigned patients' 
      });
    }

    if (appointment.programCompleted) {
      return res.status(400).json({ 
        error: 'Program already marked as completed' 
      });
    }

    // Mark program as completed
    appointment.programCompleted = true;
    appointment.completedAt = new Date();
    appointment.completedBy = caseManagerId;
    appointment.completionNotes = completionNotes || '';
    appointment.status = 'completed';

    await appointment.save();
    await appointment.populate([
      { path: 'user', select: 'name email username' },
      { path: 'assignedCaseManager', select: 'name username email' },
      { path: 'completedBy', select: 'name username' }
    ]);

    console.log('✅ Program marked as completed');

    res.json({
      success: true,
      message: 'Patient program completed successfully',
      appointment
    });
  } catch (err) {
    console.error('❌ Error completing program:', err);
    res.status(500).json({ 
      error: 'Failed to complete program',
      details: err.message 
    });
  }
});

// ============================================
// GET SESSION HISTORY FOR A PATIENT
// ============================================
router.get('/patients/:userId/sessions', isAuthenticated, isCaseManager, async (req, res) => {
  try {
    const { userId } = req.params;
    const caseManagerId = req.user.id;

    console.log('📚 Fetching session history for user:', userId);

    const appointments = await Appointment.find({
      user: userId,
      assignedCaseManager: caseManagerId,
      'sessionTracking.sessionNotes.0': { $exists: true } // Has at least one session note
    })
    .populate('sessionTracking.sessionNotes.caseManagerId', 'name username')
    .sort({ 'sessionTracking.sessionNumber': 1 });

    res.json({
      success: true,
      sessions: appointments,
      totalSessions: appointments.reduce((sum, apt) => 
        sum + apt.sessionTracking.sessionNotes.length, 0
      )
    });
  } catch (err) {
    console.error('❌ Error fetching session history:', err);
    res.status(500).json({ error: 'Failed to fetch session history' });
  }
});

export default router;