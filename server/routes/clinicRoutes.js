import express from 'express';
import {
  getAllClinics,
  getClinicsByMunicipality,
  getClinicById,
  createClinic,
  updateClinic,
  deleteClinic
} from '../controllers/clinicController.js';

const router = express.Router();

// Public routes
router.get('/', getAllClinics);
router.get('/municipality/:municipality', getClinicsByMunicipality);
router.get('/:id', getClinicById);

// Admin routes
router.post('/', createClinic);
router.put('/:id', updateClinic);
router.delete('/:id', deleteClinic);

export default router;