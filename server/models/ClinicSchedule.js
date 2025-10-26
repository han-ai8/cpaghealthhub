// models/ClinicSchedule.js - Admin calendar management model
import mongoose from 'mongoose';

const clinicScheduleSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['closure', 'special_opening', 'holiday'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  date: {
    type: Date  // For single-day events
  },
  reason: {
    type: String,
    default: ''
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
clinicScheduleSchema.index({ startDate: 1, endDate: 1 });
clinicScheduleSchema.index({ isActive: 1 });

const ClinicSchedule = mongoose.model('ClinicSchedule', clinicScheduleSchema);

export default ClinicSchedule;