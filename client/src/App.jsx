import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useEffect } from 'react';

import Layout from './components/Layout';
import Home from './pages/User/Home';
import Profile from './pages/User/Profile';
import Community from './pages/User/Community';
import Schedule from './pages/User/Schedule';
import ClinicFinder from './pages/User/ClinicFinder';
import Articles from './pages/User/Articles';
import ArticleDetail from './pages/User/ArticleDetail';
import Notifications from './pages/User/Notifications';
import Login from './pages/User/Login';
import Register from './pages/User/Register';
import UserSettings from './pages/User/Settings';
import EmailVerification from './pages/User/EmailVerification';
import ForgotPassword from './pages/User/ForgotPassword';

import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import AdminStaffManagement from './pages/admin/StaffManagement';
import CommunityForum from './pages/admin/CommunityForum';
import Appointments from './pages/admin/Appointments';
import ClinicFinderAdmin from './pages/admin/ClinicFinder';
import Settings from './pages/admin/Settings';
import AdminLogin from './pages/admin/AdminLogin';
import AdminArticles from './pages/admin/AdminArticles';
import CaseManagerMessages from './components/CaseManagerMessages';
import CaseManagerPlanner from './pages/case-manager/CaseManagerPlanner';
import ClinicScheduleManager from './pages/admin/ClinicScheduleManager';
import HIVAnalytics from './pages/admin/HIVAnalytics';
import AdminFAQ from './pages/admin/AdminFAQ';
import ContentModeratorFAQ from './pages/moderator/ContentModeratorFAQ';
import CaseManagerFAQ from './pages/case-manager/CaseManagerFAQ';
import AdminForgotPassword from './pages/admin/AdminForgotPassword';

function App() {
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* ========================================= */}
        {/* ROOT REDIRECT */}
        {/* ========================================= */}
        <Route 
          path="/" 
          element={
            user 
              ? user.role === 'user' 
                ? <Navigate to="/user/home" replace /> 
                : <Navigate to="/admin/dashboard" replace />
              : <Navigate to="/user/login" replace />
          } 
        />

        {/* ========================================= */}
        {/* PUBLIC ROUTES - USER */}
        {/* ========================================= */}
        
        <Route 
          path="/user/login" 
          element={user && user.role === 'user' ? <Navigate to="/user/home" /> : <Login />}
        />
        
        <Route 
          path="/user/register" 
          element={user && user.role === 'user' ? <Navigate to="/user/home" /> : <Register />}
        />
        
        <Route 
          path="/user/verify-email" 
          element={<EmailVerification />}
        />
        
        <Route 
          path="/user/forgot-password" 
          element={<ForgotPassword />}
        />

        {/* ✅ ADD LEGACY ROUTE REDIRECTS (for backward compatibility) */}
        <Route 
          path="/login" 
          element={<Navigate to="/user/login" replace />}
        />
        
        <Route 
          path="/register" 
          element={<Navigate to="/user/register" replace />}
        />

        {/* ========================================= */}
        {/* PUBLIC ROUTES - ADMIN */}
        {/* ========================================= */}
        
        <Route 
          path="/admin/login" 
          element={user && ['admin', 'content_moderator', 'case_manager'].includes(user.role) ? <Navigate to="/admin/dashboard" /> : <AdminLogin />} 
        />
        
        <Route 
          path="/admin/forgot-password" 
          element={user && ['admin', 'content_moderator', 'case_manager'].includes(user.role) ? <Navigate to="/admin/dashboard" /> : <AdminForgotPassword />} 
        />
        
        {/* ========================================= */}
        {/* PROTECTED ROUTES - USER */}
        {/* ========================================= */}
        
        <Route path="/user/*" element={
          user && user.role === 'user' ? (
            <Layout user={user}>
              <Routes>
                <Route index element={<Home />} />
                <Route path="home" element={<Home />} />
                <Route path="profile" element={<Profile />} />
                <Route path="community" element={<Community />} />
                <Route path="schedule" element={<Schedule />} />
                <Route path="clinic-finder" element={<ClinicFinder />} />
                <Route path="articles" element={<Articles />} />
                <Route path="articles/:id" element={<ArticleDetail />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="settings" element={<UserSettings />} />
                
                {/* Catch-all for unmatched user routes */}
                <Route path="*" element={<Navigate to="/user/home" replace />} />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/user/login" replace />
          )
        } />

        {/* ========================================= */}
        {/* PROTECTED ROUTES - ADMIN/STAFF */}
        {/* ========================================= */}
        
        <Route path="/admin/*" element={
          user && ['admin', 'content_moderator', 'case_manager'].includes(user.role) ? (
            <AdminLayout 
              user={user} 
              role={user.role} 
              username={user.username} 
              onLogout={logout}
            >
              <Routes>
                {/* ADMIN ONLY ROUTES */}
                {user.role === 'admin' && (
                  <>
                    <Route index element={<HIVAnalytics />} />
                    <Route path="hiv-analytics" element={<HIVAnalytics />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="articles" element={<AdminArticles />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="staff-management" element={<AdminStaffManagement />} />
                    <Route path="appointments" element={<Appointments />} />
                    <Route path="clinic-schedule" element={<ClinicScheduleManager />} />
                    <Route path="clinics" element={<ClinicFinderAdmin />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="faq" element={<AdminFAQ />} />
                  </>
                )}
                
                {/* CONTENT MODERATOR ROUTES */}
                {(user.role === 'admin' || user.role === 'content_moderator') && (
                  <>
                    <Route path="community" element={<CommunityForum />} />
                    {user.role === 'content_moderator' && (
                      <>
                        <Route index element={<CommunityForum />} />
                        <Route path="faq" element={<ContentModeratorFAQ />} /> 
                      </>
                    )}
                  </>
                )}
                
                {/* CASE MANAGER ROUTES */}
                {user.role === 'case_manager' && (
                  <>
                    <Route index element={<CaseManagerPlanner />} />
                    <Route path="planner" element={<CaseManagerPlanner />} />
                    <Route path="messages" element={<CaseManagerMessages />} />
                    <Route path="faq" element={<CaseManagerFAQ />} />
                  </>
                )}
                                
                {/* Redirect if accessing unauthorized route */}
                <Route path="*" element={<Navigate to={
                  user.role === 'admin' ? '/admin/dashboard' :
                  user.role === 'case_manager' ? '/admin/planner' :
                  '/admin/community'
                } replace />} />
              </Routes>
            </AdminLayout>
          ) : (
            <Navigate to="/admin/login" replace />
          )
        } />

        {/* ========================================= */}
        {/* CATCH-ALL - Redirect unknown routes */}
        {/* ========================================= */}
        <Route 
          path="*" 
          element={
            user 
              ? user.role === 'user' 
                ? <Navigate to="/user/home" replace /> 
                : <Navigate to="/admin/dashboard" replace />
              : <Navigate to="/user/login" replace />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;