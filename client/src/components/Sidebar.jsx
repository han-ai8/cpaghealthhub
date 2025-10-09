import { NavLink, useLocation } from 'react-router-dom';
import { 
  HiHome, 
  HiUser, 
  HiUserGroup, 
  HiCalendar, 
  HiLocationMarker,
} from 'react-icons/hi';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();

  const menuItems = [
  { name: 'Home', path: '/user/home', icon: HiHome },
  { name: 'Profile', path: '/user/profile', icon: HiUser },
  { name: 'Community', path: '/user/community', icon: HiUserGroup },
  { name: 'Schedule', path: '/user/schedule', icon: HiCalendar },
  { name: 'Clinic Finder', path: '/user/clinic-finder', icon: HiLocationMarker },
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
          aria-hidden="false"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] w-56 bg-base-200 shadow-xl transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:h-full lg:top-0
        `}
        role="complementary"
        aria-hidden={!isOpen ? "true" : "false"}  // Simplified: always false when open
        aria-expanded={isOpen}
      >
        <div className="flex flex-col h-full">
          {/* Navigation Menu */}
          <nav className="flex items-center flex-col overflow-y-auto py-4 flex-1">
            <ul className="menu menu-lg px-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => {
                        // Only close sidebar on mobile
                        if (window.innerWidth < 1024) {
                          toggleSidebar();
                        }
                      }}
                      className={`
                        flex items-center space-x-3 rounded-lg
                        ${isActive ? 'active bg-primary text-primary-content' : ''}
                      `}
                    >
                      <Icon className="w-6 h-6" />
                      <span>{item.name}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer Section */}
          <div className="border-t border-base-300 p-4 mt-auto">
            <div className="flex items-center space-x-3">
              <div className="avatar online placeholder">
                <div className="bg-neutral text-neutral-content rounded-full w-10">
                  <span className="text-sm">JD</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">John Doe</p>
                <p className="text-xs text-base-content/60">john@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;