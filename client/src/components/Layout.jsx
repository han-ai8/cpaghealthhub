import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatWidget from './ChatWidget';
import { useUserProfile } from '../hooks/useUserProfile'; // Fix import path

const Layout = ({ children }) => { // Remove user prop - we'll fetch it ourselves
  const [isOpen, setIsOpen] = useState(false);
  
  // Use the hook to fetch user profile
  const { user: userData, loading, error } = useUserProfile();

  const toggleSidebar = () => setIsOpen(!isOpen);

  // Debug logging
  useEffect(() => {
    console.log('═══════════════════════════════════');
    console.log('🏗️ Layout - User Profile Status:');
    console.log('Loading:', loading);
    console.log('Has Error:', !!error);
    console.log('Error:', error);
    console.log('User Data:', userData);
    console.log('User ID:', userData?._id || userData?.id);
    console.log('Has Case Manager:', !!userData?.assignedCaseManager);
    console.log('Case Manager ID:', userData?.assignedCaseManager);
    console.log('═══════════════════════════════════');
  }, [userData, loading, error]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-blue-200">
      {/* Header - Full width at top */}
      <Header toggleSidebar={toggleSidebar} />
      
      {/* Container for Sidebar + Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
      
      {/* Show error if profile fetch failed */}
      {error && (
        <div className="fixed bottom-6 left-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-40">
          <p className="font-bold">Error loading profile</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {/* Chat Widget - Only show when user data is loaded and valid */}
      {!loading && userData && (
        <>
          {console.log('💬 Layout - Rendering ChatWidget with user:', {
            id: userData._id || userData.id,
            hasCaseManager: !!userData.assignedCaseManager,
            caseManagerId: userData.assignedCaseManager
          })}
          <ChatWidget user={userData} />
        </>
      )}
      
      {/* Debug info for development */}
      {loading && (
        <div className="fixed bottom-6 right-6 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-2 rounded text-xs z-40">
          Loading user profile...
        </div>
      )}
    </div>
  );
};

export default Layout;