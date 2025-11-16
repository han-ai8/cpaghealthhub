// scripts/seedClinics.js
// Run this file once to populate your database with initial clinic data
// node scripts/seedClinics.js

import mongoose from 'mongoose';
import Clinic from '../models/Clinic.js';
import dotenv from 'dotenv';

dotenv.config();

const clinicsData = [
  { name: "Cavite Provincial Hospital", municipality: "Trece Martires", address: "Trece Martires City, Cavite", contact: "(046) 419-1222", hours: "Mon-Fri 8:00 AM - 5:00 PM", lat: 14.2825, lng: 120.8667 },
  { name: "General Emilio Aguinaldo Memorial Hospital", municipality: "Trece Martires", address: "Governor's Drive, Trece Martires City", contact: "(046) 419-0228", hours: "24/7 Emergency Services", lat: 14.2856, lng: 120.8623 },
  { name: "Bacoor District Hospital", municipality: "Bacoor", address: "Tirona Highway, Bacoor City, Cavite", contact: "(046) 417-3964", hours: "Mon-Sat 8:00 AM - 5:00 PM", lat: 14.4595, lng: 120.9447 },
  { name: "Bacoor Health Center", municipality: "Bacoor", address: "Aguinaldo Highway, Bacoor City", contact: "(046) 417-2156", hours: "Mon-Fri 7:00 AM - 4:00 PM", lat: 14.4637, lng: 120.9518 },
  { name: "Imus Community Hospital", municipality: "Imus", address: "Nueno Avenue, Imus City, Cavite", contact: "(046) 471-2034", hours: "24/7 Services Available", lat: 14.4297, lng: 120.9367 },
  { name: "De La Salle Medical Center", municipality: "Dasmariñas", address: "Congressional Road, Dasmariñas City", contact: "(046) 416-0211", hours: "24/7 Emergency & HIV Testing", lat: 14.3294, lng: 120.9367 },
  { name: "Dasmariñas City Health Office", municipality: "Dasmariñas", address: "City Hall Complex, Dasmariñas", contact: "(046) 416-0639", hours: "Mon-Fri 8:00 AM - 5:00 PM", lat: 14.3325, lng: 120.9408 },
  { name: "Kawit Municipal Health Center", municipality: "Kawit", address: "Municipal Hall, Kawit, Cavite", contact: "(046) 484-0157", hours: "Mon-Fri 8:00 AM - 5:00 PM", lat: 14.4425, lng: 120.9033 },
  { name: "Rosario Community Hospital", municipality: "Rosario", address: "Tejeros Convention, Rosario, Cavite", contact: "(046) 437-7181", hours: "Mon-Sat 8:00 AM - 6:00 PM", lat: 14.4147, lng: 120.855 },
  { name: "General Trias District Hospital", municipality: "General Trias", address: "Governor's Drive, General Trias City", contact: "(046) 509-1234", hours: "24/7 Services", lat: 14.3869, lng: 120.8811 },
  { name: "Silang Rural Health Unit", municipality: "Silang", address: "Municipal Complex, Silang, Cavite", contact: "(046) 414-0156", hours: "Mon-Fri 8:00 AM - 5:00 PM", lat: 14.2306, lng: 120.9769 },
  { name: "Tagaytay City Health Center", municipality: "Tagaytay", address: "City Hall Compound, Tagaytay City", contact: "(046) 483-0248", hours: "Mon-Fri 8:00 AM - 5:00 PM", lat: 14.11, lng: 120.9603 },
  { name: "Cavite City Health Office", municipality: "Cavite City", address: "City Hall, Cavite City", contact: "(046) 431-5445", hours: "Mon-Fri 8:00 AM - 5:00 PM", lat: 14.4791, lng: 120.8989 },
  { name: "Noveleta Municipal Health Center", municipality: "Noveleta", address: "Municipal Hall, Noveleta, Cavite", contact: "(046) 434-1287", hours: "Mon-Fri 8:00 AM - 5:00 PM", lat: 14.4297, lng: 120.8778 },
  { name: "Naic Rural Health Unit", municipality: "Naic", address: "Municipal Complex, Naic, Cavite", contact: "(046) 412-0345", hours: "Mon-Fri 7:30 AM - 4:30 PM", lat: 14.3186, lng: 120.7669 }
];

const seedClinics = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
 
    // Clear existing clinics
    await Clinic.deleteMany({});
   
    // Insert new clinics
    await Clinic.insertMany(clinicsData);
  
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

seedClinics();