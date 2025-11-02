// routes/sessionManagement.js - COMPLETE UNIFIED VERSION
import express from 'express';
import Appointment from '../models/appointment.js';
import User from '../models/User.js';
import { isAuthenticated, isCaseManager } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// 🇵🇭 Philippine Timezone Helper
// ============================================
// Philippine Timezone Helper
const getPhilippineDate = () => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
};

// ============================================
// GENERATE COMPREHENSIVE REPORT FOR ALL PATIENTS
// ============================================
router.get('/comprehensive-report', isAuthenticated, isCaseManager, async (req, res) => {
  try {
    const caseManagerId = req.user.userId || req.user.id;

    // Get all appointments for this case manager
    const appointments = await Appointment.find({
      assignedCaseManager: caseManagerId
    })
    .populate('user', 'name username email profile age gender location')
    .sort({ date: -1 });

    if (!appointments || appointments.length === 0) {
      return res.json({
        success: true,
        report: {
          totalPatients: 0,
          totalSessions: 0,
          completedPrograms: 0,
          ongoingPrograms: 0,
          patients: [],
          caseManager: {
            name: req.user.name || req.user.username,
            email: req.user.email
          },
          generatedAt: new Date()
        }
      });
    }

    // Group appointments by user
    const patientMap = {};
    let totalSessions = 0;
    let completedPrograms = 0;
    let ongoingPrograms = 0;

    appointments.forEach(apt => {
      const userId = apt.user._id.toString();
      
      if (!patientMap[userId]) {
        patientMap[userId] = {
          patientInfo: {
            name: apt.user.name || apt.user.username,
            age: apt.user.profile?.age || apt.user.age,
            gender: apt.user.profile?.gender || apt.user.gender,
            location: apt.user.profile?.location || apt.user.location
          },
          sessions: [],
          totalSessions: 0,
          programCompleted: false
        };
      }

      // Add session details
      if (apt.sessionTracking?.sessionNotes && apt.sessionTracking.sessionNotes.length > 0) {
        apt.sessionTracking.sessionNotes.forEach(note => {
          patientMap[userId].sessions.push({
            sessionNumber: note.sessionNumber,
            date: apt.date,
            time: apt.time,
            notes: [{
              notes: note.notes,
              sessionSummary: note.sessionSummary,
              progress: note.progress
            }]
          });
          totalSessions++;
        });
      }

      patientMap[userId].totalSessions = apt.sessionTracking?.totalSessions || 0;
      
      if (apt.programCompleted) {
        patientMap[userId].programCompleted = true;
        completedPrograms++;
      } else {
        ongoingPrograms++;
      }
    });

    // Convert to array and sort by name
    const patients = Object.values(patientMap).sort((a, b) => 
      a.patientInfo.name.localeCompare(b.patientInfo.name)
    );

    const report = {
      totalPatients: patients.length,
      totalSessions,
      completedPrograms,
      ongoingPrograms,
      patients,
      caseManager: {
        name: req.user.name || req.user.username,
        email: req.user.email
      },
      generatedAt: new Date()
    };

    res.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('Error generating comprehensive report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate comprehensive report'
    });
  }
});

// ============================================
// RESCHEDULE APPOINTMENT (EDIT DATE/TIME)
// ============================================
router.put('/appointments/:id/reschedule', isAuthenticated, isCaseManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time, note } = req.body;
    const caseManagerId = req.user.userId || req.user.id;

    // Validate inputs
    if (!date || !time) {
      return res.status(400).json({
        success: false,
        error: 'Date and time are required'
      });
    }

    // Find the appointment
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    // Check if case manager is authorized
    if (appointment.assignedCaseManager.toString() !== caseManagerId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to edit this appointment'
      });
    }

    // Don't allow editing completed programs
    if (appointment.programCompleted) {
      return res.status(400).json({
        success: false,
        error: 'Cannot reschedule a completed program'
      });
    }

    // Update the appointment
    appointment.date = date;
    appointment.time = time;
    if (note) {
      appointment.note = note;
    }
    appointment.updatedAt = new Date();

    await appointment.save();

    // Populate user info for response
    await appointment.populate('user', 'name username email');

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      appointment
    });

  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reschedule appointment'
    });
  }
});

