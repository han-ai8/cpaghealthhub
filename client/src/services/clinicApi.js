// client/src/services/clinicApi.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('🔗 API_URL configured as:', API_URL);

// Get all clinics
export const getAllClinics = async () => {
  try {
    console.log('📡 Fetching clinics from:', `${API_URL}/clinics`);
    const response = await fetch(`${API_URL}/clinics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Clinics fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching clinics:', error);
    throw error;
  }
};

// Get clinics by municipality
export const getClinicsByMunicipality = async (municipality) => {
  try {
    console.log('📡 Fetching clinics for municipality:', municipality);
    const response = await fetch(`${API_URL}/clinics/municipality/${municipality}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error fetching clinics by municipality:', error);
    throw error;
  }
};

// Get single clinic by ID
export const getClinicById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/clinics/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error fetching clinic:', error);
    throw error;
  }
};

// Create new clinic (Admin)
export const createClinic = async (clinicData) => {
  try {
    console.log('📡 Creating clinic:', clinicData);
    console.log('📡 POST to:', `${API_URL}/clinics`);
    
    const response = await fetch(`${API_URL}/clinics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clinicData),
    });
    
    console.log('📡 Create response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Server error response:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Clinic created successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error creating clinic:', error);
    throw error;
  }
};

// Update clinic (Admin)
export const updateClinic = async (id, clinicData) => {
  try {
    console.log('📡 Updating clinic:', id, clinicData);
    
    const response = await fetch(`${API_URL}/clinics/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clinicData),
    });
    
    console.log('📡 Update response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Clinic updated successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error updating clinic:', error);
    throw error;
  }
};

// Delete clinic (Admin)
export const deleteClinic = async (id) => {
  try {
    console.log('📡 Deleting clinic:', id);
    
    const response = await fetch(`${API_URL}/clinics/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📡 Delete response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Clinic deleted successfully');
    return data;
  } catch (error) {
    console.error('❌ Error deleting clinic:', error);
    throw error;
  }
};
