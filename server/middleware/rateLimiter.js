import mongoose from 'mongoose';

// ============================================
// LOGIN ATTEMPT TRACKING SCHEMA
// ============================================
const loginAttemptSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true
  },
  attempts: { 
    type: Number, 
    default: 0 
  },
  lockedUntil: { 
    type: Date,
    default: null
  },
  lastAttempt: { 
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const LoginAttempt = mongoose.model('LoginAttempt', loginAttemptSchema);

// ============================================
// RATE LIMITING CONFIGURATION
// ============================================
const MAX_ATTEMPTS = 5;
const LOCK_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Progressive delay times (in seconds)
const DELAY_TIMES = {
  1: 0,      // No delay
  2: 30,     // 30 seconds
  3: 60,     // 1 minute
  4: 300,    // 5 minutes
  5: 900     // 15 minutes
};

// ============================================
// CHECK IF ACCOUNT IS LOCKED
// ============================================
export const checkLoginAttempts = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        msg: 'Email is required' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // Find existing login attempt record
    let attemptRecord = await LoginAttempt.findOne({ email: normalizedEmail });

    // If no record exists, create one and continue
    if (!attemptRecord) {
      attemptRecord = new LoginAttempt({ 
        email: normalizedEmail,
        attempts: 0 
      });
      await attemptRecord.save();
      return next();
    }

    // Check if account is currently locked
    if (attemptRecord.lockedUntil && attemptRecord.lockedUntil > Date.now()) {
      const remainingTime = Math.ceil((attemptRecord.lockedUntil - Date.now()) / 1000 / 60); // minutes
      
      console.log(`🔒 Account locked: ${normalizedEmail} - ${remainingTime} minutes remaining`);
      
      return res.status(429).json({
        msg: `Too many failed login attempts. Your account is locked for ${remainingTime} more minutes.`,
        lockedUntil: attemptRecord.lockedUntil,
        remainingMinutes: remainingTime,
        locked: true
      });
    }

    // If lock time has passed, reset attempts
    if (attemptRecord.lockedUntil && attemptRecord.lockedUntil <= Date.now()) {
      attemptRecord.attempts = 0;
      attemptRecord.lockedUntil = null;
      await attemptRecord.save();
      console.log(`✅ Lock expired and reset for: ${normalizedEmail}`);
    }

    // Check if there's a required delay before next attempt
    if (attemptRecord.attempts > 0 && attemptRecord.attempts < MAX_ATTEMPTS) {
      const delayTime = DELAY_TIMES[attemptRecord.attempts] || 0;
      const timeSinceLastAttempt = (Date.now() - new Date(attemptRecord.lastAttempt).getTime()) / 1000; // seconds
      
      if (timeSinceLastAttempt < delayTime) {
        const remainingDelay = Math.ceil(delayTime - timeSinceLastAttempt);
        
        console.log(`⏳ Delay required for ${normalizedEmail}: ${remainingDelay} seconds`);
        
        return res.status(429).json({
          msg: `Please wait ${remainingDelay} seconds before trying again.`,
          remainingSeconds: remainingDelay,
          attempts: attemptRecord.attempts,
          maxAttempts: MAX_ATTEMPTS,
          delay: true
        });
      }
    }

    // Attach attempt record to request for use in login handler
    req.attemptRecord = attemptRecord;
    next();
  } catch (error) {
    console.error('❌ Rate limiter error:', error);
    // Don't block login on rate limiter errors
    next();
  }
};

// ============================================
// RECORD FAILED LOGIN ATTEMPT
// ============================================
export const recordFailedAttempt = async (email) => {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    let attemptRecord = await LoginAttempt.findOne({ email: normalizedEmail });
    
    if (!attemptRecord) {
      attemptRecord = new LoginAttempt({ 
        email: normalizedEmail,
        attempts: 1,
        lastAttempt: Date.now()
      });
    } else {
      attemptRecord.attempts += 1;
      attemptRecord.lastAttempt = Date.now();
      
      // Lock account after max attempts
      if (attemptRecord.attempts >= MAX_ATTEMPTS) {
        attemptRecord.lockedUntil = new Date(Date.now() + LOCK_TIME);
        console.log(`🔒 Account locked for 24 hours: ${normalizedEmail}`);
      } else {
        console.log(`⚠️ Failed attempt ${attemptRecord.attempts}/${MAX_ATTEMPTS} for: ${normalizedEmail}`);
      }
    }
    
    await attemptRecord.save();
    return attemptRecord;
  } catch (error) {
    console.error('❌ Error recording failed attempt:', error);
    return null;
  }
};

// ============================================
// RESET LOGIN ATTEMPTS ON SUCCESSFUL LOGIN
// ============================================
export const resetLoginAttempts = async (email) => {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    const attemptRecord = await LoginAttempt.findOne({ email: normalizedEmail });
    
    if (attemptRecord) {
      attemptRecord.attempts = 0;
      attemptRecord.lockedUntil = null;
      attemptRecord.lastAttempt = Date.now();
      await attemptRecord.save();
      
      console.log(`✅ Login attempts reset for: ${normalizedEmail}`);
    }
  } catch (error) {
    console.error('❌ Error resetting attempts:', error);
  }
};

// ============================================
// CLEANUP OLD RECORDS (Optional maintenance function)
// ============================================
export const cleanupOldAttempts = async () => {
  try {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    const result = await LoginAttempt.deleteMany({
      lastAttempt: { $lt: cutoffDate },
      attempts: 0
    });
    
    console.log(`🧹 Cleaned up ${result.deletedCount} old login attempt records`);
  } catch (error) {
    console.error('❌ Error cleaning up old attempts:', error);
  }
};

export default {
  checkLoginAttempts,
  recordFailedAttempt,
  resetLoginAttempts,
  cleanupOldAttempts
};