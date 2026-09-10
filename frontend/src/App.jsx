import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import ScanPage from './pages/ScanPage';
import ReportPage from './pages/ReportPage';
import Dashboard from './pages/Dashboard';
import CaseHistory from './pages/CaseHistory';
import Rulebook from './pages/Rulebook';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-accent-amber border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/scan" replace /> : <Login />}
      />
      <Route
        path="/scan"
        element={<ProtectedRoute><ScanPage /></ProtectedRoute>}
      />
      <Route
        path="/report/:id"
        element={<ProtectedRoute><ReportPage /></ProtectedRoute>}
      />
      <Route
        path="/dashboard"
        element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
      />
      <Route
        path="/history"
        element={<ProtectedRoute><CaseHistory /></ProtectedRoute>}
      />
      <Route
        path="/rulebook"
        element={<ProtectedRoute><Rulebook /></ProtectedRoute>}
      />
      <Route path="*" element={<Navigate to="/scan" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
