import Clinic from '../models/Clinic.js';
import User from '../models/User.js'; 

// Get all clinics
export const getAllClinics = async (req, res) => {
  try {
    console.log('📍 GET /api/clinics - Fetching all clinics');
    const clinics = await Clinic.find().sort({ municipality: 1, name: 1 });
    console.log(`✅ Found ${clinics.length} clinics`);
    res.status(200).json({
      success: true,
      data: clinics
    });
  } catch (error) {
    console.error('❌ Error in getAllClinics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching clinics',
      error: error.message
    });
  }
};

// Get clinics by municipality
export const getClinicsByMunicipality = async (req, res) => {
  try {
    const { municipality } = req.params;
    console.log(`📍 GET /api/clinics/municipality/${municipality}`);
    const clinics = await Clinic.find({ municipality }).sort({ name: 1 });
    res.status(200).json({
      success: true,
      data: clinics
    });
  } catch (error) {
    console.error('❌ Error in getClinicsByMunicipality:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching clinics',
      error: error.message
    });
  }
};

// Get single clinic by ID
export const getClinicById = async (req, res) => {
  try {
    console.log(`📍 GET /api/clinics/${req.params.id}`);
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clinic not found'
      });
    }
    res.status(200).json({
      success: true,
      data: clinic
    });
  } catch (error) {
    console.error('❌ Error in getClinicById:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching clinic',
      error: error.message
    });
  }
};


export const createClinic = async (req, res) => {
  try {
    console.log('📍 POST /api/clinics - Creating new clinic');
    console.log('Request body:', req.body);
    
    const { name, municipality, address, contact, hours, lat, lng } = req.body;

    if (!name || !municipality || !address || !contact || !lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, municipality, address, contact, lat, lng'
      });
    }

    const clinic = await Clinic.create({
      name,
      municipality,
      address,
      contact,
      hours: hours || 'Mon-Fri 8:00 AM - 5:00 PM',
      lat,
      lng
    });

    // ✅ ADD THIS: Send notifications to all users
    const notificationService = req.app.get('notificationService');
    const allUsers = await User.find({ role: 'user' }).select('_id');
    const userIds = allUsers.map(u => u._id);
    
    await notificationService.notifyNewClinic(clinic, userIds);
    console.log(`✅ Sent ${userIds.length} notifications for new clinic`);

    console.log('✅ Clinic created successfully:', clinic._id);
    res.status(201).json({
      success: true,
      message: 'Clinic created successfully',
      data: clinic
    });
  } catch (error) {
    console.error('❌ Error in createClinic:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating clinic',
      error: error.message
    });
  }
};


// Update clinic
export const updateClinic = async (req, res) => {
  try {
    console.log(`📍 PUT /api/clinics/${req.params.id} - Updating clinic`);
    const { name, municipality, address, contact, hours, lat, lng } = req.body;

    const clinic = await Clinic.findByIdAndUpdate(
      req.params.id,
      { name, municipality, address, contact, hours, lat, lng },
      { new: true, runValidators: true }
    );

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clinic not found'
      });
    }

    console.log('✅ Clinic updated successfully');
    res.status(200).json({
      success: true,
      message: 'Clinic updated successfully',
      data: clinic
    });
  } catch (error) {
    console.error('❌ Error in updateClinic:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating clinic',
      error: error.message
    });
  }
};

// Delete clinic
export const deleteClinic = async (req, res) => {
  try {
    console.log(`📍 DELETE /api/clinics/${req.params.id} - Deleting clinic`);
    const clinic = await Clinic.findByIdAndDelete(req.params.id);

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clinic not found'
      });
    }

    console.log('✅ Clinic deleted successfully');
    res.status(200).json({
      success: true,
      message: 'Clinic deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error in deleteClinic:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting clinic',
      error: error.message
    });
  }
};