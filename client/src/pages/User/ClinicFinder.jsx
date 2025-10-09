import React, { useState } from 'react';
import { MapPin, Phone, Clock, ChevronDown } from 'lucide-react';

const ClinicFinder = () => {
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [filteredClinics, setFilteredClinics] = useState([]);

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

  const municipalities = [
    "Bacoor", "Cavite City", "Dasmariñas", "General Trias", "Imus",
    "Kawit", "Naic", "Noveleta", "Rosario", "Silang", "Tagaytay", "Trece Martires"
  ].sort();

  const handleMunicipalityChange = (e) => {
    const municipality = e.target.value;
    setSelectedMunicipality(municipality);

    if (!municipality) {
      setFilteredClinics([]);
    } else {
      setFilteredClinics(clinicsData.filter(c => c.municipality === municipality));
    }
  };

  // Google Maps embed URL for multiple markers
  const getMapUrl = () => {
    const displayClinics = selectedMunicipality ? filteredClinics : clinicsData;
    if (displayClinics.length === 0) {
      return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dN93LiL76rL_Dw&q=Cavite,Philippines&zoom=10`;
    }
    const center = `${displayClinics[0].lat},${displayClinics[0].lng}`;
    const markers = displayClinics.map(c => `markers=color:red%7Clabel:H%7C${c.lat},${c.lng}`).join('&');
    return `https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dN93LiL76rL_Dw&center=${center}&zoom=${selectedMunicipality ? 13 : 10}&${markers}`;
  };

  return (
    <div className="min-h-screen bg-blue-200 p-6 flex flex-col items-center">
      <div className="w-full max-w-7xl bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-xl font-bold mb-5">Available HIV Center in Cavite</h1>

        {/* Municipality Dropdown */}
        <div className="mb-6 w-full max-w-sm relative">
          <label htmlFor="municipality" className="block text-sm font-medium mb-1">Select Municipality</label>
          <select
            id="municipality"
            value={selectedMunicipality}
            onChange={handleMunicipalityChange}
            className="w-full px-4 py-3 border rounded-lg appearance-none cursor-pointer bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Municipalities in Cavite</option>
            {municipalities.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <ChevronDown className="absolute top-[38px] right-3 text-gray-400 pointer-events-none" size={20} />
        </div>

        {/* Clinic Table */}
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full table-auto text-left">
            <thead className="bg-green-200">
              <tr>
                <th className="p-3 font-semibold">Name</th>
                <th className="p-3 font-semibold">Location</th>
                <th className="p-3 font-semibold">Contact</th>
              </tr>
            </thead>
            <tbody>
              {(selectedMunicipality ? filteredClinics : clinicsData).length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-gray-500">
                    No clinics found in this municipality.
                  </td>
                </tr>
              ) : (
                (selectedMunicipality ? filteredClinics : clinicsData).map((clinic, index) => (
                  <tr key={index} className="border-t hover:bg-green-50">
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
        <div className="mt-6 h-[400px] rounded-lg overflow-hidden shadow-md">
          <iframe
            title="Cavite HIV Clinics Map"
            src={getMapUrl()}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
};

export default ClinicFinder;