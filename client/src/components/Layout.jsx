import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatWidget from './ChatWidget';
import { useUserProfile } from '../hooks/useUserProfile';
import api from '../utils/api';
import socketService from '../services/socketService';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user: userData, loading, error } = useUserProfile();
  const { user } = useAuth();

  const toggleSidebar = () => setIsOpen(!isOpen);

  // ✅ Connect socket and listen for notifications
  useEffect(() => {
    if (user?.id) {
      // Connect socket
      socketService.connect(user.id);
      
      // Fetch initial unread count
      fetchUnreadCount();

      // Listen for new notifications
      socketService.on('new_notification', handleNewNotification);
    }

    return () => {
      if (user?.id) {
        socketService.off('new_notification', handleNewNotification);
      }
    };
  }, [user]);

  const handleNewNotification = (notification) => {
    setUnreadCount(prev => prev + 1);
    
    // Show browser notification if permitted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png'
      });
    }
  };

  const fetchUnreadCount = async () => {
  try {
    // ✅ CORRECT - api.get returns data directly
    const data = await api.get('/notifications/unread-count');
    setUnreadCount(data.count || 0);
  } catch (error) {
    console.error('Error fetching unread count:', error);
  }
};

  useEffect(() => {
    
  }, [userData, loading, error, unreadCount]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-blue-200">
      <Header toggleSidebar={toggleSidebar} unreadCount={unreadCount} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
      
      {error && (
        <div className="fixed bottom-6 left-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-40">
          <p className="font-bold">Error loading profile</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {!loading && userData && <ChatWidget user={userData} />}
      
      {loading && (
        <div className="fixed bottom-6 right-6 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-2 rounded text-xs z-40">
          Loading user profile...
        </div>
      )}
    </div>
  );
};

export default Layout;