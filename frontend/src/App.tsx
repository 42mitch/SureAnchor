import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ImpactPage from './pages/ImpactPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import CaseloadPage from './pages/CaseloadPage';
import ProcessRecordingPage from './pages/ProcessRecordingPage';
import DonorsPage from './pages/DonorsPage';
import ReportsPage from './pages/ReportsPage';
import VisitationsPage from './pages/VisitationsPage';
import ResidentProfilePage from './pages/ResidentProfilePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/impact" element={<ImpactPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Admin pages */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/caseload" element={<CaseloadPage />} />
        <Route path="/admin/process-recording" element={<ProcessRecordingPage />} />
        <Route path="/admin/donors" element={<DonorsPage />} />
        <Route path="/admin/reports" element={<ReportsPage />} />
        <Route path="/admin/visitations" element={<VisitationsPage />} />
        <Route path="/admin/resident/:id" element={<ResidentProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
