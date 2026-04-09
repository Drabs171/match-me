import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import Navbar from './components/Navbar';
import PrivacyConsentBanner from './components/PrivacyConsentBanner';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import JobDetailPage from './pages/JobDetailPage';
import InterviewPage from './pages/InterviewPage';
import InterviewHistoryPage from './pages/InterviewHistoryPage';
import SavedJobsPage from './pages/SavedJobsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <PrivacyConsentBanner />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/job/:jobId" element={
            <ProtectedRoute><JobDetailPage /></ProtectedRoute>
          } />
          <Route path="/interview/:jobId" element={
            <ProtectedRoute><InterviewPage /></ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute><InterviewHistoryPage /></ProtectedRoute>
          } />
          <Route path="/saved" element={
            <ProtectedRoute><SavedJobsPage /></ProtectedRoute>
          } />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
