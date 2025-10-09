// src/components/AdminHeader.jsx
import { useState } from 'react';

const AdminHeader = ({ username, onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50 flex items-center justify-between px-6 h-16">
      <div className="flex items-center space-x-4">
        <div className="text-xl font-bold text-green-700">HEALTH & HUB</div>
        <div className="text-lg font-semibold">Dashboard</div>
      </div>

      <div className="relative">
        <button
          onClick={() => setDropdownOpen(prev => !prev)}
          className="flex items-center space-x-2 rounded-full bg-red-600 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <div className="w-8 h-8 rounded-full bg-red-800 flex items-center justify-center font-bold uppercase">
            {username ? username.charAt(0) : 'A'}
          </div>
          <span className="hidden md:inline-block">{username || 'Admin'}</span>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-36 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <button
            onClick={onLogout}
            className="block w-full px-4 py-2 text-left text-red-600 font-semibold hover:bg-red-50"
          >
            Logout
          </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;