import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatWidget from './ChatWidget';

const Layout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-base-100">
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
      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default Layout;