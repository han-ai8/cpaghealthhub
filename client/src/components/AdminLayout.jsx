// src/components/AdminLayout.jsx
import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const AdminLayout = ({ children, role = 'admin', username = 'AdminUser', onLogout }) => {
  // Sidebar toggle for mobile can be added later

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-base-100">
      <AdminHeader username={username} onLogout={onLogout} />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar role={role} />
        <main className="flex-1 overflow-y-auto ml-60 p-6 bg-blue-100">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;