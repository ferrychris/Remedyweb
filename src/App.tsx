import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Public Components
import Navbar from './components/Navbar';
import Home from './components/Home';
import Footer from './components/Footer';
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
import { NewUserDashboard } from './components/userdashboard/newuserdashboard.tsx';
import { Overview } from './components/userdashboard/Overview.tsx';
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
import { HealthTracking } from './components/userdashboard/HealthTracking.tsx';
import { Orders } from './components/userdashboard/Orders.tsx';
import { Consultations } from './components/userdashboard/Consultations.tsx';
import ConsultantDashboard from './components/consultantsdash/ConsultantDashboard.tsx';


function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          
          {/* Remedy Routes */}
          <Route path="/remedies" element={<Remedies />} />
          <Route path="/remedies/:slug" element={<RemedyDetail />} />
          <Route path="/ailments" element={<Ailments />} />
          <Route path="/ailments/:slug" element={<AilmentDetail />} />
          
          {/* New User Dashboard Routes (Nested) */}
          <Route path="/ndashboard" element={<NewUserDashboard />}>
            <Route index element={<Overview />} /> {/* Default view */}
            <Route path="overview" element={<Overview/>} />
            <Route path="consultations" element={<Consultations/>} />
            <Route path="saved-remedies" element={<SavedRemedies />} />
            <Route path="health-tracking" element={<HealthTracking />} />
            <Route path="orders" element={<Orders />} />
          </Route>
          
          {/* Old User Dashboard Route (keep or remove as needed) */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Other User Routes */}
          <Route path="/consult" element={<ConsultDoctor />} />
          <Route path="/consultant/availability" element={<ManageAvailability />} />



          {/* Consultants route */}
          
          <Route path="/consultantDashboard" element={< ConsultantDashboard/>} />



          {/* Store Routes */}
          <Route path="/store" element={<Store />} />
          <Route path="/store/:slug" element={<ProductDetail />} />
          
          {/* Admin Routes */}
          <Route path="/adminlogin" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminPanel />}>
            <Route index element={<AdminDashboard />} />
            <Route path="admindashboard" element={<AdminDashboard/>} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="remedies" element={<RemediesManagement/>} />
            <Route path="ailments" element={<AilmentsManagement/>} />
            <Route path="consultants" element={<ConsultantsManagement />} />
            <Route path="store" element={<StoreManagement/>} />
            <Route path="comments" element={<div>Comments Management (Coming Soon)</div>} />
            <Route path="settings" element={<AdminSettings/>} />
          </Route>
          
          {/* Search Route */}
          <Route path="/search" element={<SearchResults />} />
        </Routes>
      </main>
      <Footer />
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;