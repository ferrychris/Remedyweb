import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, Calendar, ShoppingBag, Heart, Activity, Settings as SettingsIcon, LogOut } from 'lucide-react';

interface SidebarProps {
  profile: {
    display_name?: string;
  } | null;
  overallRating: number | null;
  isLoading: boolean;
  handleSignOut: () => void;
}

export function Sidebar({ profile, overallRating, isLoading, handleSignOut }: SidebarProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname === path + '/';
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
    { name: 'Health Tracking', href: '/ndashboard/health-tracking', icon: Activity },
    { name: 'Consultations', href: '/ndashboard/consultations', icon: Calendar },
    { name: 'Saved Remedies', href: '/ndashboard/saved-remedies', icon: Heart },
    { name: 'Orders', href: '/ndashboard/orders', icon: ShoppingBag },
    { name: 'Settings', href: '/ndashboard/settings', icon: SettingsIcon },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg">
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="px-6 py-4 border-b border-gray-200">
          <Link to="/overview" className="flex items-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
              remedy
            </span>
          </Link>
        </div>

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
        <nav className="flex-1 px-2 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link 
                  to={item.href} 
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
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
        <div className="px-2 py-4 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
