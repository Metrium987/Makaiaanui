/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import Transport from './pages/Transport';
import Accommodation from './pages/Accommodation';
import Crm from './pages/Crm';
import Deliveries from './pages/Deliveries';
import Catering from './pages/Catering';
import Hospitalities from './pages/Hospitalities';
import Accreditations from './pages/Accreditations';
import Uniforms from './pages/Uniforms';
import Settings from './pages/Settings';
import Laundry from './pages/Laundry';
import AdditionalServices from './pages/AdditionalServices';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Vitrine */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/app" element={<Dashboard />} />
              <Route path="/app/transport" element={<Transport />} />
              <Route path="/app/accommodation" element={<Accommodation />} />
              <Route path="/app/catering" element={<Catering />} />
              <Route path="/app/hospitalities" element={<Hospitalities />} />
              <Route path="/app/accreditations" element={<Accreditations />} />
              <Route path="/app/deliveries" element={<Deliveries />} />
              <Route path="/app/laverie" element={<Laundry />} />
              <Route path="/app/uniforms" element={<Uniforms />} />
              <Route path="/app/services-additionnels" element={<AdditionalServices />} />
              <Route path="/app/crm" element={<Crm />} />
              <Route path="/app/settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Global Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
