// routes/hivAnalytics.js - NOW SERVICE USAGE ANALYTICS
import express from 'express';
import Appointment from '../models/appointment.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// ✅ UPDATED: Get Service Usage Analytics (no more HIV status)
router.get('/analytics', isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Get all completed appointments
    const testingAppointments = await Appointment.find({
      service: 'Testing and Counseling',
      status: 'completed'
    }).lean();

    const psychosocialAppointments = await Appointment.find({
      service: 'Psychosocial support and assistance',
      status: 'completed'
    }).lean();


    // Initialize analytics structure
    const analytics = {
      testing: {
        total: testingAppointments.length,
        byAge: {},
        byGender: {},
        byLocation: {}
      },
      psychosocial: {
        total: psychosocialAppointments.length,
        byAge: {},
        byGender: {},
        byLocation: {}
      },
      overall: {
        total: testingAppointments.length + psychosocialAppointments.length,
        testingPercentage: 0,
        psychosocialPercentage: 0
      }
    };

    // Helper function to categorize age
    const getAgeGroup = (age) => {
      if (!age || age < 1) return 'Unknown';
      if (age < 18) return '0-17';
      if (age >= 18 && age < 25) return '18-24';
      if (age >= 25 && age < 35) return '25-34';
      if (age >= 35 && age < 45) return '35-44';
      if (age >= 45 && age < 55) return '45-54';
      return '55+';
    };

    // Process Testing and Counseling appointments
    testingAppointments.forEach(apt => {
      const info = apt.testingInfo;
      if (!info) return;

      const age = info.age || 0;
      const gender = info.gender || 'Not specified';
      const location = info.location || 'Unknown';

      // Age groups
      const ageGroup = getAgeGroup(age);
      analytics.testing.byAge[ageGroup] = (analytics.testing.byAge[ageGroup] || 0) + 1;

      // Gender
      analytics.testing.byGender[gender] = (analytics.testing.byGender[gender] || 0) + 1;

      // Location
      analytics.testing.byLocation[location] = (analytics.testing.byLocation[location] || 0) + 1;
    });

    // Process Psychosocial Support appointments
    psychosocialAppointments.forEach(apt => {
      const info = apt.psychosocialInfo;
      if (!info) return;

      const age = info.age || 0;
      const gender = info.gender || 'Not specified';
      const location = info.location || 'Unknown';

      // Age groups
      const ageGroup = getAgeGroup(age);
      analytics.psychosocial.byAge[ageGroup] = (analytics.psychosocial.byAge[ageGroup] || 0) + 1;

      // Gender
      analytics.psychosocial.byGender[gender] = (analytics.psychosocial.byGender[gender] || 0) + 1;

      // Location
      analytics.psychosocial.byLocation[location] = (analytics.psychosocial.byLocation[location] || 0) + 1;

    });

    // Calculate percentages
    const total = analytics.overall.total;
    if (total > 0) {
      analytics.overall.testingPercentage = Math.round((testingAppointments.length / total) * 100);
      analytics.overall.psychosocialPercentage = Math.round((psychosocialAppointments.length / total) * 100);
    }

    Object.entries(analytics.testing.byAge).forEach(([age, count]) => {
      if (count > 0) console.log(`  ${age}: ${count}`);
    });
    Object.entries(analytics.psychosocial.byAge).forEach(([age, count]) => {
      if (count > 0) console.log(`  ${age}: ${count}`);
    });
    Object.entries(analytics.testing.byGender).forEach(([gender, count]) => {
      if (count > 0) console.log(`  ${gender}: ${count}`);
    });
    Object.entries(analytics.psychosocial.byGender).forEach(([gender, count]) => {
      if (count > 0) console.log(`  ${gender}: ${count}`);
    });
    Object.entries(analytics.testing.byLocation)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([loc, count]) => console.log(`  ${loc}: ${count}`));
    Object.entries(analytics.psychosocial.byLocation)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([loc, count]) => console.log(`  ${loc}: ${count}`));

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch service analytics',
      details: error.message
    });
  }
});

export default router;