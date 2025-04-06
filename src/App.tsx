import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout Components
import DashboardLayout from './components/DashboardLayout';

// Public Components
import Home from './components/Home';
import { SearchResults } from './components/SearchResults';

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
import Store from './components/storecomponents/Store';
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
import AppointmentManager from './components/consultantsdash/AppointmentManager';
import BookAppointment from './components/consultantsdash/BookAppointment';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes with Navbar and Footer */}
        <Route element={<DashboardLayout />}>
          {/* Public Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          
          {/* Remedy Routes */}
          <Route path="/remedies" element={<Remedies />} />
          <Route path="/remedies/:slug" element={<RemedyDetail />} />
          <Route path="/ailments" element={<Ailments />} />
          <Route path="/ailments/:slug" element={<AilmentDetail />} />
          
          {/* Store Routes */}
          <Route path="/store" element={<Store />} />
          <Route path="/store/:slug" element={<ProductDetail />} />
          
          {/* Consultation Routes */}
          <Route path="/consult" element={<ConsultDoctor />} />
          
          {/* User Dashboard Routes (shows dashboard nav, hides main nav) */}
          <Route path="/ndashboard" element={<NewUserDashboard />}>
            <Route index element={<Overview />} /> {/* Default view */}
            <Route path="overview" element={<Overview />} />
            <Route path="consultations" element={<Consultations />} />
            <Route path="saved-remedies" element={<SavedRemedies />} />
            <Route path="health-tracking" element={<HealthTracking />} />
            <Route path="orders" element={<Orders />} />
          </Route>
          
          {/* Legacy User Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Appointment Routes */}
          <Route path="/appointment" element={<AppointmentManager />} />
          <Route path="/book-appointment/:id" element={<BookAppointment />} />
          <Route path="/consultant/availability" element={<ManageAvailability />} />
          
          {/* Consultant Dashboard Routes */}
          <Route path="/consultant-dashboard" element={<ConsultantDashboard />} />
          
          {/* Admin Routes */}
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
        </Route>
      </Routes>
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;