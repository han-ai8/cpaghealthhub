// src/components/AdminHeader.jsx
import { useState } from 'react';
import { HiMenu, HiX } from 'react-icons/hi';
import logoHeader from '../assets/logo-header.png';
const AdminHeader = ({ username, onLogout, onMenuToggle, isMenuOpen }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50 flex items-center justify-between px-6 h-16">
      {/* Left Side: Burger Menu + Logo */}
      <div className="flex items-center space-x-4">
        {/* 🍔 Burger Menu Button - Only visible on mobile */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-gray-700 hover:text-primary p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <HiX className="w-6 h-6" />
          ) : (
            <HiMenu className="w-6 h-6" />
          )}
        </button>

        {/* Logo */}
        <img 
          src={logoHeader}
          alt="Logo" 
          className="w-20 h-5 md:w-30 md:h-15 lg:w-60 lg:h-10 hover:scale-105 transition-transform duration-200" 
        />
      </div>

      {/* Right Side: User Dropdown */}
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