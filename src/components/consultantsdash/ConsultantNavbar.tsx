import React, { useState } from 'react';
import { Bell, MessageSquare, HelpCircle, Search, Menu, X } from 'lucide-react';
import { useAuth } from '../../lib/auth';

interface ConsultantNavbarProps {
  toggleSidebar: () => void;
  sidebarVisible: boolean;
}

const ConsultantNavbar: React.FC<ConsultantNavbarProps> = ({ toggleSidebar, sidebarVisible }) => {
  const { profile } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  return (
    <div className="bg-white border-b border-gray-200 h-16 px-4 flex items-center justify-between">
      {/* Left side - Menu toggle and Search */}
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar} 
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none mr-2"
        >
          {sidebarVisible ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Search..."
            className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <Search className="h-4 w-4" />
          </div>
        </div>
      </div>
      
      {/* Right side - Notifications and Profile */}
      <div className="flex items-center">
        <button className="p-2 relative rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none">
          <HelpCircle className="h-5 w-5" />
        </button>

        <button className="p-2 relative rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none mx-2">
          <MessageSquare className="h-5 w-5" />
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 relative rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none mr-2"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg overflow-hidden z-50">
              <div className="p-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="p-3 border-b border-gray-100 hover:bg-gray-50">
                  <p className="text-sm font-medium text-gray-900">New appointment request</p>
                  <p className="text-xs text-gray-500 mt-1">John Doe requested a consultation for tomorrow at 2:00 PM</p>
                  <p className="text-xs text-gray-400 mt-1">10 minutes ago</p>
                </div>
                <div className="p-3 border-b border-gray-100 hover:bg-gray-50">
                  <p className="text-sm font-medium text-gray-900">Payment received</p>
                  <p className="text-xs text-gray-500 mt-1">You received a payment of $150.00 for consultation #12345</p>
                  <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                </div>
                <div className="p-3 hover:bg-gray-50">
                  <p className="text-sm font-medium text-gray-900">Schedule update</p>
                  <p className="text-xs text-gray-500 mt-1">Your availability for next week has been updated</p>
                  <p className="text-xs text-gray-400 mt-1">Yesterday</p>
                </div>
              </div>
              <div className="p-2 border-t border-gray-200 text-center">
                <button className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 flex items-center justify-center text-white">
              {profile?.display_name?.charAt(0) || 'C'}
            </div>
          </button>
          
          {showProfile && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg overflow-hidden z-50">
              <div className="p-3 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">Dr. {profile?.display_name || 'Consultant'}</p>
                <p className="text-xs text-gray-500 mt-1">Consultant</p>
              </div>
              <div>
                <button className="w-full text-left p-3 text-sm text-gray-700 hover:bg-gray-50">
                  Profile Settings
                </button>
                <button className="w-full text-left p-3 text-sm text-gray-700 hover:bg-gray-50">
                  Account
                </button>
                <button className="w-full text-left p-3 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100">
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultantNavbar; 