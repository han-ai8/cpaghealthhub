// routes/clinicSchedule.js - Admin calendar management routes
import express from 'express';
import ClinicSchedule from '../models/ClinicSchedule.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// GET ACTIVE CLINIC SCHEDULE (PUBLIC)
// ============================================
router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    const schedule = await ClinicSchedule.find({
      isActive: true,
      endDate: { $gte: now }
    }).sort({ startDate: 1 });

    res.json(schedule);
  } catch (err) {
    console.error('Error fetching clinic schedule:', err);
    res.status(500).json({ error: 'Failed to fetch clinic schedule' });
  }
});

// ============================================
// GET ALL CLINIC SCHEDULES (ADMIN)
// ============================================
router.get('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const schedules = await ClinicSchedule.find()
      .populate('createdBy', 'name username')
      .sort({ startDate: -1 });

    res.json(schedules);
  } catch (err) {
    console.error('Error fetching all schedules:', err);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// ============================================
// CREATE CLINIC SCHEDULE (ADMIN)
// ============================================
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { type, title, description, startDate, endDate, date, reason, isRecurring } = req.body;

    if (!type || !title || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Type, title, start date, and end date are required' 
      });
    }

    const schedule = new ClinicSchedule({
      type,
      title,
      description: description || '',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      date: date ? new Date(date) : null,
      reason: reason || '',
      isRecurring: isRecurring || false,
      createdBy: req.user.id,
      isActive: true
    });

    await schedule.save();
    await schedule.populate('createdBy', 'name username');

    console.log(`✅ Clinic schedule created: ${schedule._id}`);
    res.status(201).json(schedule);
  } catch (err) {
    console.error('Error creating clinic schedule:', err);
    res.status(500).json({ error: 'Failed to create clinic schedule' });
  }
});

// ============================================
// UPDATE CLINIC SCHEDULE (ADMIN)
// ============================================
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { type, title, description, startDate, endDate, date, reason, isRecurring, isActive } = req.body;

    const schedule = await ClinicSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    if (type) schedule.type = type;
    if (title) schedule.title = title;
    if (description !== undefined) schedule.description = description;
    if (startDate) schedule.startDate = new Date(startDate);
    if (endDate) schedule.endDate = new Date(endDate);
    if (date) schedule.date = new Date(date);
    if (reason !== undefined) schedule.reason = reason;
    if (isRecurring !== undefined) schedule.isRecurring = isRecurring;
    if (isActive !== undefined) schedule.isActive = isActive;

    await schedule.save();
    await schedule.populate('createdBy', 'name username');

    console.log(`✅ Clinic schedule updated: ${schedule._id}`);
    res.json(schedule);
  } catch (err) {
    console.error('Error updating clinic schedule:', err);
    res.status(500).json({ error: 'Failed to update clinic schedule' });
  }
});

// ============================================
// DELETE CLINIC SCHEDULE (ADMIN)
// ============================================
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const schedule = await ClinicSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    await ClinicSchedule.findByIdAndDelete(req.params.id);

    console.log(`✅ Clinic schedule deleted: ${req.params.id}`);
    res.json({ message: 'Schedule deleted successfully' });
  } catch (err) {
    console.error('Error deleting clinic schedule:', err);
    res.status(500).json({ error: 'Failed to delete clinic schedule' });
  }
});

// ============================================
// TOGGLE SCHEDULE STATUS (ADMIN)
// ============================================
router.patch('/:id/toggle', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const schedule = await ClinicSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    schedule.isActive = !schedule.isActive;
    await schedule.save();
    await schedule.populate('createdBy', 'name username');

    console.log(`✅ Schedule status toggled: ${schedule._id} - Active: ${schedule.isActive}`);
    res.json(schedule);
  } catch (err) {
    console.error('Error toggling schedule status:', err);
    res.status(500).json({ error: 'Failed to toggle schedule status' });
  }
});

// ============================================
// CHECK DATE AVAILABILITY (PUBLIC)
// ============================================
router.get('/check-date/:date', async (req, res) => {
  try {
    const checkDate = new Date(req.params.date);
    const dayOfWeek = checkDate.getDay();

    // Check for closures
    const closure = await ClinicSchedule.findOne({
      type: 'closure',
      isActive: true,
      startDate: { $lte: checkDate },
      endDate: { $gte: checkDate }
    });

    if (closure) {
      return res.json({ 
        available: false, 
        reason: closure.reason || 'Clinic closed',
        schedule: closure
      });
    }

    // Check for special openings (like Saturday)
    const specialOpening = await ClinicSchedule.findOne({
      type: 'special_opening',
      isActive: true,
      date: checkDate
    });

    if (specialOpening) {
      return res.json({ 
        available: true, 
        reason: 'Special opening',
        schedule: specialOpening
      });
    }

    // Default: closed on Sundays
    if (dayOfWeek === 0) {
      return res.json({ 
        available: false, 
        reason: 'Closed on Sundays'
      });
    }

    res.json({ available: true, reason: 'Regular hours' });
  } catch (err) {
    console.error('Error checking date availability:', err);
    res.status(500).json({ error: 'Failed to check date availability' });
  }
});

export default router;