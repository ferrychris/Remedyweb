import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, User, Calendar, ShoppingBag, Heart, Activity, Settings as SettingsIcon, LogOut, Bell, ChevronRight, Plus } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import UserNavbar from './UserNavbar';
import HealthMetrics from './HealthMetrics';
import { Settings } from './Settings';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  profile: UserProfile | null;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  signOut: () => Promise<void>;
}

// Add Settings component
function SettingsSection() {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    bio: profile?.bio || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          display_name: formData.display_name,
          bio: formData.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Profile update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">
              Display Name
            </label>
            <input
              type="text"
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function NewUserDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(true);
  const [overallRating, setOverallRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname === path + '/';
  };

  useEffect(() => {
    if (profile?.id) {
      fetchOverallRating();
    }
  }, [profile?.id]);

  const fetchOverallRating = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('health_reviews')
        .select('overall_rating, created_at')
        .eq('patient_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setOverallRating(data[0].overall_rating);
      } else {
        setOverallRating(null);
      }
    } catch (error) {
      console.error('Error fetching overall rating:', error);
      setOverallRating(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 80) return 'text-emerald-500';
    if (rating >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 80) return 'Excellent';
    if (rating >= 60) return 'Good';
    if (rating >= 40) return 'Fair';
    return 'Poor';
  };

  const navigation = [
    { name: 'Overview', href: '/ndashboard/overview', icon: Home },
    { name: 'Consultations', href: '/ndashboard/consultations', icon: Calendar },
    { name: 'Saved Remedies', href: '/ndashboard/saved-remedies', icon: Heart },
    { name: 'Health Metrics', href: '/ndashboard/health-metrics', icon: Activity },
    { name: 'Orders', href: '/ndashboard/orders', icon: ShoppingBag },
    { name: 'Settings', href: '/ndashboard/settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Navbar */}
      <UserNavbar toggleSidebar={toggleSidebar} sidebarVisible={sidebarVisible} />
      
      <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
        <aside className={`${sidebarVisible ? 'block' : 'hidden'} lg:block w-64 bg-white h-full shadow-md flex flex-col`}>
          {/* User Profile Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{profile?.display_name || 'Patient'}</h2>
                <p className="text-sm text-gray-500">Patient</p>
              </div>
            </div>
            {isLoading ? (
              <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-emerald-500"></div>
                </div>
              </div>
            ) : overallRating !== null ? (
              <div className="mt-4 bg-emerald-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Heart className="h-5 w-5 text-emerald-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Health Score</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className={`text-lg font-bold ${getRatingColor(overallRating)}`}>
                      {overallRating}%
                    </div>
                    <div className="text-xs text-gray-500">{getRatingLabel(overallRating)}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Heart className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-500">No Health Score Yet</span>
                  </div>
            </div>
          </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link 
                    to={item.href} 
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.href) ? 'bg-emerald-50 text-emerald-600 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
          </Link>
                </li>
              ))}
            </ul>
        </nav>

          {/* Sign Out Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
        </div>
    </div>
  );
}
