import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Remedies from './components/Remedies';
import RemedyDetail from './components/RemedyDetail';
import Ailments from './components/Ailments';
import AilmentDetail from './components/AilmentDetail';
import ConsultDoctor from './components/ConsultDoctor';
import Store from './components/Store';
import ProductDetail from './components/ProductDetail';
import Admin from './components/Admin';
import { AdminDashboard } from './components/AdminDashboard';
import Footer from './components/Footer';
import { SearchResults } from './components/SearchResults';
import { Dashboard } from './components/Dashboard';
import { AdminLogin } from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/*" element={<AdminPanel />} />
          <Route path="/" element={<Home />} />
          <Route path="/remedies" element={<Remedies />} />
          <Route path="/remedies/:slug" element={<RemedyDetail />} />
          <Route path="/ailments" element={<Ailments />} />
          <Route path="/ailments/:slug" element={<AilmentDetail />} />
          <Route path="/consult" element={<ConsultDoctor />} />
          <Route path="/store" element={<Store />} />
          <Route path="/store/:slug" element={<ProductDetail />} />
          <Route path='/test' element={<AdminDashboard/>}/>          <Route path="/search" element={<SearchResults />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;