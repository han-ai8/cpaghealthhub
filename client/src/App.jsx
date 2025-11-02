import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

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

import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import CommunityForum from './pages/admin/CommunityForum';
import Appointments from './pages/admin/Appointments';
import ClinicFinderAdmin from './pages/admin/ClinicFinder';
import Settings from './pages/admin/Settings';
import AdminLogin from './pages/admin/AdminLogin';
import AdminRegister from './pages/admin/AdminRegister';
import AdminArticles from './pages/admin/AdminArticles';
import CaseManagerMessages from './components/CaseManagerMessages';
import CaseManagerPlanner from './pages/case-manager/CaseManagerPlanner';
import ClinicScheduleManager from './pages/admin/ClinicScheduleManager';
import HIVAnalytics from './pages/admin/HIVAnalytics';

function App() {
  const { user, loading, logout } = useAuth();

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
        {/* Public routes - User */}
        
        <Route 
          path="/user/login" 
          element={user && user.role === 'user' ? <Navigate to="/user/home" /> : <Login />}
        />
        <Route 
          path="/user/register" 
          element={user && user.role === 'user' ? <Navigate to="/user/login" /> : <Register />}
        />
        
        {/* Public routes - Admin */}
        <Route 
          path="/admin/login" 
          element={user && ['admin', 'content_moderator', 'case_manager'].includes(user.role) ? <Navigate to="/admin/dashboard" /> : <AdminLogin />} 
        />
        <Route 
          path="/admin/register" 
          element={user && ['admin', 'content_moderator', 'case_manager'].includes(user.role) ? <Navigate to="/admin/login" /> : <AdminRegister />} 
        />

        {/* User routes - Protected */}
        {/* ChatWidget is already in Layout.jsx - no need to add it here! */}
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
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/user/login" replace />
          )
        } />

        {/* Admin routes - Protected */}
        <Route path="/admin/*" element={
          user && ['admin', 'content_moderator', 'case_manager'].includes(user.role) ? (
            <AdminLayout 
              user={user} 
              role={user.role} 
              username={user.username} 
              onLogout={logout}
            >
              <Routes>
                <Route index element={<HIVAnalytics />} />
                <Route path="hiv-analytics" element={<HIVAnalytics />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="articles" element={<AdminArticles />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="community" element={<CommunityForum />} />
                <Route path="clinic-schedule" element={<ClinicScheduleManager />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="clinics" element={<ClinicFinderAdmin />} />
                <Route path="messages" element={<CaseManagerMessages />} />
                <Route path="planner" element={<CaseManagerPlanner />} />
                <Route path="settings" element={<Settings />} />
              </Routes>
            </AdminLayout>
          ) : (
            <Navigate to="/admin/login" replace />
          )
        } />

        {/* Default redirect */}
        <Route 
          path="/" 
          element={
            user 
              ? (['admin', 'content_moderator', 'case_manager'].includes(user.role) 
                  ? <Navigate to="/admin/dashboard" replace /> 
                  : <Navigate to="/user/home" replace />) 
              : <Navigate to="/user/login" replace />
          } 
        />
        <Route path="*" element={<Navigate to="/user/login" replace />} />
      </Routes>
      
    </Router>
  );
}

export default App;