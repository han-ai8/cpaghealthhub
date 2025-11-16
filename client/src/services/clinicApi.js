// client/src/services/clinicApi.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';



// Get all clinics
export const getAllClinics = async () => {
  try {
    
    const response = await fetch(`${API_URL}/clinics`, {
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
    console.error('Error:', error);
    throw error;
  }
};

// Get clinics by municipality
export const getClinicsByMunicipality = async (municipality) => {
  try {
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
    console.error('Error:', error);
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
    console.error('Error:', error);
    throw error;
  }
};

// Create new clinic (Admin)
export const createClinic = async (clinicData) => {
  try {
    const response = await fetch(`${API_URL}/clinics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clinicData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Update clinic (Admin)
export const updateClinic = async (id, clinicData) => {
  try {
    const response = await fetch(`${API_URL}/clinics/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clinicData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Delete clinic (Admin)
export const deleteClinic = async (id) => {
  try {
    const response = await fetch(`${API_URL}/clinics/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
