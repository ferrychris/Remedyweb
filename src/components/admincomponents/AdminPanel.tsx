import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, 
  Users, 
  Leaf, 
  MessageSquare, 
  Settings,
  ChevronRight,
  Menu,
  Stethoscope, // Added for Consultants icon
} from 'lucide-react';

// Import the management components
import { AilmentsManagement } from './AilmentsManagement';
import { RemediesManagement } from './RemediesManagement';
import { StoreManagement } from './StoreManagement';
import { AdminDashboard } from './AdminDashboard';
import { ConsultantsManagement } from './ConsultantsManagement'; // Added ConsultantsManagement

interface AdminPanelProps {}

const AdminPanel: React.FC<AdminPanelProps> = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('AdminPanel useEffect triggered');
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('User fetch error:', userError);
        throw new Error('Failed to get user: ' + userError.message);
      }
      if (!user) {
        toast.error('Please log in to access admin panel');
        navigate('/adminlogin');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles') // Ensure this matches your table
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        if (profileError.code === 'PGRST116') {
          toast.error('User profile not found. Please complete your profile setup.');
        } else {
          toast.error('Failed to verify admin status: ' + profileError.message);
        }
        navigate('/adminlogin');
        return;
      }

      if (!profile?.is_admin) {
        toast.error('Unauthorized access');
        navigate('/');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Admin check error:', error);
      toast.error('Error checking admin status: ' + (error.message || 'Unknown error'));
      navigate('/adminlogin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      navigate('/adminlogin');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Error signing out: ' + (error.message || 'Unknown error'));
    }
  };

  const navigationItems = [
    { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/admin/users', icon: <Users size={20} />, label: 'Users' },
    { path: '/admin/remedies', icon: <Leaf size={20} />, label: 'Remedies' },
    { path: '/admin/ailments', icon: <Leaf size={20} />, label: 'Ailments' },
    { path: '/admin/consultants', icon: <Stethoscope size={20} />, label: 'Consultants' }, // Added Consultants
    { path: '/admin/store', icon: <MessageSquare size={20} />, label: 'Store' },
    { path: '/admin/comments', icon: <MessageSquare size={20} />, label: 'Comments' },
    { path: '/admin/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar Toggle Button for Mobile */}
      <button
        className="fixed top-20 left-4 md:hidden z-50 bg-white p-2 rounded-full shadow-lg"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Menu size={20} />
      </button>

      {/* Sidebar */}
      <div
        className={`
          fixed md:static
          inset-y-0 left-0
          w-64 bg-white shadow-lg
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          z-40
        `}
      >
        <div className="p-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">Admin Panel</h2>
          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center space-x-3 p-3 rounded-lg
                  ${location.pathname === item.path 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                {item.icon}
                <span>{item.label}</span>
                <ChevronRight 
                  size={16} 
                  className={`ml-auto ${
                    location.pathname === item.path ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </Link>
            ))}

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="w-full mt-4 flex items-center space-x-3 p-3 rounded-lg text-red-600 hover:bg-red-50"
            >
              <span>Sign Out</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminPanel;