// src/components/AdminSidebar.jsx
import { Link, useLocation } from 'react-router-dom';
import {
  HiOutlineViewGrid,
  HiOutlineUser,
  HiOutlineUsers,
  HiOutlineCalendar,
  HiOutlineLocationMarker,
  HiOutlineCog,
  HiOutlineChat,
  HiOutlineClipboardList,
  HiOutlineChartBar,
  HiOutlineQuestionMarkCircle, // ✅ NEW: Icon for FAQ
} from 'react-icons/hi';

const AdminSidebar = ({ role, isOpen, onClose }) => {
  const location = useLocation();

  const menuItems = [
    // === ADMIN ONLY ===
    {
      name: 'HIV Analytics',
      path: '/admin/hiv-analytics',
      icon: HiOutlineChartBar,
      roles: ['admin'],
    },
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: HiOutlineViewGrid,
      roles: ['admin'],
    },
    {
      name: 'Articles',
      path: '/admin/articles',
      icon: HiOutlineViewGrid,
      roles: ['admin'], 
    },
    {
      name: 'User Management',
      path: '/admin/users',
      icon: HiOutlineUser,
      roles: ['admin'],
    },
    {
      name: 'Staff Management',
      path: '/admin/staff-management',
      icon: HiOutlineUsers,
      roles: ['admin'],
    },
    {
      name: 'Appointments',
      path: '/admin/appointments',
      icon: HiOutlineCalendar,
      roles: ['admin'],
    },
    {
      name: 'Holidays Schedule',
      path: '/admin/clinic-schedule',
      icon: HiOutlineCalendar,
      roles: ['admin'],
    },
    {
      name: 'Clinic Finder',
      path: '/admin/clinics',
      icon: HiOutlineLocationMarker,
      roles: ['admin'],
    },
    
    // === CONTENT MODERATOR ===
    {
      name: 'Community Forum',
      path: '/admin/community',
      icon: HiOutlineUsers,
      roles: ['admin', 'content_moderator'],
    },
    
    // === CASE MANAGER ===
    {
      name: 'My Planner',
      path: '/admin/planner',
      icon: HiOutlineClipboardList,
      roles: ['case_manager'],
    },
    {
      name: 'Messages',
      path: '/admin/messages',
      icon: HiOutlineChat,
      roles: ['case_manager'],
    },
    
    // === ADMIN ONLY (Settings removed for staff) ===
    {
      name: 'Settings',
      path: '/admin/settings',
      icon: HiOutlineCog,
      roles: ['admin'],
    },
    
    // ✅ NEW: FAQ - Available to all admin roles
    {
      name: 'FAQ',
      path: '/admin/faq',
      icon: HiOutlineQuestionMarkCircle,
      roles: ['admin', 'content_moderator', 'case_manager'],
    }
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(role));

  const handleLinkClick = () => {
    // Close mobile menu when a link is clicked
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* 📱 Overlay for mobile - Close menu when clicking outside */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* 🎨 Sidebar - Slides in/out on mobile, always visible on desktop */}
      <aside
        className={`
          fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] w-60 bg-base-200 shadow-xl 
          flex flex-col justify-between transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <nav className="mt-6 flex-1 overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <ul className="menu menu-lg px-4 space-y-1">
            {filteredMenuItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={handleLinkClick}
                    className={`flex items-center space-x-3 rounded-lg py-2 px-3 transition-all ${
                      isActive 
                        ? 'bg-primary text-primary-content shadow-lg' 
                        : 'hover:bg-primary-focus hover:shadow-md'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-[#4C8DD8]/20 p-4 mt-auto bg-[#FFFFFF]/95">
          <div className="flex flex-col items-center">
            <p className="text-xs text-[#4C8DD8]">
              Role: <span className="font-bold uppercase">{role.replace('_', ' ')}</span>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;