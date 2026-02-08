import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import { Toaster } from 'react-hot-toast';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { PendingApprovalPage } from './pages/auth/PendingApprovalPage';
import { UnauthorizedPage } from './pages/auth/UnauthorizedPage';

// Candidate Pages
import { JobsListPage } from './pages/candidate/JobsListPage';
import { JobDetailsPage } from './pages/candidate/JobDetailsPage';
import { MyApplicationsPage } from './pages/candidate/MyApplicationsPage';

// HR Pages
import { HRDashboardPage } from './pages/hr/HRDashboardPage';
import { ManageJobsPage } from './pages/hr/ManageJobsPage';
import { CreateJobPage } from './pages/hr/CreateJobPage';
import { JobApplicationsPage } from './pages/hr/JobApplicationsPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { HRRequestsPage } from './pages/admin/HRRequestsPage';
import { UsersManagementPage } from './pages/admin/UsersManagementPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
          
          {/* Pending Approval Page */}
          <Route
            path="/pending-approval"
            element={
              <ProtectedRoute allowedRoles={['hr_pending']}>
                <PendingApprovalPage />
              </ProtectedRoute>
            }
          />

          {/* Unauthorized Page */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Candidate Routes */}
          <Route
            path="/jobs"
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <JobsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/:jobId"
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <JobDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-applications"
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <MyApplicationsPage />
              </ProtectedRoute>
            }
          />

          {/* HR Routes */}
          <Route
            path="/hr"
            element={
              <ProtectedRoute allowedRoles={['hr_approved']}>
                <HRDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/jobs"
            element={
              <ProtectedRoute allowedRoles={['hr_approved']}>
                <ManageJobsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/jobs/new"
            element={
              <ProtectedRoute allowedRoles={['hr_approved']}>
                <CreateJobPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/jobs/:jobId/edit"
            element={
              <ProtectedRoute allowedRoles={['hr_approved']}>
                <CreateJobPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/jobs/:jobId/applications"
            element={
              <ProtectedRoute allowedRoles={['hr_approved']}>
                <JobApplicationsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/hr-requests"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <HRRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UsersManagementPage />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* 404 - Redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
