import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Footer from './components/Footer';
import { NewUserDashboard } from './components/userdashboard/newuserdashboard';
import { AuthGuard } from './components/AuthGuard';
import { ConsultantDashboard } from './components/consultantdashboard/ConsultantDashboard';
import { ConsultantOverview } from './components/consultantdashboard/ConsultantOverview';
import { Patients } from './components/consultantdashboard/Patients';
import { Appointments } from './components/consultantdashboard/Appointments';
import { Messages } from './components/consultantdashboard/Messages';
import { ConsultantSettings } from './components/consultantdashboard/ConsultantSettings';
import { Overview } from './components/userdashboard/dashboard/Overview';
import { Consultations } from './components/userdashboard/dashboard/Consultations';
import { SavedRemedies } from './components/userdashboard/dashboard/SavedRemedies';
import { HealthTracking } from './components/userdashboard/HealthTracking';
import { Orders } from './components/userdashboard/dashboard/Orders';
import { Settings } from './components/userdashboard/dashboard/Settings';
import Remedies from './components/remedycomponents/Remedies';
import RemedyDetail from './components/remedycomponents/RemedyDetail';
import SubmitRemedy from './components/remedycomponents/SubmitRemedy';
import AppointmentManager from './components/consultantsdash/AppointmentManager';
import SetAvailability from './components/consultantdashboard/Setavailability';
function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Routes>
        {/* Public routes with navbar and footer */}
        <Route path="/" element={
          <>
            <Navbar toggleSidebar={toggleSidebar} />
            <Home />
            <Footer />
          </>
        } />

        {/* Public remedies route */}
        <Route path="/remedies" element={
          <>
            <Navbar toggleSidebar={toggleSidebar} />
            <Remedies />
            <Footer />
          </>
        } />
        <Route path="/remedies/:slug" element={
          <>
            <Navbar toggleSidebar={toggleSidebar} />
            <RemedyDetail />
            <Footer />
          </>
        } />
        <Route path="/submit-remedy" element={
          <>
            <Navbar toggleSidebar={toggleSidebar} />
            <SubmitRemedy />
            <Footer />
          </>
        } />

        {/* Dashboard routes without navbar and footer */}
        <Route path="/ndashboard" element={<NewUserDashboard />}>
          <Route index element={<Overview />} />
          <Route path="overview" element={<Overview />} />
          <Route path="consultations" element={<Consultations />} />
          <Route path="saved-remedies" element={<SavedRemedies />} />
          <Route path="health-tracking" element={<HealthTracking />} />
          <Route path="orders" element={<Orders />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Protected Consultant Routes */}
        <Route path="/consultant" element={<AuthGuard><ConsultantDashboard /></AuthGuard>}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<ConsultantOverview />} />
          <Route path="patients" element={<Patients />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="messages" element={<Messages />} />
          <Route path="settings" element={<ConsultantSettings />} />
          <Route path="set-availability" element={<SetAvailability />} />
          <Route path="appointmentmanager" element={<AppointmentManager />} />
        </Route>

        {/* Redirect to home for unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;