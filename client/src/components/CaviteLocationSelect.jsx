import React from 'react';

const CAVITE_LOCATIONS = [
  'Alfonso',
  'Amadeo',
  'Bacoor',
  'Carmona',
  'Cavite City',
  'Dasmariñas',
  'General Emilio Aguinaldo',
  'General Mariano Alvarez',
  'General Trias',
  'Imus',
  'Indang',
  'Kawit',
  'Magallanes',
  'Maragondon',
  'Mendez',
  'Naic',
  'Noveleta',
  'Rosario',
  'Silang',
  'Tagaytay City',
  'Tanza',
  'Ternate',
  'Trece Martires City'
].sort();

const CaviteLocationSelect = ({ value, onChange, className = '', required = false }) => {
  return (
    <select
      value={value}
      onChange={onChange}
      className={className}
      required={required}
    >
      <option value="">Select Municipality/City</option>
      {CAVITE_LOCATIONS.map((location) => (
        <option key={location} value={location}>
          {location}
        </option>
      ))}
    </select>
  );
};

export default CaviteLocationSelect;