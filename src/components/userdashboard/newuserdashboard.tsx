import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, User, Calendar, ShoppingBag, Heart, Activity, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import UserNavbar from './UserNavbar';

export function NewUserDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(true);
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname === path + '/';
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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Navbar */}
      <UserNavbar toggleSidebar={toggleSidebar} sidebarVisible={sidebarVisible} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - only show if sidebarVisible is true on mobile */}
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
            <div className="mt-4 bg-emerald-50 text-emerald-700 p-2 rounded-lg text-center">
              Health Score: 85/100
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/ndashboard/overview" 
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive('/ndashboard/overview') || isActive('/ndashboard')
                      ? 'bg-emerald-50 text-emerald-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
                  }`}
                >
                  <Home className="h-5 w-5 mr-3" />
                  Overview
                </Link>
              </li>
              <li>
                <Link 
                  to="/ndashboard/consultations" 
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive('/ndashboard/consultations')
                      ? 'bg-emerald-50 text-emerald-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
                  }`}
                >
                  <Calendar className="h-5 w-5 mr-3" />
                  Consultations
                </Link>
              </li>
              <li>
                <Link 
                  to="/ndashboard/saved-remedies" 
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive('/ndashboard/saved-remedies')
                      ? 'bg-emerald-50 text-emerald-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
                  }`}
                >
                  <Heart className="h-5 w-5 mr-3" />
                  Saved Remedies
                </Link>
              </li>
              <li>
                <Link 
                  to="/ndashboard/health-tracking" 
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive('/ndashboard/health-tracking')
                      ? 'bg-emerald-50 text-emerald-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
                  }`}
                >
                  <Activity className="h-5 w-5 mr-3" />
                  Health Tracking
                </Link>
              </li>
              <li>
                <Link 
                  to="/ndashboard/orders" 
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive('/ndashboard/orders')
                      ? 'bg-emerald-50 text-emerald-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
                  }`}
                >
                  <ShoppingBag className="h-5 w-5 mr-3" />
                  Orders
                </Link>
              </li>
              <li>
                <Link 
                  to="/ndashboard/settings" 
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive('/ndashboard/settings')
                      ? 'bg-emerald-50 text-emerald-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
                  }`}
                >
                  <Settings className="h-5 w-5 mr-3" />
                  Settings
                </Link>
              </li>
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
            <Outlet /> {/* Renders the matched nested route component */}
          </div>
        </main>
      </div>
    </div>
  );
}
