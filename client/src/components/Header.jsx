import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import { HiMenu } from 'react-icons/hi';

const Header = ({ toggleSidebar }) => {
  const location = useLocation();
  const [user, setUser ] = useState(null); // Store fetched user data
  const [loading, setLoading] = useState(true); // For initial fetch

  // Fetch current user data
  const fetchUser  = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include' // Send session cookies
      });
      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated - clear user
          setUser (null);
          return;
        }
        throw new Error('Failed to fetch user data');
      }
      const data = await response.json();
      setUser (data.user); // { id, name, username, email, role, ... }
    } catch (err) {
      console.error('Header user fetch error:', err);
      setUser (null); // Fallback to guest mode
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchUser ();
  }, []);

  // Listen for 'userUpdated' event (dispatched from Profile after save)
  useEffect(() => {
    const handleUserUpdated = () => {
      fetchUser (); // Refetch to get latest username
    };
    window.addEventListener('userUpdated', handleUserUpdated);
    return () => window.removeEventListener('userUpdated', handleUserUpdated);
  }, []);

  // Compute initials from name or username (like in Profile) - for fallback
  const getInitials = (name, username) => {
    if (!name && !username) return '?';
    const displayName = name || username;
    return displayName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || displayName.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(user?.name, user?.username);

  const onLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        setUser (null); // Clear local state
        // Redirect to login page after logout
        window.location.href = '/user/login';
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // If still loading, show skeleton or generic
  if (loading) {
    return (
      <header className="bg-white shadow-sm border-b sticky top-0 z-50 opacity-95 flex items-center justify-between px-4 max-w-7xl mx-auto w-full h-16">
        {/* Placeholder content */}
        <div className="flex-1 ml-2">
          <Link to="/user/home">
            <img src="/src/assets/HEALTHUB.png" alt="Logo" className="w-20 h-5 md:w-30 md:h-15 lg:w-60 lg:h-10 hover:scale-105" />
          </Link>
        </div>
        <div className="flex-none">
          <div className="flex items-center space-x-3 ml-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  const isAuthenticated = !!user;

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50 opacity-95 flex items-center justify-between px-4 max-w-7xl mx-auto w-full h-16">
      {/* Burger Icon - Mobile only, calls toggleSidebar */}
      <button
        onClick={toggleSidebar}
        className="btn btn-ghost btn-circle md:hidden"
        aria-label="Toggle Sidebar"
      >
        <HiMenu className="w-6 h-6" />
      </button>
      {/* Logo Section */}
      <div className="flex-1 ml-2">
        <Link to="/user/home">
          <img src="/src/assets/HEALTHUB.png" alt="Logo" className="w-20 h-5 md:w-30 md:h-15 lg:w-60 lg:h-10 hover:scale-105" />
        </Link>
      </div>
      {/* Navigation Links - Desktop */}
      <div className="flex-none hidden md:flex">
        <ul className="menu menu-horizontal px-1 space-x-2">
          <li>
            <Link 
              to="/user/articles" 
              className={`btn normal-case text-base font-medium ${location.pathname === '/user/articles' ? 'btn-primary' : 'btn-ghost'}`}
            >
              Articles
            </Link>
          </li>
          <li>
            <Link 
              to="/user/notifications" 
              className={`btn normal-case text-base font-medium ${location.pathname === '/user/notifications' ? 'btn-primary' : 'btn-ghost'}`}
            >
              Notifications
            </Link>
          </li>
        </ul>
      </div>
      {/* User Profile Section */}
      <div className="flex-none">
        <div className="flex items-center space-x-3 ml-4">
          {/* Notification Icon - Mobile Only */}
          <Link 
            to="/user/notifications" 
            className={`btn btn-circle md:hidden ${location.pathname === '/user/notifications' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <div className="indicator">
              <Bell className="w-5 h-5" />
              <span className="badge badge-xs badge-primary indicator-item"></span>
            </div>
          </Link>
          {/* User Avatar & Dropdown */}
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="bg-blue-200 btn btn-ghost btn-circle avatar">
              <div className={`w-10 rounded-full ${isAuthenticated ? '' : ' flex items-center justify-center'}`}>
                {isAuthenticated ? (
                  <img
                    src="/src/assets/pfp.png" // Static PFP - replace with user.avatarUrl if dynamic
                    alt="Profile Picture"
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : (
                  <User className="w-6 h-6 text-gray-500" />
                )}
                {/* Fallback initials (hidden by default, shown on img error) */}
                {isAuthenticated && (
                  <span
                    className="text-white text-sm font-bold bg-red-500 flex items-center justify-center w-10 h-10 rounded-full absolute"
                    style={{ display: 'none' }}
                  >
                    {initials}
                  </span>
                )}
              </div>
            </label>
            <ul
              tabIndex={0}
              className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52"
            >
              {isAuthenticated ? (
                <>
                  <li className="menu-title">
                    <span className="text-sm font-semibold">{user.username}</span> {/* Dynamic username */}
                  </li>
                  <li className={`${location.pathname === '/user/profile' ? 'active' : ''}`}>
                    <Link to="/user/profile">Profile</Link>
                  </li>
                  <li className={`${location.pathname === '/user/settings' ? 'active' : ''}`}>
                    <Link to="/user/settings">Settings</Link>
                  </li>
                  <li className={`md:hidden ${location.pathname === '/user/articles' ? 'active' : ''}`}>
                    <Link to="/user/articles">Articles</Link>
                  </li>
                  <li className={`md:hidden ${location.pathname === '/user/notifications' ? 'active' : ''}`}>
                    <Link to="/user/notifications">Notifications</Link>
                  </li>
                  <li>
                    <a onClick={onLogout} className="bg-blue-200 btn btn-ghost w-full text-left hover:scale-105 cursor-pointer">
                      Logout
                    </a>
                  </li>
                </>
              ) : (
                <>
                  <li className="menu-title">
                    <span className="text-sm font-semibold">Guest</span>
                  </li>
                  <li>
                    <Link to="/user/login">Login</Link>
                  </li>
                  <li>
                    <Link to="/user/register">Register</Link>
                  </li>
                </>
              )}
            </ul>
          </div>
          {/* Username - Desktop Only */}
          <span className={`hidden md:inline-block text-sm font-medium text-gray-700 ${!isAuthenticated ? 'opacity-50' : ''}`}>
            {isAuthenticated ? `@${user.username}` : 'Guest'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;