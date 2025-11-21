import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Phone,
  Clock,
  ChevronDown,
  Edit,
  Trash2,
  Plus,
  X
} from 'lucide-react';
import {
  getAllClinics,
  createClinic,
  updateClinic,
  deleteClinic
} from '../../services/clinicApi'; // Adjust path as needed
import ClinicMap from '../../components/ClinicMap';

// Clean, responsive admin interface for Clinic Finder
export default function ClinicFinder() {
  const [clinicsData, setClinicsData] = useState([]);
  const [filteredClinics, setFilteredClinics] = useState([]);
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal + form state
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
    'Alfonso','Amadeo','Bacoor','Carmona', 'Cavite City', 'Dasmariñas', 'General Emilio Aguinaldo', 'General Mariano Alvarez', 'General Trias', 'Imus', 'Indang',
    'Kawit', 'Magallanes', 'Maragondon', 'Mendez', 'Naic', 'Noveleta', 'Rosario', 'Silang', 'Tagaytay', 'Tanza', 'Ternate', 'Trece Martires'
  ].sort();

  // Fetch clinics
  const fetchClinics = async () => {
    try {
      setLoading(true);
      const response = await getAllClinics();
      if (response && response.success) {
        setClinicsData(response.data || []);
      } else {
        setError('Unable to load clinics.');
      }
    } catch (err) {
      console.error('Fetch error', err);
      setError('Failed to load clinics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  // Filter logic (municipality + search)
  useEffect(() => {
    const base = selectedMunicipality
      ? clinicsData.filter(c => c.municipality === selectedMunicipality)
      : clinicsData.slice();

    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setFilteredClinics(base);
    } else {
      setFilteredClinics(
        base.filter(c => (
          (c.name || '').toLowerCase().includes(q) ||
          (c.address || '').toLowerCase().includes(q) ||
          (c.contact || '').toLowerCase().includes(q)
        ))
      );
    }
  }, [clinicsData, selectedMunicipality, searchQuery]);

  // Handlers
  const handleMunicipalityChange = (e) => {
    setSelectedMunicipality(e.target.value);
  };

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const IconSearch = (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="11" cy="11" r="7"></circle>
      <path d="M21 21l-4.35-4.35"></path>
    </svg>
  );

  const openAddModal = () => {
    setEditMode(false);
    setCurrentClinic(null);
    setFormData({
      name: '', municipality: '', address: '', contact: '', hours: 'Mon-Fri 8:00 AM - 5:00 PM', lat: '', lng: ''
    });
    setShowModal(true);
  };

  const openEditModal = (clinic) => {
    setEditMode(true);
    setCurrentClinic(clinic);
    setFormData({
      name: clinic.name || '',
      municipality: clinic.municipality || '',
      address: clinic.address || '',
      contact: clinic.contact || '',
      hours: clinic.hours || 'Mon-Fri 8:00 AM - 5:00 PM',
      lat: clinic.lat ?? '',
      lng: clinic.lng ?? ''
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name.trim() || !formData.municipality || !formData.address.trim()) {
      alert('Please fill required fields: name, municipality, and address.');
      return;
    }

    const payload = {
      ...formData,
      lat: formData.lat === '' ? null : parseFloat(formData.lat),
      lng: formData.lng === '' ? null : parseFloat(formData.lng)
    };

    try {
      if (editMode && currentClinic) {
        await updateClinic(currentClinic._id, payload);
        alert('Clinic updated successfully');
      } else {
        await createClinic(payload);
        alert('Clinic added successfully');
      }
      setShowModal(false);
      fetchClinics();
    } catch (err) {
      console.error('Save error', err);
      alert('Error saving clinic. Please try again.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteClinic(id);
      alert('Clinic deleted');
      fetchClinics();
    } catch (err) {
      console.error('Delete error', err);
      alert('Failed to delete clinic.');
    }
  };

  // Loading / Error states
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <div className="animate-pulse mb-3 h-10 w-52 bg-gradient-to-r from-blue-100 to-blue-200 rounded"></div>
          <p className="text-gray-600">Loading clinics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white p-6 rounded-lg shadow text-center max-w-xl">
          <h3 className="text-xl font-semibold text-red-600">Error</h3>
          <p className="mt-2 text-gray-600">{error}</p>
          <div className="mt-4">
            <button className="btn btn-primary" onClick={fetchClinics}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  const clinicsToShow = (selectedMunicipality || searchQuery) ? filteredClinics : clinicsData;

  return (
    <div className="min-h-screen border rounded-lg bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900">Clinic Finder Management</h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">Manage HIV Centers — Cavite</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
    {/* Municipality filter - show on mobile as full width */}
    <div className="sm:hidden">
      <select
        value={selectedMunicipality}
        onChange={handleMunicipalityChange}
        className="w-full bg-white border rounded-lg shadow-sm px-3 py-2 text-sm"
        aria-label="Filter by municipality"
      >
        <option value="">All Municipalities/Cities</option>
        {municipalities.map(m => (<option key={m} value={m}>{m}</option>))}
      </select>
    </div>

    {/* Desktop municipality filter */}
    <div className="hidden sm:flex items-center bg-white border rounded-lg shadow-sm px-3 py-2">
      <MapPin size={16} className="text-sky-600 mr-2" />
      <select
        value={selectedMunicipality}
        onChange={handleMunicipalityChange}
        className="bg-transparent outline-none text-sm"
        aria-label="Filter by municipality"
      >
        <option value="">All Municipalities/Cities</option>
        {municipalities.map(m => (<option key={m} value={m}>{m}</option>))}
      </select>
    </div>

    {/* Search box */}
    <div className="flex items-center bg-white border rounded-lg shadow-sm px-3 py-2 flex-1 sm:flex-initial">
      <IconSearch className="text-slate-400 mr-2 flex-shrink-0" />
      <input
        value={searchQuery}
        onChange={handleSearchChange}
        className="outline-none text-sm w-full sm:w-48 lg:w-72"
        placeholder="Search..."
        aria-label="Search clinics"
      />
    </div>

    <button
      onClick={openAddModal}
      className="inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 rounded-lg shadow text-sm md:text-base"
    >
      <Plus size={16} className="flex-shrink-0" /> 
      <span className="hidden sm:inline">Add Clinic</span>
      <span className="sm:hidden">Add</span>
    </button>
          </div>
        </header>

        <main className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: List / Cards */}
          <section className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-lg">HIV Centers</h2>
                <span className="text-sm text-slate-500">{clinicsToShow.length} results</span>
              </div>

              {clinicsToShow.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No clinics found.</div>
              ) : (
                <ul className="space-y-3">
                  {clinicsToShow.map(clinic => (
                    <li key={clinic._id} className="block bg-white border rounded-lg p-3 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-medium text-slate-900 truncate">{clinic.name}</h3>
                            <div className="flex gap-2">
                              <button onClick={() => openEditModal(clinic)} className="inline-flex items-center gap-1 text-sm px-2 py-1 border rounded text-sky-700">
                                <Edit size={14} /> Edit
                              </button>
                              <button onClick={() => handleDelete(clinic._id, clinic.name)} className="inline-flex items-center gap-1 text-sm px-2 py-1 border rounded text-red-600">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-slate-500 mt-1 truncate">{clinic.municipality} • {clinic.address}</p>

                          <div className="flex items-center gap-3 mt-3 text-xs text-slate-600">
                            <span className="inline-flex items-center gap-1"><Phone size={14} /> {clinic.contact || '—'}</span>
                            <span className="inline-flex items-center gap-1"><Clock size={14} /> {clinic.hours || '—'}</span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Right: Map + details */}
          <section className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Clinic Locations Map</h2>
                <div className="text-sm text-slate-500">Interact to view clinic details</div>
              </div>

              <div className="h-72 sm:h-96 md:h-[520px] rounded overflow-hidden border">
                <ClinicMap
                  clinics={selectedMunicipality || searchQuery ? filteredClinics : clinicsData}
                  selectedMunicipality={selectedMunicipality}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="text-sm text-slate-600">Tip: Click a marker for details. Use the search and filters to refine results.</div>

                <div className="flex gap-3">
                  <button onClick={() => { setSelectedMunicipality(''); setSearchQuery(''); }} className="px-3 py-2 border rounded text-sm">Reset Filters</button>
                  <button onClick={openAddModal} className="px-3 py-2 rounded text-sm bg-emerald-600 text-white">Quick Add</button>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Modal (Add/Edit) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowModal(false)} />

          <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{editMode ? 'Edit Clinic' : 'Add Clinic'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Clinic Name *</label>
                  <input name="name" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full border rounded px-3 py-2" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Municipality *</label>
                  <select name="municipality" value={formData.municipality} onChange={handleInputChange} className="mt-1 block w-full border rounded px-3 py-2" required>
                    <option value="">Select Municipality</option>
                    {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Address *</label>
                <input name="address" value={formData.address} onChange={handleInputChange} className="mt-1 block w-full border rounded px-3 py-2" required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Contact Number</label>
                  <input name="contact" value={formData.contact} onChange={handleInputChange} className="mt-1 block w-full border rounded px-3 py-2" placeholder="(046) 123-4567" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Operating Hours</label>
                  <input name="hours" value={formData.hours} onChange={handleInputChange} className="mt-1 block w-full border rounded px-3 py-2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Latitude</label>
                  <input name="lat" type="number" step="any" value={formData.lat} onChange={handleInputChange} className="mt-1 block w-full border rounded px-3 py-2" placeholder="14.1234" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Longitude</label>
                  <input name="lng" type="number" step="any" value={formData.lng} onChange={handleInputChange} className="mt-1 block w-full border rounded px-3 py-2" placeholder="120.5678" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-sky-600 text-white">{editMode ? 'Update' : 'Add'} Clinic</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
