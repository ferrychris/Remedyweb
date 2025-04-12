import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';

// Public Components
import Navbar from './components/Navbar';
import Home from './components/Home';
import Footer from './components/Footer';
import Ailments from './components/Ailments';
import Remedies from './components/remedycomponents/Remedies';

// User Dashboard Components
import { NewUserDashboard } from './components/userdashboard/newuserdashboard';
import { Overview } from './components/userdashboard/Overview';
import SavedRemedies from './components/userdashboard/SavedRemedies';
import HealthMetrics from './components/userdashboard/HealthMetrics';
import { Settings } from './components/userdashboard/Settings';

// Admin Components
import { AdminDashboard } from './components/admincomponents/AdminDashboard';
import { UsersManagement } from './components/admincomponents/UsersManagement';
import { AdminSettings } from './components/admincomponents/AdminSettings';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'patient' | 'consultant' | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setUser(session?.user ?? null);

        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('is_admin, role')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Error fetching user profile:', error);
            return;
          }

          if (mounted) {
            setIsAdmin(profile?.is_admin || false);
            setUserRole(profile?.role || null);
          }
        }
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setUser(session?.user ?? null);
      
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('is_admin, role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          return;
        }

        if (mounted) {
          setIsAdmin(profile?.is_admin || false);
          setUserRole(profile?.role || null);
        }
      } else {
        setIsAdmin(false);
        setUserRole(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Protected route wrapper component
  const ProtectedRoute = ({ children, requireAdmin, requireRole }: { 
    children: React.ReactNode;
    requireAdmin?: boolean;
    requireRole?: 'patient' | 'consultant';
  }) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-8 w-8 border-t-2 border-emerald-500 rounded-full"></div>
        </div>
      );
    }

    if (!user) {
      return <Navigate to="/" />;
    }

    if (requireAdmin && !isAdmin) {
      return <Navigate to="/" />;
    }

    if (requireRole && userRole !== requireRole) {
      return <Navigate to="/" />;
    }

    return <>{children}</>;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar toggleSidebar={toggleSidebar} />
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/ailments" element={<Ailments />} />
          <Route path="/remedies" element={<Remedies />} />

          {/* Protected User Dashboard Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requireRole="patient">
                <NewUserDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="health-metrics" element={<HealthMetrics />} />
            <Route path="saved-remedies" element={<SavedRemedies />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Protected Admin Dashboard Routes */}
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<UsersManagement />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;