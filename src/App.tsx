import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

// Landing page sections
import LandingPage from '@/pages/LandingPage';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';

// Dashboard & App pages
import Dashboard from '@/pages/Dashboard';
import Jobs from '@/pages/Jobs';
import Applications from '@/pages/Applications';
import Profile from '@/pages/Profile';
import Preferences from '@/pages/Preferences';
import Portals from '@/pages/Portals';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <Jobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <ProtectedRoute>
                <Applications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/preferences"
            element={
              <ProtectedRoute>
                <Preferences />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portals"
            element={
              <ProtectedRoute>
                <Portals />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

