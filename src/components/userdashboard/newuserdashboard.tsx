import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Routes, Route } from 'react-router-dom';
import { Menu, X, Bell, User } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Sidebar } from './Sidebar';
import { Consultations } from './Consultations';
import { SavedRemedies } from './SavedRemedies';
import { HealthTracking } from './HealthTracking';
import { Orders } from './dashboard/Orders';       
// import { Orders } from '../userdashboard/Orders';
import { Overview } from './dashboard/Overview';

export function NewUserDashboard() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(true);
  const [overallRating, setOverallRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Dashboard Navbar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm z-30">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none lg:hidden"
            >
              {sidebarVisible ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="ml-4 text-xl font-semibold text-gray-800">Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none">
                <Bell className="h-5 w-5" />
              </button>
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white">
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-gray-700">{profile?.display_name || 'Patient'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
        sidebarVisible ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar 
          profile={profile}
          overallRating={overallRating}
          isLoading={isLoading}
          handleSignOut={handleSignOut}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        <div className="h-full overflow-y-auto pt-16">
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<Overview />} />
                <Route path="/overview" element={<Overview />} />
                <Route path="/consultations" element={<Consultations />} />
                <Route path="/saved-remedies" element={<SavedRemedies />} />
                <Route path="/health-tracking" element={<HealthTracking />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="*" element={<Overview />} />
              </Routes>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
