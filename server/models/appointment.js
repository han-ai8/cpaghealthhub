// models/Appointment.js - UPDATED
import { Schema, model } from 'mongoose';

const sessionNoteSchema = new Schema({
  sessionNumber: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: String,
  notes: {
    type: String,
    required: true
  },
  sessionSummary: {  // ✅ NEW: Detailed summary
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
    ref: 'User',
    required: true
  },
  completedAt: Date,  // ✅ NEW: When session was completed
  createdAt: {
    type: Date,
    default: Date.now
  }
});

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
    type: String,
    required: true
  },
  time: {
    type: String,
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
  
  psychosocialInfo: {
    fullName: String,
    age: Number,
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say', '']
    },
    location: String
  },

  // Case Manager Assignment
  assignedCaseManager: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedAt: Date,
  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // ✅ ENHANCED Session Tracking
  sessionTracking: {
    sessionNumber: {
      type: Number,
      default: 1
    },
    isPartOfProgram: {  // ✅ NEW: Links sessions together
      type: Boolean,
      default: false
    },
    programId: {  // ✅ NEW: Links all sessions for a user
      type: String,
      default: null
    },
    sessionNotes: [sessionNoteSchema],
    totalSessions: {
      type: Number,
      default: 0
    },
    lastSessionDate: Date,
    programCompleted: {  // ✅ NEW: Track program completion
      type: Boolean,
      default: false
    },
    programCompletedAt: Date,
    programCompletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Cancellation Request
  cancelRequest: {
    requested: {
      type: Boolean,
      default: false
    },
    reason: String,
    requestedAt: Date,
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    processedAt: Date,
    approved: Boolean
  },

  // ✅ NEW: Session completion details
  completedAt: Date,
  completedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  sessionSummary: {  // ✅ For final session summary
    type: String,
    default: ''
  },

  // 🆕 Program completion tracking
  programCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  completedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  completionNotes: String,

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

appointmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default model('Appointment', appointmentSchema);