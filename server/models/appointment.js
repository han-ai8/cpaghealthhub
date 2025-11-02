// models/appointment.js - COMPLETE MODEL with Session Tracking
import { Schema, model } from 'mongoose';

const appointmentSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: String,
    enum: ['Testing and Counseling', 'Psychosocial support and assistance'],
    required: true
  },
  date: {
    type: String,  // Format: YYYY-MM-DD
    required: true
  },
  time: {
    type: String,  // Format: HH:MM AM/PM
    required: true
  },
  note: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },

  // ✅ NEW: HIV Status Tracking (only for Testing and Counseling)
  hivStatus: {
    status: {
      type: String,
      enum: ['pending', 'positive', 'negative'],
      default: 'pending'
    },
    confirmedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    confirmedAt: Date,
    notes: String
  },
   // ✅ NEW: Testing Demographics (for Testing and Counseling)
  testingInfo: {
    fullName: String,
    age: Number,
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say']
    },
    location: String
  },
  // ✅ Case Manager Assignment
  assignedCaseManager: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  
  // ✅ Session Tracking
  sessionTracking: {
    sessionNumber: {
      type: Number,
      default: 1
    },
    sessionNotes: [{
      sessionNumber: Number,
      date: Date,
      time: String,
      notes: String,
      sessionSummary: {
        type: String,
        default: ''
      },
      progress: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor'],
        default: 'good'
      },
      caseManagerId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      completedAt: Date,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    totalSessions: {
      type: Number,
      default: 0
    },
    lastSessionDate: {
      type: Date,
      default: null
    }
  },
  
  // ✅ Program Completion
  programCompleted: {
    type: Boolean,
    default: false
  },
  completionNotes: {
    type: String,
    default: ''
  },
  completedAt: {
    type: Date,
    default: null
  },
  completedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Psychosocial Info (for Psychosocial support service)
  psychosocialInfo: {
    fullName: String,
    age: Number,
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say']
    },
    location: String
  },
  
  // Saturday Request
  saturdayRequest: {
    requested: {
      type: Boolean,
      default: false
    },
    reason: String,
    approved: {
      type: Boolean,
      default: null
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    processedAt: Date,
    adminNotes: String,
    requestedAt: Date
  },
  
  // Cancel Request
  cancelRequest: {
    requested: {
      type: Boolean,
      default: false
    },
    reason: String,
    approved: {
      type: Boolean,
      default: null
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    processedAt: Date,
    adminNotes: String,
    requestedAt: Date
  },
  
  bookedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
appointmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default model('Appointment', appointmentSchema);