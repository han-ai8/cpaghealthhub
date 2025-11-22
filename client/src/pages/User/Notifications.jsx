import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import socketService from '../../services/socketService';
import { useAuth } from '../../context/AuthContext';

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      socketService.on('new_notification', handleNewNotification);
    }

    return () => {
      socketService.off('new_notification', handleNewNotification);
    };
  }, [user]);

  const handleNewNotification = (notification) => {
    console.log('🔔 New notification received:', notification);
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Emit event to update Header
    window.dispatchEvent(new CustomEvent('notificationCountChanged', { 
      detail: { count: unreadCount + 1 } 
    }));
    
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png'
      });
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📬 Fetching notifications for user:', user?.id);
      
      const data = await api.get('/notifications');
      console.log('✅ Notifications data:', data);
      
      if (data) {
        const notifs = data.notifications || [];
        const count = data.unreadCount || 0;
        
        setNotifications(notifs);
        setUnreadCount(count);
        
        // Emit event to update Header
        window.dispatchEvent(new CustomEvent('notificationCountChanged', { 
          detail: { count } 
        }));
        
        console.log(`✅ Loaded ${notifs.length} notifications, ${count} unread`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      setError(error.message);
      setNotifications([]);
      setUnreadCount(0);
      
      // Emit event to update Header
      window.dispatchEvent(new CustomEvent('notificationCountChanged', { 
        detail: { count: 0 } 
      }));
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
      
      const newCount = Math.max(0, unreadCount - 1);
      setUnreadCount(newCount);
      
      // Emit event to update Header
      window.dispatchEvent(new CustomEvent('notificationCountChanged', { 
        detail: { count: newCount } 
      }));
      
      console.log('✅ Notification marked as read. New count:', newCount);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      // Emit event to update Header
      window.dispatchEvent(new CustomEvent('notificationCountChanged', { 
        detail: { count: 0 } 
      }));
      
      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const notification = notifications.find(n => n._id === notificationId);
      const wasUnread = notification && !notification.read;
      
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      if (wasUnread) {
        const newCount = Math.max(0, unreadCount - 1);
        setUnreadCount(newCount);
        
        // Emit event to update Header
        window.dispatchEvent(new CustomEvent('notificationCountChanged', { 
          detail: { count: newCount } 
        }));
        
        console.log('✅ Unread notification deleted. New count:', newCount);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationIcon = (type) => {
    const iconProps = { className: "w-5 h-5 text-white" };
    switch (type) {
      case 'announcement':
      case 'post':
      case 'clinic_added':
      case 'admin_reply':
      case 'comment':
      case 'article':
        return <Bell {...iconProps} />;
      case 'session_scheduled':
      case 'appointment_confirmed':
      case 'appointment_cancelled':
        return <Clock {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  const getNotificationColor = (type, isUnread) => {
    if (!isUnread) return 'bg-gray-400 dark:bg-gray-600';
    switch (type) {
      case 'announcement':
      case 'post':
        return 'bg-blue-500 dark:bg-blue-600';
      case 'clinic_added':
        return 'bg-green-500 dark:bg-green-600';
      case 'admin_reply':
      case 'comment':
        return 'bg-purple-500 dark:bg-purple-600';
      case 'article':
        return 'bg-indigo-500 dark:bg-indigo-600';
      case 'session_scheduled':
      case 'appointment_confirmed':
        return 'bg-emerald-500 dark:bg-emerald-600';
      case 'appointment_cancelled':
        return 'bg-red-500 dark:bg-red-600';
      default:
        return 'bg-blue-500 dark:bg-blue-600';
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + 'y ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + 'mo ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + 'd ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + 'h ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + 'm ago';
    return 'Just now';
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-200 dark:bg-gray-900 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-blue-600 dark:text-blue-400"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blue-200 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="card bg-white dark:bg-gray-800 shadow-lg max-w-md">
          <div className="card-body text-center">
            <div className="text-red-500 dark:text-red-400 text-5xl mb-4">⚠️</div>
            <h2 className="card-title justify-center text-gray-800 dark:text-white">Error Loading Notifications</h2>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <button 
              onClick={fetchNotifications}
              className="btn btn-primary mt-4 dark:bg-blue-600 dark:hover:bg-blue-700 dark:border-blue-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-blue-200 dark:bg-gray-800 p-6 rounded-lg '>
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold p-2 text-gray-800 dark:text-white">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="btn btn-sm md:btn-md btn-primary gap-2 text-xs md:text-sm p-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:border-blue-600"
            >
              <CheckCheck className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Mark all as read</span>
              <span className="sm:hidden">Mark all</span>
            </button>
          )}
        </div>

        <div className="tabs tabs-boxed mb-4 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm">
          <button
            className={`tab ${filter === 'all' ? 'tab-active dark:bg-blue-600' : 'dark:text-gray-300'}`}
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </button>
          <button
            className={`tab ${filter === 'unread' ? 'tab-active dark:bg-blue-600' : 'dark:text-gray-300'}`}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="card bg-white dark:bg-gray-800 shadow-sm">
              <div className="card-body text-center py-12">
                <Bell className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  {filter === 'unread' 
                    ? 'No unread notifications' 
                    : 'No notifications yet'}
                </p>
              </div>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div 
                key={notification._id} 
                className={`card ${notification.read ? 'bg-white dark:bg-gray-800' : 'bg-blue-50 dark:bg-blue-900/20'} shadow-sm border dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="card-body p-4">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-full flex-shrink-0 ${getNotificationColor(notification.type, !notification.read)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={`font-semibold ${notification.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                          {getTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 break-words">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {!notification.read && (
                          <span className="badge badge-primary badge-sm dark:bg-blue-600 dark:border-blue-600">New</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification._id);
                          }}
                          className="btn btn-ghost btn-xs dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification._id);
                        }}
                        className="btn btn-ghost btn-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 dark:hover:bg-gray-700"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;