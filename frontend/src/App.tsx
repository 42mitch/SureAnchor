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
import StaffAccountsPage from './pages/StaffAccountsPage';
import MyAccountPage from './pages/MyAccountPage';
import DonorMyAccountPage from './pages/DonorMyAccountPage';
import SocialMediaPage from './pages/SocialMediaPage';
import SafehouseImpactPage from './pages/SafehouseImpactPage';
import ConfirmEmailPage from './pages/ConfirmEmailPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import MessagesPage from './pages/MessagesPage';

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
          <Route path="/confirm-email" element={<ConfirmEmailPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Donor portal — Donor role only */}
          <Route path="/donor" element={
            <RequireAuth roles={['Donor']}>
              <DonorPortalPage />
            </RequireAuth>
          } />
          <Route path="/donor/my-account" element={
            <RequireAuth roles={['Donor']}>
              <DonorMyAccountPage />
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
          <Route path="/admin/my-account" element={
            <RequireAuth roles={['Admin', 'Staff']}>
              <MyAccountPage />
            </RequireAuth>
          } />

          <Route path="/admin/social-media" element={
            <RequireAuth roles={['Admin']}>
              <SocialMediaPage />
            </RequireAuth>
          } />
          <Route path="/admin/safehouse-impact" element={
            <RequireAuth roles={['Admin']}>
              <SafehouseImpactPage />
            </RequireAuth>
          } />

          {/* Admin-only pages */}
          <Route path="/admin/safety" element={
            <RequireAuth roles={['Admin']}>
              <SafetyPage />
            </RequireAuth>
          } />
          <Route path="/admin/staff-accounts" element={
            <RequireAuth roles={['Admin']}>
              <StaffAccountsPage />
            </RequireAuth>
          } />
          <Route path="/admin/messages" element={
            <RequireAuth roles={['Admin']}><MessagesPage /></RequireAuth>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;