import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import CaseManagerMessages from './CaseManagerMessages';

const AdminLayout = ({ children, user, role = 'admin', username = 'AdminUser', onLogout }) => {
  const [showMessages, setShowMessages] = useState(false);

  // Format user data for CaseManagerMessages component
  const caseManagerUser = user ? {
    _id: user.id || user._id,
    username: user.username,
    email: user.email,
    role: user.role
  } : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-base-100">
      <AdminHeader username={username} onLogout={onLogout} />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar role={role} />
        <main className="flex-1 overflow-y-auto ml-60 p-6 bg-blue-100">
          {children}
        </main>
      </div>

      {/* Floating Messages Button (Bottom Right) */}
      {caseManagerUser && role === 'case_manager' && !showMessages && (
        <button
          onClick={() => setShowMessages(true)}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105 z-40"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Messages Modal/Popup */}
      {showMessages && caseManagerUser && role === 'case_manager' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-5/6 flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b bg-blue-600 text-white rounded-t-lg">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageCircle className="w-6 h-6" />
                Messages
              </h2>
              <button 
                onClick={() => setShowMessages(false)}
                className="hover:bg-blue-700 p-2 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Messages Component */}
            <div className="flex-1 overflow-hidden">
              <CaseManagerMessages caseManager={caseManagerUser} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;