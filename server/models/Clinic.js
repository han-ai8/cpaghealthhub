// models/Clinic.js
import mongoose from 'mongoose';

const clinicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  municipality: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  contact: {
    type: String,
    required: true,
    trim: true
  },
  hours: {
    type: String,
    default: 'Mon-Fri 8:00 AM - 5:00 PM'
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Clinic', clinicSchema);