// ============================================
// GET BOOKED SLOTS WITH PATIENT NAMES (UPDATED to include completed)
// ============================================
router.get('/booked-slots', isAuthenticated, async (req, res) => {
  try {
    // ✅ UPDATED: Include confirmed, pending, AND completed appointments
    const appointments = await Appointment.find({
      status: { $in: ['confirmed', 'pending', 'completed'] }, // Added 'completed'
      programCompleted: false
    })
    .populate('user', 'name username')
    .select('date time user _id');

    const bookedSlots = appointments.map(apt => ({
      date: apt.date,
      time: apt.time,
      appointmentId: apt._id.toString(),
      userName: apt.user?.name || apt.user?.username || 'Unknown',
      status: apt.status // ✅ Include status for reference
    }));

    res.json(bookedSlots);
  } catch (error) {
    console.error('Error fetching booked slots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booked slots'
    });
  }
});

// ============================================
// CREATE NEXT SESSION APPOINTMENT
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

    // ✅ Check if date is in the past
    const appointmentDate = new Date(date);
    const today = getPhilippineDate();
    today.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      return res.status(400).json({
        error: 'Cannot schedule session in the past'
      });
    }

    // ✅ Get the highest session number for this user to ensure proper increment
    const userAppointments = await Appointment.find({
      user: currentAppointment.user._id,
      assignedCaseManager: caseManagerId
    }).sort({ 'sessionTracking.sessionNumber': -1 });

    const lastSessionNumber = userAppointments.length > 0 
      ? userAppointments[0].sessionTracking.sessionNumber 
      : 0;

    const nextSessionNumber = lastSessionNumber + 1;

    console.log(`📊 Last session: ${lastSessionNumber}, Next session: ${nextSessionNumber}`);

    // Create next session appointment
    const nextAppointment = new Appointment({
      user: currentAppointment.user._id,
      service: currentAppointment.service,
      date,
      time,
      note: note || `Session #${nextSessionNumber}`,
      status: 'confirmed',
      assignedCaseManager: caseManagerId,
      assignedAt: getPhilippineDate(),
      assignedBy: caseManagerId,
      sessionTracking: {
        sessionNumber: nextSessionNumber,
        sessionNotes: [],
        totalSessions: 0,
        lastSessionDate: null
      },
      bookedAt: getPhilippineDate(),
      // Copy psychosocial info if exists
      ...(currentAppointment.psychosocialInfo && {
        psychosocialInfo: currentAppointment.psychosocialInfo
      })
    });

    await nextAppointment.save();
    await nextAppointment.populate([
      { path: 'user', select: 'name email username fullName' },
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
// ADD/UPDATE SESSION SUMMARY
// ============================================
router.post('/appointments/:id/session-summary', isAuthenticated, isCaseManager, async (req, res) => {
  try {
    const { notes, progress, sessionSummary } = req.body;
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
      date: new Date(appointment.date),
      time: appointment.time,
      notes,
      sessionSummary: sessionSummary || '',
      progress: progress || 'good',
      caseManagerId,
      completedAt: getPhilippineDate(),
      createdAt: getPhilippineDate()
    };

    appointment.sessionTracking.sessionNotes.push(sessionNote);
    appointment.sessionTracking.totalSessions += 1;
    appointment.sessionTracking.lastSessionDate = getPhilippineDate();

    // Mark appointment as completed after adding summary
    if (appointment.status !== 'completed') {
      appointment.status = 'completed';
      appointment.completedAt = getPhilippineDate();
      appointment.completedBy = caseManagerId;
    }

    await appointment.save();
    await appointment.populate([
      { path: 'user', select: 'name email username fullName' },
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
// EDIT SESSION NOTE
// ============================================
router.put('/appointments/:appointmentId/session-notes/:noteIndex', isAuthenticated, isCaseManager, async (req, res) => {
  try {
    const { notes, progress, sessionSummary } = req.body;
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
    if (sessionSummary !== undefined) {
      appointment.sessionTracking.sessionNotes[index].sessionSummary = sessionSummary;
    }

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
// DELETE SESSION NOTE
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
// COMPLETE PROGRAM
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
    appointment.completedAt = getPhilippineDate();
    appointment.completedBy = caseManagerId;
    appointment.completionNotes = completionNotes || '';
    appointment.status = 'completed';

    await appointment.save();
    await appointment.populate([
      { path: 'user', select: 'name email username fullName' },
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
      'sessionTracking.sessionNotes.0': { $exists: true }
    })
    .populate('user', 'name email username fullName')
    .populate('assignedCaseManager', 'name username email')
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

// ============================================
// GENERATE PRINTABLE PROGRAM REPORT
// ============================================
router.get('/patients/:userId/program-report', isAuthenticated, isCaseManager, async (req, res) => {
  try {
    const { userId } = req.params;
    const caseManagerId = req.user.id;

    console.log('📄 Generating program report for user:', userId);

    // Get user details
    const user = await User.findById(userId).select('name email username fullName age gender location');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get case manager details
    const caseManager = await User.findById(caseManagerId).select('name email username');

    // Get all appointments for this user with this case manager
    const appointments = await Appointment.find({
      user: userId,
      assignedCaseManager: caseManagerId
    })
    .populate('sessionTracking.sessionNotes.caseManagerId', 'name username')
    .sort({ 'sessionTracking.sessionNumber': 1 });

    // Calculate statistics
    const totalSessions = appointments.reduce((sum, apt) => 
      sum + apt.sessionTracking.sessionNotes.length, 0
    );

    const completedAppointments = appointments.filter(apt => apt.status === 'completed');
    
    const progressStats = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0
    };

    appointments.forEach(apt => {
      apt.sessionTracking.sessionNotes.forEach(note => {
        progressStats[note.progress]++;
      });
    });

    // Get program completion info
    const completedProgram = appointments.find(apt => apt.programCompleted);

    // Format report data
    const report = {
      generatedAt: getPhilippineDate(),
      generatedBy: caseManager,
      
      patient: {
        name: user.fullName || user.name || user.username,
        email: user.email,
        age: user.age,
        gender: user.gender,
        location: user.location
      },

      programInfo: {
        totalSessions: totalSessions,
        completedSessions: completedAppointments.length,
        programCompleted: !!completedProgram,
        completedAt: completedProgram?.completedAt,
        completionNotes: completedProgram?.completionNotes
      },

      statistics: {
        progressDistribution: progressStats,
        averageProgress: calculateAverageProgress(progressStats, totalSessions)
      },

      sessions: appointments.map(apt => ({
        sessionNumber: apt.sessionTracking.sessionNumber,
        service: apt.service,
        date: apt.date,
        time: apt.time,
        status: apt.status,
        notes: apt.sessionTracking.sessionNotes.map(note => ({
          date: note.date,
          time: note.time,
          notes: note.notes,
          sessionSummary: note.sessionSummary,
          progress: note.progress,
          completedAt: note.completedAt,
          caseManager: note.caseManagerId
        }))
      })),

      psychosocialInfo: appointments[0]?.psychosocialInfo || null
    };

    console.log('✅ Program report generated');

    res.json({
      success: true,
      report
    });
  } catch (err) {
    console.error('❌ Error generating report:', err);
    res.status(500).json({ 
      error: 'Failed to generate program report',
      details: err.message 
    });
  }
});

// ============================================
// 🆕 GET UNIFIED SESSION HISTORY FOR A PATIENT (ALL APPOINTMENTS)
// ENHANCED with proper completion time tracking
// ============================================
router.get('/patients/:userId/unified-history', isAuthenticated, isCaseManager, async (req, res) => {
  try {
    const { userId } = req.params;
    const caseManagerId = req.user.id;

    console.log('📚 Fetching unified session history for user:', userId);

    // Get ALL appointments for this user with this case manager
    const appointments = await Appointment.find({
      user: userId,
      assignedCaseManager: caseManagerId
    })
    .populate('user', 'name email username fullName age gender location')
    .populate('assignedCaseManager', 'name username email')
    .populate('sessionTracking.sessionNotes.caseManagerId', 'name username')
    .sort({ 'sessionTracking.sessionNumber': 1, date: 1 });

    if (!appointments || appointments.length === 0) {
      return res.json({
        success: false,
        message: 'No appointments found for this patient'
      });
    }

    // Compile ALL sessions from ALL appointments into one unified timeline
    const allSessions = [];
    let totalSessionsCompleted = 0;
    const progressStats = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0
    };

    // Track overall program dates
    let earliestSessionDate = null;
    let latestSessionDate = null;
    let latestCompletedDate = null;

    appointments.forEach(apt => {
      if (apt.sessionTracking?.sessionNotes?.length > 0) {
        apt.sessionTracking.sessionNotes.forEach(note => {
          // ✅ Use completedAt from note if available, otherwise use session date
          const sessionDate = note.date || apt.date;
          const completedAt = note.completedAt || note.createdAt;

          // Track earliest and latest dates
          if (!earliestSessionDate || new Date(sessionDate) < new Date(earliestSessionDate)) {
            earliestSessionDate = sessionDate;
          }
          if (!latestSessionDate || new Date(sessionDate) > new Date(latestSessionDate)) {
            latestSessionDate = sessionDate;
          }
          if (completedAt && (!latestCompletedDate || new Date(completedAt) > new Date(latestCompletedDate))) {
            latestCompletedDate = completedAt;
          }

          allSessions.push({
            sessionNumber: note.sessionNumber,
            appointmentId: apt._id,
            date: sessionDate,
            time: note.time || apt.time,
            notes: note.notes,
            sessionSummary: note.sessionSummary,
            progress: note.progress,
            caseManager: note.caseManagerId,
            completedAt: completedAt, // ✅ This is the actual completion time
            service: apt.service,
            status: apt.status
          });
          
          totalSessionsCompleted++;
          progressStats[note.progress]++;
        });
      }
    });

    // Sort by session number
    allSessions.sort((a, b) => a.sessionNumber - b.sessionNumber);

    // Get patient info from first appointment
    const patientInfo = {
      name: appointments[0].user?.fullName || appointments[0].user?.name || appointments[0].user?.username,
      email: appointments[0].user?.email,
      age: appointments[0].user?.age,
      gender: appointments[0].user?.gender,
      location: appointments[0].user?.location,
      psychosocialInfo: appointments[0].psychosocialInfo
    };

    // Get case manager info
    const caseManagerInfo = {
      name: appointments[0].assignedCaseManager?.name || appointments[0].assignedCaseManager?.username,
      email: appointments[0].assignedCaseManager?.email
    };

    // Calculate program info
    const completedProgram = appointments.find(apt => apt.programCompleted);
    const averageProgress = calculateAverageProgress(progressStats, totalSessionsCompleted);

    const unifiedHistory = {
      patient: patientInfo,
      caseManager: caseManagerInfo,
      programInfo: {
        totalSessions: totalSessionsCompleted,
        programCompleted: !!completedProgram,
        completedAt: completedProgram?.completedAt,
        completionNotes: completedProgram?.completionNotes,
        firstSessionDate: earliestSessionDate,
        lastSessionDate: latestSessionDate, // ✅ Last session scheduled date
        lastCompletedDate: latestCompletedDate // ✅ Last actual completion timestamp
      },
      statistics: {
        progressDistribution: progressStats,
        averageProgress: averageProgress
      },
      sessions: allSessions,
      totalAppointments: appointments.length,
      generatedAt: new Date()
    };

    console.log(`✅ Unified history generated: ${totalSessionsCompleted} sessions across ${appointments.length} appointments`);
    console.log(`📅 Date range: ${earliestSessionDate} to ${latestSessionDate}`);
    console.log(`✅ Last completed: ${latestCompletedDate}`);

    res.json({
      success: true,
      history: unifiedHistory
    });
  } catch (err) {
    console.error('❌ Error fetching unified session history:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch unified session history',
      details: err.message 
    });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

// Helper function to calculate average progress
function calculateAverageProgress(stats, total) {
  if (total === 0) return 'N/A';
  
  const weights = { excellent: 4, good: 3, fair: 2, poor: 1 };
  const sum = Object.keys(stats).reduce((acc, key) => 
    acc + (stats[key] * weights[key]), 0
  );
  
  const average = sum / total;
  
  if (average >= 3.5) return 'Excellent';
  if (average >= 2.5) return 'Good';
  if (average >= 1.5) return 'Fair';
  return 'Poor';
}

export default router;