import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import AssessmentList from './pages/AssessmentList';
import Assessment from './pages/Assessment';
import AssessmentResults from './pages/AssessmentResults';
import Reports from './pages/Reports';
import InstitutionalReport from './pages/InstitutionalReport';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

function App() {
  const { token, fetchUser } = useAuthStore();

  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token, fetchUser]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        }
      />

      <Route
        path="/projects/:id"
        element={
          <ProtectedRoute>
            <ProjectDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/assessments"
        element={
          <ProtectedRoute>
            <AssessmentList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/assessments/:id"
        element={
          <ProtectedRoute>
            <Assessment />
          </ProtectedRoute>
        }
      />

      <Route
        path="/assessments/:id/results"
        element={
          <ProtectedRoute>
            <AssessmentResults />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports/institutional/:projectId"
        element={
          <ProtectedRoute>
            <InstitutionalReport />
          </ProtectedRoute>
        }
      />

      <Route
        path="/organizations"
        element={
          <ProtectedRoute>
            <div className="text-center py-12">
              <h1 className="text-2xl font-semibold text-gray-900">Organizations</h1>
              <p className="text-gray-500 mt-2">Organization management coming soon...</p>
            </div>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
