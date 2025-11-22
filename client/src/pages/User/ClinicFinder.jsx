import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, ChevronDown } from 'lucide-react';
import { getAllClinics } from '../../services/clinicApi';
import ClinicMap from '../../components/ClinicMap';

const ClinicFinder = () => {
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [clinicsData, setClinicsData] = useState([]);
  const [filteredClinics, setFilteredClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const municipalities = [
    "Bacoor", "Cavite City", "Dasmariñas", "General Trias", "Imus",
    "Kawit", "Naic", "Noveleta", "Rosario", "Silang", "Tagaytay", "Trece Martires"
  ].sort();

  useEffect(() => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-200 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-xl font-semibold dark:text-gray-200">Loading clinics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blue-200 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-xl font-semibold text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-200 flex flex-col items-center">
      <div className="w-full max-w-6xl bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 p-6">
        <h1 className="text-xl font-bold mb-5 dark:text-white">Available HIV Center in Cavite</h1>

        {/* Municipality Dropdown */}
        <div className="mb-6 w-full max-w-sm relative">
          <label htmlFor="municipality" className="block text-sm font-medium mb-1 dark:text-gray-200">
            Select Municipality
          </label>
          <select
            id="municipality"
            value={selectedMunicipality}
            onChange={handleMunicipalityChange}
            className="w-full px-4 py-3 border rounded-lg appearance-none cursor-pointer bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Municipalities in Cavite</option>
            {municipalities.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <ChevronDown className="absolute top-[38px] right-3 text-gray-400 dark:text-gray-500 pointer-events-none" size={20} />
        </div>

        {/* Clinic Table */}
        <div className="overflow-x-auto border dark:border-gray-700 rounded-lg">
          <table className="w-full table-auto text-left">
            <thead className="bg-green-200 dark:bg-green-900">
              <tr>
                <th className="p-3 font-semibold dark:text-green-100">Name</th>
                <th className="p-3 font-semibold dark:text-green-100">Location</th>
                <th className="p-3 font-semibold dark:text-green-100">Contact</th>
              </tr>
            </thead>
            <tbody className="dark:text-gray-200">
              {(selectedMunicipality ? filteredClinics : clinicsData).length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No clinics found in this municipality.
                  </td>
                </tr>
              ) : (
                (selectedMunicipality ? filteredClinics : clinicsData).map((clinic) => (
                  <tr key={clinic._id} className="border-t dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-900/30">
                    <td className="p-3">{clinic.name}</td>
                    <td className="p-3">{clinic.address}</td>
                    <td className="p-3">{clinic.contact}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Map */}
        <div className="mt-6 h-[400px] rounded-lg overflow-hidden shadow-md dark:shadow-gray-900/50">
          <ClinicMap 
            clinics={selectedMunicipality ? filteredClinics : clinicsData}
            selectedMunicipality={selectedMunicipality}
          />
        </div>
      </div>
    </div>
  );
};

export default ClinicFinder;