// routes/hivAnalytics.js - FIXED ANALYTICS WITH PROPER DATA FETCHING
import express from 'express';
import Appointment from '../models/appointment.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get HIV Analytics Data
router.get('/analytics', isAuthenticated, isAdmin, async (req, res) => {
  try {
    console.log('📊 Fetching HIV Analytics...');

    // Get all Testing and Counseling appointments with confirmed HIV status
    const appointments = await Appointment.find({
      service: 'Testing and Counseling',
      'hivStatus.status': { $in: ['positive', 'negative'] }
    })
    .populate('user', 'name username email')
    .lean();

    console.log(`✅ Found ${appointments.length} completed HIV tests`);

    // Initialize counters
    const analytics = {
      total: appointments.length,
      positive: 0,
      negative: 0,
      byAge: {
        positive: { '0-17': 0, '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0 },
        negative: { '0-17': 0, '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0 }
      },
      byGender: {
        positive: { Male: 0, Female: 0, Other: 0, 'Prefer not to say': 0 },
        negative: { Male: 0, Female: 0, Other: 0, 'Prefer not to say': 0 }
      },
      byLocation: {
        positive: {},
        negative: {}
      }
    };

    // Process each appointment
    appointments.forEach(apt => {
      const status = apt.hivStatus.status;

      // ✅ FIXED: Get demographic data from testingInfo (not psychosocialInfo)
      const age = apt.testingInfo?.age || 0;
      const gender = apt.testingInfo?.gender || 'Other';
      const location = apt.testingInfo?.location || 'Unknown';

      console.log(`Processing: ${apt._id} | Status: ${status} | Age: ${age} | Gender: ${gender} | Location: ${location}`);

      // Count totals
      if (status === 'positive') {
        analytics.positive++;
      } else if (status === 'negative') {
        analytics.negative++;
      }

      // Age groups
      let ageGroup = '55+';
      if (age < 18) {
        ageGroup = '0-17';
      } else if (age >= 18 && age < 25) {
        ageGroup = '18-24';
      } else if (age >= 25 && age < 35) {
        ageGroup = '25-34';
      } else if (age >= 35 && age < 45) {
        ageGroup = '35-44';
      } else if (age >= 45 && age < 55) {
        ageGroup = '45-54';
      }

      analytics.byAge[status][ageGroup]++;
      console.log(`  → Age group: ${ageGroup}`);

      // Gender
      if (analytics.byGender[status][gender] !== undefined) {
        analytics.byGender[status][gender]++;
        console.log(`  → Gender: ${gender}`);
      } else {
        analytics.byGender[status]['Other']++;
        console.log(`  → Gender: ${gender} (counted as Other)`);
      }

      // Location
      if (!analytics.byLocation[status][location]) {
        analytics.byLocation[status][location] = 0;
      }
      analytics.byLocation[status][location]++;
      console.log(`  → Location: ${location}`);
    });

    console.log('═══════════════════════════════════════════════════');
    console.log('📊 ANALYTICS SUMMARY');
    console.log('═══════════════════════════════════════════════════');
    console.log('Total Tests:', analytics.total);
    console.log('Positive:', analytics.positive);
    console.log('Negative:', analytics.negative);
    console.log('\nAge Distribution (Positive):');
    Object.entries(analytics.byAge.positive).forEach(([age, count]) => {
      if (count > 0) console.log(`  ${age}: ${count}`);
    });
    console.log('\nAge Distribution (Negative):');
    Object.entries(analytics.byAge.negative).forEach(([age, count]) => {
      if (count > 0) console.log(`  ${age}: ${count}`);
    });
    console.log('\nGender Distribution (Positive):');
    Object.entries(analytics.byGender.positive).forEach(([gender, count]) => {
      if (count > 0) console.log(`  ${gender}: ${count}`);
    });
    console.log('\nGender Distribution (Negative):');
    Object.entries(analytics.byGender.negative).forEach(([gender, count]) => {
      if (count > 0) console.log(`  ${gender}: ${count}`);
    });
    console.log('\nTop 5 Locations (Positive):');
    Object.entries(analytics.byLocation.positive)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([loc, count]) => console.log(`  ${loc}: ${count}`));
    console.log('\nTop 5 Locations (Negative):');
    Object.entries(analytics.byLocation.negative)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([loc, count]) => console.log(`  ${loc}: ${count}`));
    console.log('═══════════════════════════════════════════════════');

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('❌ Error fetching HIV analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch HIV analytics',
      details: error.message
    });
  }
});

export default router;