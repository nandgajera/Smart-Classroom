import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import AuthProvider, { useAuth } from './contexts/AuthContext';
import Layout from './components/common/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TimetableGenerator from './pages/TimetableGenerator';
import TimetableView from './pages/TimetableView';
import DataManagement from './pages/DataManagement';

// Management components
import FacultyManagement from './pages/management/FacultyManagement';
import ClassroomManagement from './pages/management/ClassroomManagement';
import SubjectManagement from './pages/management/SubjectManagement';

// New pages
import Analytics from './pages/Analytics';
import FacultyRequest from './pages/FacultyRequest';
import LeaveRequest from './pages/LeaveRequest';
import './styles/tailwind.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== 'admin' && user.role !== 'hod') {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 mt-2">Only Admin and HOD users can access this section.</p>
        </div>
      </Layout>
    );
  }
  
  return children;
}

function HODRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== 'hod') {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 mt-2">Only HOD users can access this section.</p>
        </div>
      </Layout>
    );
  }
  
  return children;
}

function FacultyRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== 'faculty') {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 mt-2">Only Faculty users can access this section.</p>
        </div>
      </Layout>
    );
  }
  
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route 
        path="/" 
        element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
      />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/generator" element={
        <ProtectedRoute>
          <Layout><TimetableGenerator /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/timetables/:id" element={
        <ProtectedRoute>
          <Layout><TimetableView /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/data" element={
        <ProtectedRoute>
          <Layout><DataManagement /></Layout>
        </ProtectedRoute>
      } />
      
      {/* Analytics Route - All roles */}
      <Route path="/analytics" element={
        <ProtectedRoute>
          <Layout><Analytics /></Layout>
        </ProtectedRoute>
      } />
      
      {/* Faculty Request Route - HOD Only */}
      <Route path="/faculty-request" element={
        <HODRoute>
          <Layout><FacultyRequest /></Layout>
        </HODRoute>
      } />
      
      {/* Leave Request Route - Faculty Only */}
      <Route path="/leave-request" element={
        <FacultyRoute>
          <Layout><LeaveRequest /></Layout>
        </FacultyRoute>
      } />
      
      {/* Management Routes - Admin/HOD Only */}
      <Route path="/management/faculty" element={
        <AdminRoute>
          <Layout><FacultyManagement /></Layout>
        </AdminRoute>
      } />
      <Route path="/management/classrooms" element={
        <AdminRoute>
          <Layout><ClassroomManagement /></Layout>
        </AdminRoute>
      } />
      <Route path="/management/subjects" element={
        <AdminRoute>
          <Layout><SubjectManagement /></Layout>
        </AdminRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <AppRoutes />
            <Toaster position="top-right" />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
