import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, DollarSign, Users, MessageSquare, ChevronRight, Settings, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import AvailabilityManager from './AvailabilityManager';
import PricingManager from './PricingManager';
import WalletManager from './WalletManager';
import ConsultantSidebar from './ConsultantSidebar';
import ConsultantNavbar from './ConsultantNavbar';

interface Consultation {
  id: number;
  patientName: string;
  date: string;
  status: 'Completed' | 'Upcoming' | 'Cancelled';
  symptoms: string;
}

interface Message {
  id: number;
  from: string;
  message: string;
  date: string;
}

interface Stats {
  upcomingConsultations: number;
  completedConsultations: number;
  totalEarnings: number;
  totalClients: number;
}

type TabType = 'overview' | 'availability' | 'pricing' | 'messages' | 'wallet' | 'settings';

function ConsultantDashboard(): JSX.Element {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(true);
  const [stats, setStats] = useState<Stats>({
    upcomingConsultations: 0,
    completedConsultations: 0,
    totalEarnings: 0,
    totalClients: 0
  });
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Sample data - would be fetched from backend in a real app
  const recentConsultations: Consultation[] = [
    { id: 1, patientName: 'John Doe', date: '2023-07-15T10:00:00', status: 'Completed', symptoms: 'Headache, Fever' },
    { id: 2, patientName: 'Jane Smith', date: '2023-07-17T14:30:00', status: 'Upcoming', symptoms: 'Cough, Sore throat' },
    { id: 3, patientName: 'Robert Brown', date: '2023-07-18T09:15:00', status: 'Upcoming', symptoms: 'Joint pain' }
  ];
  
  const recentMessages: Message[] = [
    { id: 1, from: 'John Doe', message: 'Thank you for the consultation!', date: '2023-07-15T11:30:00' },
    { id: 2, from: 'Jane Smith', message: 'Looking forward to our session.', date: '2023-07-16T15:45:00' }
  ];

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setStats({
        upcomingConsultations: 5,
        completedConsultations: 12,
        totalEarnings: 1250,
        totalClients: 8
      });
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-emerald-500">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-emerald-100 mr-4">
                    <Calendar className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Upcoming Consultations</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.upcomingConsultations}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 mr-4">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completed Consultations</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.completedConsultations}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 mr-4">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Earnings</p>
                    <p className="text-2xl font-bold text-gray-800">${stats.totalEarnings}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100 mr-4">
                    <Users className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Clients</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalClients}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Consultations */}
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Recent Consultations</h2>
                <button 
                  onClick={() => setActiveTab('availability')} 
                  className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center"
                >
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symptoms</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentConsultations.map(consultation => (
                      <tr key={consultation.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{consultation.patientName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{new Date(consultation.date).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              consultation.status === 'Completed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {consultation.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {consultation.symptoms}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Recent Earnings */}
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Recent Earnings</h2>
                <button 
                  onClick={() => setActiveTab('wallet')} 
                  className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center"
                >
                  View Wallet <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
              
              <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-xl mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-emerald-100 rounded-full mr-3">
                    <Wallet className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Available Balance</p>
                    <p className="text-xl font-bold text-emerald-600">${stats.totalEarnings.toFixed(2)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('wallet')}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
                >
                  Withdraw
                </button>
              </div>
            </div>
            
            {/* Recent Messages */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Recent Messages</h2>
                <button 
                  onClick={() => setActiveTab('messages')}
                  className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center"
                >
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
              
              {recentMessages.map(message => (
                <div key={message.id} className="border-b border-gray-200 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{message.from}</h3>
                      <p className="text-sm text-gray-600 mt-1">{message.message}</p>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(message.date).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      case 'availability':
        return (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Manage Your Availability</h2>
            <AvailabilityManager />
          </div>
        );
      case 'pricing':
        return (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Manage Your Pricing</h2>
            <PricingManager />
          </div>
        );
      case 'wallet':
        return (
          <WalletManager />
        );
      case 'messages':
        return (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Messages</h2>
            <div className="space-y-4">
              {recentMessages.map(message => (
                <div key={message.id} className="border-b border-gray-200 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{message.from}</h3>
                      <p className="text-gray-600 mt-1">{message.message}</p>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(message.date).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              <p className="text-center text-gray-500 pt-4">
                This is just a preview. Full messaging system coming soon.
              </p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Account Settings</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Profile Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                    <input 
                      type="text" 
                      defaultValue={profile?.display_name || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input 
                      type="email" 
                      defaultValue={user?.email || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea 
                      defaultValue={profile?.bio || ''}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Notification Preferences</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input type="checkbox" id="email-notifications" defaultChecked className="h-4 w-4 text-emerald-600" />
                    <label htmlFor="email-notifications" className="ml-2 text-gray-700">Email notifications for new appointments</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="sms-notifications" defaultChecked className="h-4 w-4 text-emerald-600" />
                    <label htmlFor="sms-notifications" className="ml-2 text-gray-700">SMS notifications for new appointments</label>
                  </div>
                </div>
                <div className="mt-4">
                  <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <div>Invalid tab</div>;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Navbar */}
      <ConsultantNavbar toggleSidebar={toggleSidebar} sidebarVisible={sidebarVisible} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - only show if sidebarVisible is true */}
        {sidebarVisible && (
          <ConsultantSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
        
        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto p-8 ${sidebarVisible ? 'ml-0' : 'ml-0'}`}>
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-800">
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'availability' && 'Manage Availability'}
                {activeTab === 'pricing' && 'Consultation Pricing'}
                {activeTab === 'wallet' && 'Earnings & Wallet'}
                {activeTab === 'messages' && 'Messages'}
                {activeTab === 'settings' && 'Account Settings'}
              </h1>
              <p className="text-gray-600">
                {activeTab === 'overview' && 'Welcome back, Dr. ' + (profile?.display_name || 'Consultant')}
                {activeTab === 'availability' && 'Set your available days and times for consultations'}
                {activeTab === 'pricing' && 'Manage your consultation prices and services'}
                {activeTab === 'wallet' && 'View your earnings and manage withdrawals'}
                {activeTab === 'messages' && 'View and respond to patient messages'}
                {activeTab === 'settings' && 'Manage your account settings and preferences'}
              </p>
            </div>

            {/* Dynamic Content Area */}
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {renderContent()}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ConsultantDashboard;
