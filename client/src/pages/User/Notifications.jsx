import { Bell } from 'lucide-react';

const Notifications = () => {
  const notifications = [
    { id: 1, title: "New Article Published", message: "Check out the latest health guidelines", time: "2h ago", unread: true },
    { id: 2, title: "Appointment Reminder", message: "Your appointment is tomorrow at 10 AM", time: "5h ago", unread: true },
    { id: 3, title: "Community Update", message: "New wellness program starting next week", time: "1d ago", unread: false },
    { id: 4, title: "Profile Updated", message: "Your profile information has been updated", time: "2d ago", unread: false },
  ];

  return (
    <div className='min-h-screen bg-blue-200 p-6 flex-col items-center'>
      <h1 className="text-4xl font-bold mb-6">Notifications</h1>
      <div className="space-y-4 max-w-3xl">
        {notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`card ${notification.unread ? 'bg-blue-50' : 'bg-base-100'} shadow-sm border`}
          >
            <div className="card-body p-4">
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-full ${notification.unread ? 'bg-blue-500' : 'bg-gray-400'}`}>
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                    <span className="text-xs text-gray-500">{notification.time}</span>
                  </div>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                  {notification.unread && (
                    <span className="badge badge-primary badge-sm mt-2">New</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;