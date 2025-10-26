// models/Appointment.js - Complete with case manager assignment
import mongoose from 'mongoose';

const sessionNoteSchema = new mongoose.Schema({
  sessionNumber: {
    type: Number,
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
  summary: {
    type: String,
    required: true
  },
  progress: {
    type: String,
    enum: ['poor', 'fair', 'good', 'excellent'],
    required: true
  },
  nextSteps: {
    type: String,
    default: ''
  },
  caseManagerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const appointmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: String,
    required: true,
    enum: ['Testing and Counseling', 'Psychosocial support and assistance']
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
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  
  // Case Manager Assignment
  assignedCaseManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Session tracking for Psychosocial support
  sessionTracking: {
    isFollowUp: {
      type: Boolean,
      default: false
    },
    parentAppointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
    },
    sessionNumber: {
      type: Number,
      default: 1
    },
    totalSessions: {
      type: Number,
      default: 1
    },
    sessionNotes: [sessionNoteSchema],
    overallProgress: {
      type: String,
      enum: ['initial', 'improving', 'stable', 'needs_attention', 'completed'],
      default: 'initial'
    }
  },
  
  cancelRequest: {
    requested: {
      type: Boolean,
      default: false
    },
    reason: String,
    requestedAt: Date,
    adminResponse: String,
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  bookedAt: {
    type: Date,
    default: Date.now
  },
  confirmedAt: Date,
  cancelledAt: Date,
  completedAt: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for faster queries
appointmentSchema.index({ user: 1, status: 1 });
appointmentSchema.index({ date: 1, time: 1 });
appointmentSchema.index({ 'sessionTracking.parentAppointmentId': 1 });
appointmentSchema.index({ assignedCaseManager: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;