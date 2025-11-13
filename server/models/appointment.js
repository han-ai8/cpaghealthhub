// models/appointment.js - UPDATED WITH CONTACT NUMBER
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

  // ✅ REMOVED HIV Status Tracking
  
  // ✅ UPDATED: Testing Demographics (for Testing and Counseling)
  testingInfo: {
    fullName: String,
    age: Number,
    gender: String, // ✅ Now supports 72 gender identities
    location: String,
    contactNumber: String // ✅ NEW
  },
  
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
  
  // ✅ UPDATED: Psychosocial Info (for Psychosocial support service)
  psychosocialInfo: {
    fullName: String,
    age: Number,
    gender: String, // ✅ Now supports 72 gender identities
    location: String,
    contactNumber: String // ✅ NEW
  },
  
  // ✅ UPDATED: Saturday Request with admin response
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
    adminResponse: String, // ✅ NEW: Admin's response to user
    requestedAt: Date
  },
  
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

appointmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default model('Appointment', appointmentSchema);