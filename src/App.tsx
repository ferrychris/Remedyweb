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

// Store Components
import Store from './components/storecomponents/Store';
import ProductDetail from './components/storecomponents/ProductDetail';

// Admin Components
import { AdminDashboard } from './components/admincomponents/AdminDashboard';
import AdminPanel from './components/admincomponents/AdminPanel';
import { AdminLogin } from './components/admincomponents/AdminLogin';

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
          
          {/* User Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/consult" element={<ConsultDoctor />} />
          
          {/* Store Routes */}
          <Route path="/store" element={<Store />} />
          <Route path="/store/:slug" element={<ProductDetail />} />
          
          {/* Admin Routes */}
          <Route path="/adminlogin" element={<AdminLogin />} />
          <Route path="/admin/*" element={<AdminPanel />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<div>Users Management (Coming Soon)</div>} />
            <Route path="remedies" element={<div>Remedies Management (Coming Soon)</div>} />
            <Route path="comments" element={<div>Comments Management (Coming Soon)</div>} />
            <Route path="settings" element={<div>Admin Settings (Coming Soon)</div>} />
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