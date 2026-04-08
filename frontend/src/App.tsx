import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RequireAuth from './components/RequireAuth';
import LandingPage from './pages/LandingPage';
import ImpactPage from './pages/ImpactPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DonorPortalPage from './pages/DonorPortalPage';
import AdminDashboard from './pages/AdminDashboard';
import CaseloadPage from './pages/CaseloadPage';
import ProcessRecordingPage from './pages/ProcessRecordingPage';
import DonorsPage from './pages/DonorsPage';
import ReportsPage from './pages/ReportsPage';
import VisitationsPage from './pages/VisitationsPage';
import ResidentProfilePage from './pages/ResidentProfilePage';
import SafetyPage from './pages/SafetyPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ContactPage from './pages/ContactPage';
import CookieConsent from './components/CookieConsent';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <CookieConsent />
        <Routes>
          {/* Public — no auth required */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/impact" element={<ImpactPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Donor portal — Donor role only */}
          <Route path="/donor" element={
            <RequireAuth roles={['Donor']}>
              <DonorPortalPage />
            </RequireAuth>
          } />

          {/* Admin / Staff pages */}
          <Route path="/admin" element={
            <RequireAuth roles={['Admin', 'Staff']}>
              <AdminDashboard />
            </RequireAuth>
          } />
          <Route path="/admin/caseload" element={
            <RequireAuth roles={['Admin', 'Staff']}>
              <CaseloadPage />
            </RequireAuth>
          } />
          <Route path="/admin/process-recording" element={
            <RequireAuth roles={['Admin', 'Staff']}>
              <ProcessRecordingPage />
            </RequireAuth>
          } />
          <Route path="/admin/donors" element={
            <RequireAuth roles={['Admin', 'Staff']}>
              <DonorsPage />
            </RequireAuth>
          } />
          <Route path="/admin/reports" element={
            <RequireAuth roles={['Admin', 'Staff']}>
              <ReportsPage />
            </RequireAuth>
          } />
          <Route path="/admin/visitations" element={
            <RequireAuth roles={['Admin', 'Staff']}>
              <VisitationsPage />
            </RequireAuth>
          } />
          <Route path="/admin/resident/:id" element={
            <RequireAuth roles={['Admin', 'Staff']}>
              <ResidentProfilePage />
            </RequireAuth>
          } />

          {/* Admin-only pages */}
          <Route path="/admin/safety" element={
            <RequireAuth roles={['Admin']}>
              <SafetyPage />
            </RequireAuth>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;