import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Login from "./pages/Login.jsx";
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import GroupPage from './pages/GroupPage.jsx';
import FamilyHome from './pages/FamilyHome.jsx';
import CheckIn from './pages/CheckIn.jsx';

function Protected({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="center">Loading...</p>;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="center">Loading...</p>;
  return user ? <Navigate to={location.state?.from || '/'} replace /> : children;
}

function Home() {
  const { user } = useAuth();
  return user.role === 'family' ? <FamilyHome /> : <Dashboard />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/" element={<Protected><Home /></Protected>} />
      <Route path="/groups/:id" element={<Protected role="tutor"><GroupPage /></Protected>} />
      <Route path="/checkin" element={<Protected role="family"><CheckIn /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}