import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginView from './views/LoginView';
import CalendarView from './views/CalendarView';
import StatsView from './views/StatsView';
import HistoryView from './views/HistoryView';
import SettingsView from './views/SettingsView';

function RequireAuth({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<CalendarView />} />
        <Route path="tilastot" element={<StatsView />} />
        <Route path="historia" element={<HistoryView />} />
        <Route path="asetukset" element={<SettingsView />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
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
