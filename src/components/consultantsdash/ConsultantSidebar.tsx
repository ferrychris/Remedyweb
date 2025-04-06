import React from 'react';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  MessageSquare, 
  LayoutDashboard, 
  Settings, 
  LogOut,
  User,
  Wallet
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useNavigate } from 'react-router-dom';

type TabType = 'overview' | 'availability' | 'pricing' | 'messages' | 'wallet' | 'settings';

interface ConsultantSidebarProps {
  activeTab: string;
  setActiveTab: (tab: TabType) => void;
}

const ConsultantSidebar: React.FC<ConsultantSidebarProps> = ({ activeTab, setActiveTab }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    { id: 'overview' as TabType, label: 'Overview', icon: <LayoutDashboard className="h-5 w-5 mr-3" /> },
    { id: 'availability' as TabType, label: 'Availability', icon: <Calendar className="h-5 w-5 mr-3" /> },
    { id: 'pricing' as TabType, label: 'Pricing', icon: <DollarSign className="h-5 w-5 mr-3" /> },
    { id: 'wallet' as TabType, label: 'Wallet', icon: <Wallet className="h-5 w-5 mr-3" /> },
    { id: 'messages' as TabType, label: 'Messages', icon: <MessageSquare className="h-5 w-5 mr-3" /> },
    { id: 'settings' as TabType, label: 'Settings', icon: <Settings className="h-5 w-5 mr-3" /> },
  ];

  return (
    <div className="w-64 bg-white h-screen shadow-md flex flex-col">
      {/* Profile Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Dr. {profile?.display_name || 'Consultant'}</h2>
            <p className="text-sm text-gray-500">Consultant</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map(item => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-emerald-50 text-emerald-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
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
    </div>
  );
};

export default ConsultantSidebar; 