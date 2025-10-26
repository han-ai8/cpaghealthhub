// Admin ClinicFinder.jsx
import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, ChevronDown, Edit, Trash2, Plus } from 'lucide-react';
import { 
  getAllClinics, 
  createClinic, 
  updateClinic, 
  deleteClinic 
} from '../../services/clinicApi'; // Adjust path as needed
import ClinicMap from '../../components/ClinicMap';

const ClinicFinder = () => {
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [clinicsData, setClinicsData] = useState([]);
  const [filteredClinics, setFilteredClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentClinic, setCurrentClinic] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    municipality: '',
    address: '',
    contact: '',
    hours: 'Mon-Fri 8:00 AM - 5:00 PM',
    lat: '',
    lng: ''
  });

  const municipalities = [
    "Bacoor", "Cavite City", "Dasmariñas", "General Trias", "Imus",
    "Kawit", "Naic", "Noveleta", "Rosario", "Silang", "Tagaytay", "Trece Martires"
  ].sort();

  // Fetch clinics from backend
  const fetchClinics = async () => {
    try {
      setLoading(true);
      const response = await getAllClinics();
      if (response.success) {
        setClinicsData(response.data);
      }
    } catch (err) {
      setError('Failed to load clinics. Please try again later.');
      console.error('Error fetching clinics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  const handleMunicipalityChange = (e) => {
    const municipality = e.target.value;
    setSelectedMunicipality(municipality);

    if (!municipality) {
      setFilteredClinics([]);
    } else {
      setFilteredClinics(clinicsData.filter(c => c.municipality === municipality));
    }
  };

  // Open modal for adding new clinic
  const handleAddClick = () => {
    setEditMode(false);
    setCurrentClinic(null);
    setFormData({
      name: '',
      municipality: '',
      address: '',
      contact: '',
      hours: 'Mon-Fri 8:00 AM - 5:00 PM',
      lat: '',
      lng: ''
    });
    setShowModal(true);
  };

  // Open modal for editing clinic
  const handleEditClick = (clinic) => {
    setEditMode(true);
    setCurrentClinic(clinic);
    setFormData({
      name: clinic.name,
      municipality: clinic.municipality,
      address: clinic.address,
      contact: clinic.contact,
      hours: clinic.hours,
      lat: clinic.lat,
      lng: clinic.lng
    });
    setShowModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Convert lat and lng to numbers
      const clinicData = {
        ...formData,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng)
      };

      if (editMode && currentClinic) {
        // Update existing clinic
        await updateClinic(currentClinic._id, clinicData);
        alert('Clinic updated successfully!');
      } else {
        // Create new clinic
        await createClinic(clinicData);
        alert('Clinic added successfully!');
      }

      setShowModal(false);
      fetchClinics(); // Refresh the list
    } catch (err) {
      alert('Error saving clinic. Please try again.');
      console.error('Error saving clinic:', err);
    }
  };

  // Handle delete clinic
  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteClinic(id);
        alert('Clinic deleted successfully!');
        fetchClinics(); // Refresh the list
      } catch (err) {
        alert('Error deleting clinic. Please try again.');
        console.error('Error deleting clinic:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-xl font-semibold">Loading clinics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="page-header mb-6">
          <h1 className="text-3xl font-bold">Clinic Finder Management</h1>
          <p className="text-gray-600 mt-2">Manage HIV Centers in Cavite</p>
        </div>

        {/* Municipality Filter */}
        <div className="mb-6 w-full max-w-sm relative">
          <label htmlFor="municipality" className="block text-sm font-medium mb-1">Filter by Municipality</label>
          <select
            id="municipality"
            value={selectedMunicipality}
            onChange={handleMunicipalityChange}
            className="select select-bordered w-full"
          >
            <option value="">All Municipalities in Cavite</option>
            {municipalities.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Clinic List Section */}
        <section className="clinic-list bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Available HIV Centers in Cavite</h2>
            <button 
              onClick={handleAddClick}
              className="btn btn-primary gap-2"
            >
              <Plus size={20} />
              Add Clinic
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Municipality</th>
                  <th>Location</th>
                  <th>Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(selectedMunicipality ? filteredClinics : clinicsData).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      No clinics found.
                    </td>
                  </tr>
                ) : (
                  (selectedMunicipality ? filteredClinics : clinicsData).map((clinic) => (
                    <tr key={clinic._id}>
                      <td className="font-medium">{clinic.name}</td>
                      <td>{clinic.municipality}</td>
                      <td>{clinic.address}</td>
                      <td>{clinic.contact}</td>
                      <td>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditClick(clinic)}
                            className="btn btn-sm btn-info gap-1"
                          >
                            <Edit size={16} />
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(clinic._id, clinic.name)}
                            className="btn btn-sm btn-error gap-1"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Map Section */}
        <section className="clinic-map bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Clinic Locations Map</h2>
          <div className="h-[500px] rounded-lg overflow-hidden">
            <ClinicMap 
              clinics={selectedMunicipality ? filteredClinics : clinicsData}
              selectedMunicipality={selectedMunicipality}
            />
          </div>
        </section>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              {editMode ? 'Edit Clinic' : 'Add New Clinic'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Clinic Name *</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input input-bordered"
                  required
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Municipality *</span>
                </label>
                <select
                  name="municipality"
                  value={formData.municipality}
                  onChange={handleInputChange}
                  className="select select-bordered"
                  required
                >
                  <option value="">Select Municipality</option>
                  {municipalities.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Address *</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="input input-bordered"
                  required
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Contact Number *</span>
                </label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  className="input input-bordered"
                  placeholder="(046) 123-4567"
                  required
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Operating Hours</span>
                </label>
                <input
                  type="text"
                  name="hours"
                  value={formData.hours}
                  onChange={handleInputChange}
                  className="input input-bordered"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Latitude *</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="lat"
                    value={formData.lat}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    placeholder="14.1234"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Longitude *</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="lng"
                    value={formData.lng}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    placeholder="120.5678"
                    required
                  />
                </div>
              </div>

              <div className="modal-action">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="btn"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                >
                  {editMode ? 'Update' : 'Add'} Clinic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicFinder;