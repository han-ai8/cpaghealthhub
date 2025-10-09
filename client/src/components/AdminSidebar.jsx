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
} from 'react-icons/hi';

const AdminSidebar = ({ role }) => {
  const location = useLocation();

  // Define menu items by roles
  const menuItems = [
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: HiOutlineViewGrid,
      roles: ['admin', 'content-moderator', 'case-manager'],
    },
    {
      name: 'User Management',
      path: '/admin/users',
      icon: HiOutlineUser,
      roles: ['admin'],
    },
    {
      name: 'Community Forum',
      path: '/admin/community',
      icon: HiOutlineUsers,
      roles: ['admin', 'content-moderator'],
    },
    {
      name: 'Appointments',
      path: '/admin/appointments',
      icon: HiOutlineCalendar,
      roles: ['admin', 'case-manager'],
    },
    {
      name: 'Clinic Finder',
      path: '/admin/clinics',
      icon: HiOutlineLocationMarker,
      roles: ['admin'],
    },
    {
      name: 'Schedule',
      path: '/admin/schedule',
      icon: HiOutlineClipboardList,
      roles: ['admin', 'case-manager'],
    },
    {
      name: 'Messages',
      path: '/admin/messages',
      icon: HiOutlineChat,
      roles: ['case-manager'],
    },
    {
      name: 'Settings',
      path: '/admin/settings',
      icon: HiOutlineCog,
      roles: ['admin', 'content-moderator', 'case-manager'],
    }
  ];

  return (
    <aside className="fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] w-60 bg-base-200 shadow-xl flex flex-col justify-between">
      <nav className="mt-6 flex-1 overflow-y-auto">
        <ul className="menu menu-lg px-4 space-y-1">
          {menuItems
            .filter(item => item.roles.includes(role))
            .map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 rounded-lg py-2 px-3 ${
                      isActive ? 'bg-primary text-primary-content' : 'hover:bg-primary-focus'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
        </ul>
      </nav>

      <div className="p-4 border-t border-base-300 text-xs text-center text-gray-500">
        Privacy Policy | Terms of Use
      </div>
    </aside>
  );
};

export default AdminSidebar;