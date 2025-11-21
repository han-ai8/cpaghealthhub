import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import { HiMenu } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import logoHeader from '../assets/logo-header.png';
import api from '../utils/api';
import userProfile from '../assets/userPfp.png';

const Header = ({ toggleSidebar, unreadCount }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: contextUser, logout, checkSession } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const toast = useToast();

  // Fetch user
const fetchUser = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    const data = await api.get('/auth/me');
    setUser(data.user);
  } catch (err) {
    console.error('Header user fetch error:', err);
    setUser(null);
  } finally {
    setLoading(false);
  }
};

  // Initial fetch on mount
  useEffect(() => {
    fetchUser();
  }, []);

  // Sync with context user
  useEffect(() => {
    if (contextUser) {
      setUser(contextUser);
    }
  }, [contextUser]);

  // Listen for 'userUpdated' event
  useEffect(() => {
    const handleUserUpdated = () => {
      fetchUser();
      checkSession();
    };
    window.addEventListener('userUpdated', handleUserUpdated);
    return () => window.removeEventListener('userUpdated', handleUserUpdated);
  }, [checkSession]);

  // Compute initials from name or username
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

  // Show logout confirmation toast
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true); 
  };

  // Confirm logout
  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      await logout(navigate);
      setUser(null);
      toast.success('Logged out successfully');
    } catch (err) {
      toast.error('Logout failed. Please try again.');
      localStorage.removeItem('token');
      setUser(null);
      navigate('/user/login');
    }
  };

  // Cancel logout
  const cancelLogout = () => {
    setShowLogoutConfirm(false);
    toast.removeToast(toast.toasts?.[0]?.id); // Remove the warning toast
  };

  // If still loading, show skeleton
  if (loading) {
    return (
      <header className="bg-[#FFFFFF] shadow-lg border-b border-[#4C8DD8]/20 sticky top-0 z-50 backdrop-blur-sm flex items-center justify-between px-4 max-w-7xl mx-auto w-full h-16 transition-all duration-300">
        <div className="flex-1 ml-2">
          <Link to="/user/home">
            <img src="/src/assets/logo-header.png" alt="Logo" className="w-20 h-5 md:w-30 md:h-15 lg:w-60 lg:h-10 hover:scale-105 transition-transform duration-200" />
          </Link>
        </div>
        <div className="flex-none">
          <div className="flex items-center space-x-3 ml-4">
            <div className="w-10 h-10 bg-[#4C8DD8]/20 rounded-full animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  const isAuthenticated = !!user;

  return (
    <>
      <header className="bg-[#FFFFFF] shadow-lg border-b border-[#4C8DD8]/20 sticky top-0 z-50 backdrop-blur-sm flex items-center justify-between px-4 max-w-8xl mx-auto w-full h-20 transition-all duration-300">
        {/* Burger Icon - Mobile only */}
        <button
          onClick={toggleSidebar}
          className="btn btn-ghost btn-circle xl:hidden hover:bg-[#4C8DD8]/10 transition-colors duration-200"
          aria-label="Toggle Sidebar"
        >
          <HiMenu className="w-6 h-6 text-[#4C8DD8]" />
        </button>

        {/* Logo Section */}
        <Link to="/user/home" className="hover:opacity-80 transition-opacity duration-200">
            <img 
              src={logoHeader} 
              alt="Logo" 
              className="w-20 h-15  md:w-30 md:h-15 lg:w-60 lg:h-10 hover:scale-105 transition-transform duration-200" 
            />
          </Link>
        <div className="flex-1 ml-2">
          
        </div>

        {/* Navigation Links - Desktop */}
        <div className="flex-none hidden md:flex">
          <ul className="menu menu-horizontal px-1 space-x-2">
            <li>
              <Link 
                to="/user/articles" 
                className={`btn normal-case text-base font-medium transition-all duration-200 ${
                  location.pathname === '/user/articles' 
                    ? 'bg-[#4C8DD8] text-[#FFFFFF] hover:bg-[#4C8DD8]/90' 
                    : 'btn-ghost text-[#4C8DD8] hover:bg-[#4C8DD8]/10 hover:text-[#2E7D32]'
                }`}
              >
                Articles
              </Link>
            </li>
            <li>
              <Link 
                to="/user/notifications" 
                className={`btn normal-case text-base font-medium transition-all duration-200 ${
                  location.pathname === '/user/notifications' 
                    ? 'bg-[#4C8DD8] text-[#FFFFFF] hover:bg-[#4C8DD8]/90' 
                    : 'btn-ghost text-[#4C8DD8] hover:bg-[#4C8DD8]/10 hover:text-[#2E7D32]'
                }`}
              >
                <div className="indicator">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="absolute -top-3 -right-5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
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
              className={`btn btn-circle md:hidden transition-all duration-200 ${
                location.pathname === '/user/notifications' 
                  ? 'bg-[#4C8DD8] text-[#FFFFFF] hover:bg-[#4C8DD8]/90' 
                  : 'btn-ghost text-[#4C8DD8] hover:bg-[#4C8DD8]/10 hover:text-[#2E7D32]'
              }`}
            >
              <div className="indicator">
               <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
            </Link>

            {/* User Avatar & Dropdown */}
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-circle avatar hover:bg-[#4C8DD8]/10 transition-colors duration-200">
                <div className={`w-10 rounded-full ${
                  isAuthenticated ? '' : 'flex items-center justify-center bg-[#4C8DD8]/10'
                }`}>
                  {isAuthenticated ? (
                    <img
                      src={userProfile}
                      alt="Profile Picture"
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <User className="w-6 h-6 text-[#4C8DD8]" />
                  )}
                  {/* Fallback initials */}
                  {isAuthenticated && (
                    <span
                      className="text-[#FFFFFF] text-sm font-bold bg-[#C62828] flex items-center justify-center w-10 h-10 rounded-full absolute"
                      style={{ display: 'none' }}
                    >
                      {initials}
                    </span>
                  )}
                </div>
              </label>

              <ul
                tabIndex={0}
                className="mt-3 z-[1] p-2 shadow-lg menu menu-sm dropdown-content bg-[#FFFFFF] rounded-box w-52 border border-[#4C8DD8]/20"
              >
                {isAuthenticated ? (
                  <>
                    <li className="menu-title">
                      <span className="text-sm font-semibold text-[#4C8DD8] hover:text-[#2E7D32]">{user.username}</span>
                    </li>
                    <li className={`${location.pathname === '/user/profile' ? 'bg-[#4C8DD8]/10' : ''}`}>
                      <Link to="/user/profile" className="text-[#4C8DD8] hover:bg-[#4C8DD8]/10 hover:text-[#2E7D32] transition-colors duration-200">Profile</Link>
                    </li>
                    <li className={`md:hidden ${location.pathname === '/user/articles' ? 'bg-[#4C8DD8]/10' : ''}`}>
                      <Link to="/user/articles" className="text-[#4C8DD8] hover:bg-[#4C8DD8]/10 hover:text-[#2E7D32] transition-colors duration-200">Articles</Link>
                    </li>
                    <li className={`md:hidden ${location.pathname === '/user/notifications' ? 'bg-[#4C8DD8]/10' : ''}`}>
                      <Link to="/user/notifications" className="text-[#4C8DD8] hover:bg-[#4C8DD8]/10 hover:text-[#2E7D32] transition-colors duration-200">Notifications</Link>
                    </li>
                    <li>
                      <button 
                        onClick={handleLogoutClick} 
                        className="bg-[#2E7D32] hover:bg-[#C62828]/90 text-[#FFFFFF] w-full text-left transition-colors duration-200 cursor-pointer rounded-md py-2 px-3"
                      >
                        Logout
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="menu-title">
                      <span className="text-sm font-semibold text-[#4C8DD8]">Guest</span>
                    </li>
                    <li>
                      <Link to="/user/login" className="text-[#4C8DD8] hover:bg-[#2E7D32]/10 hover:text-[#2E7D32] transition-colors duration-200">Login</Link>
                    </li>
                    <li>
                      <Link to="/user/register" className="text-[#4C8DD8] hover:bg-[#4C8DD8]/10 hover:text-[#2E7D32] transition-colors duration-200">Register</Link>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Username - Desktop Only */}
            <span className={`hidden md:inline-block text-sm font-medium text-[#4C8DD8] ${
              !isAuthenticated ? 'opacity-50' : ''
            }`}>
              {isAuthenticated ? `@${user.username}` : 'Guest'}
            </span>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 animate-slide-in">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 bg-[#C62828] hover:bg-[#C62828]/90 text-white rounded-md transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;