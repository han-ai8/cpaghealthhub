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
      
      // ✅ FIXED: api.get returns JSON directly, not response.data
      const data = await api.get('/notifications');
      console.log('✅ Notifications data:', data);
      
      if (data) {
        const notifs = data.notifications || [];
        const count = data.unreadCount || 0;
        
        setNotifications(notifs);
        setUnreadCount(count);
        console.log(`✅ Loaded ${notifs.length} notifications, ${count} unread`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      setError(error.message);
      setNotifications([]);
      setUnreadCount(0);
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
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
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
    if (!isUnread) return 'bg-gray-400';
    switch (type) {
      case 'announcement':
      case 'post':
        return 'bg-blue-500';
      case 'clinic_added':
        return 'bg-green-500';
      case 'admin_reply':
      case 'comment':
        return 'bg-purple-500';
      case 'article':
        return 'bg-indigo-500';
      case 'session_scheduled':
      case 'appointment_confirmed':
        return 'bg-emerald-500';
      case 'appointment_cancelled':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
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
      <div className="min-h-screen bg-blue-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blue-200 flex items-center justify-center p-6">
        <div className="card bg-white shadow-lg max-w-md">
          <div className="card-body text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="card-title justify-center">Error Loading Notifications</h2>
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={fetchNotifications}
              className="btn btn-primary mt-4"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-blue-200 p-6'>
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="btn btn-sm btn-primary gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>

        <div className="tabs tabs-boxed mb-4 bg-white">
          <button
            className={`tab ${filter === 'all' ? 'tab-active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </button>
          <button
            className={`tab ${filter === 'unread' ? 'tab-active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="card bg-white shadow-sm">
              <div className="card-body text-center py-12">
                <Bell className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500">
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
                className={`card ${notification.read ? 'bg-white' : 'bg-blue-50'} shadow-sm border hover:shadow-md transition-shadow cursor-pointer`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="card-body p-4">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-full flex-shrink-0 ${getNotificationColor(notification.type, !notification.read)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={`font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {getTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 break-words">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {!notification.read && (
                          <span className="badge badge-primary badge-sm">New</span>
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
                          className="btn btn-ghost btn-xs"
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
                        className="btn btn-ghost btn-xs text-red-500 hover:text-red-700"
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