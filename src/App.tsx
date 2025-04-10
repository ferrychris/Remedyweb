
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';

// Public Components
import Navbar from './components/Navbar';
import Home from './components/Home';
import Footer from './components/Footer';
import { SearchResults } from './components/SearchResults';
import Sidebar from './Sidebar';

// Remedy Components
import Remedies from './components/remedycomponents/Remedies';
import RemedyDetail from './components/remedycomponents/RemedyDetail';
import Ailments from './components/Ailments';
import AilmentDetail from './components/AilmentDetail';

// User Components
import ConsultDoctor from './components/ConsultDoctor';
import { Dashboard } from './components/userdashboard/Dashboard';
import ManageAvailability from './components/consultantsdash/ManageAvailability';
import { NewUserDashboard } from './components/userdashboard/newuserdashboard';
import { Overview } from './components/userdashboard/Overview';
import SavedRemedies from './components/userdashboard/SavedRemedies';

// Store Components
import { Store } from './components/storecomponents/Store';
import ProductDetail from './components/storecomponents/ProductDetail';

// Admin Components
import { AdminDashboard } from './components/admincomponents/AdminDashboard';
import AdminPanel from './components/admincomponents/AdminPanel';
import { AdminLogin } from './components/admincomponents/AdminLogin';
import { RemediesManagement } from './components/admincomponents/RemediesManagement';
import { AilmentsManagement } from './components/admincomponents/AilmentsManagement';
import { StoreManagement } from './components/admincomponents/StoreManagement';
import { UsersManagement } from './components/admincomponents/UsersManagement';
import { ConsultantsManagement } from './components/admincomponents/ConsultantsManagement';
import { AdminSettings } from './components/admincomponents/AdminSettings';
import { HealthTracking } from './components/userdashboard/HealthTracking';
import { Orders } from './components/userdashboard/Orders';
import { Consultations } from './components/userdashboard/Consultations';
import ConsultantDashboard from './components/consultantsdash/ConsultantDashboard';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isAdminLogin = window.location.pathname === '/adminlogin';

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {!isAdminLogin && (
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      )}
      <div className="flex-1">
        <Navbar toggleSidebar={toggleSidebar} />
        <main
          className={`container mx-auto px-4 py-8 ${
            !isAdminLogin && isSidebarOpen ? 'ml-64' : ''
          }`}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/remedies" element={<Remedies />} />
            <Route path="/remedies/:slug" element={<RemedyDetail />} />
            <Route path="/ailments" element={<Ailments />} />
            <Route path="/ailments/:slug" element={<AilmentDetail />} />
            <Route path="/ndashboard" element={<NewUserDashboard />}>
              <Route index element={<Overview />} />
              <Route path="overview" element={<Overview />} />
              <Route path="consultations" element={<Consultations />} />
              <Route path="saved-remedies" element={<SavedRemedies />} />
              <Route path="health-tracking" element={<HealthTracking />} />
              <Route path="orders" element={<Orders />} />
            </Route>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/consult" element={<ConsultDoctor />} />
            <Route path="/consultant/availability" element={<ManageAvailability />} />
            <Route path="/consultantDashboard" element={<ConsultantDashboard />} />
            <Route path="/store" element={<Store />} />
            <Route path="/store/:slug" element={<ProductDetail />} />
            <Route path="/adminlogin" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminPanel />}>
              <Route index element={<AdminDashboard />} />
              <Route path="admindashboard" element={<AdminDashboard />} />
              <Route path="users" element={<UsersManagement />} />
              <Route path="remedies" element={<RemediesManagement />} />
              <Route path="ailments" element={<AilmentsManagement />} />
              <Route path="consultants" element={<ConsultantsManagement />} />
              <Route path="store" element={<StoreManagement />} />
              <Route path="comments" element={<div>Comments Management (Coming Soon)</div>} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            <Route path="/search" element={<SearchResults />} />
          </Routes>
        </main>
        <Footer />
        <Toaster position="bottom-right" />
      </div>
      {isSidebarOpen && !isAdminLogin && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}

export default App;