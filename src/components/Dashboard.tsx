import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';
import { AuthModal } from './AuthModal';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

interface UserActivity {
  consultations: any[];
  orders: any[];
  savedRemedies: any[];
  savedAilments: any[];
}

export function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userActivity, setUserActivity] = useState<UserActivity>({
    consultations: [],
    orders: [],
    savedRemedies: [],
    savedAilments: [],
  });

  useEffect(() => {
    async function fetchUserActivity() {
      if (!user) return;

      try {
        setLoading(true);
        
        // Fetch consultations
        const { data: consultations, error: consultError } = await supabase
          .from('consultations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        // Fetch orders
        const { data: orders, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        // Fetch saved remedies
        const { data: savedRemedies, error: remedyError } = await supabase
          .from('saved_remedies')
          .select('*, remedies(*)')
          .eq('user_id', user.id);

        // Fetch saved ailments
        const { data: savedAilments, error: ailmentError } = await supabase
          .from('saved_ailments')
          .select('*, ailments(*)')
          .eq('user_id', user.id);

        if (consultError || orderError || remedyError || ailmentError) {
          throw new Error('Error fetching user activity');
        }

        setUserActivity({
          consultations: consultations || [],
          orders: orders || [],
          savedRemedies: savedRemedies || [],
          savedAilments: savedAilments || [],
        });
      } catch (error) {
        toast.error('Failed to load user activity');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserActivity();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome, {profile?.display_name || 'User'}</h1>
            <p className="text-sm text-gray-600 mt-1">User ID: {user?.id}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Profile Information</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Email:</span> {user?.email}</p>
              <p><span className="font-medium">Display Name:</span> {profile?.display_name || 'Not set'}</p>
              <p><span className="font-medium">Bio:</span> {profile?.bio || 'No bio yet'}</p>
              <p><span className="font-medium">Member Since:</span> {new Date(profile?.created_at || '').toLocaleDateString()}</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
            <div className="space-y-4">
              <Link
                to="/remedies"
                className="block w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                Browse Remedies
              </Link>
              <Link
                to="/ailments"
                className="block w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                View Ailments
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Saved Remedies */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Saved Remedies</h2>
          {userActivity.savedRemedies.length > 0 ? (
            <div className="space-y-4">
              {userActivity.savedRemedies.map((item: any) => (
                <Link
                  key={item.id}
                  to={`/remedies/${item.remedies.slug}`}
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <h3 className="font-medium">{item.remedies.title}</h3>
                  <p className="text-sm text-gray-600">Saved on: {new Date(item.created_at).toLocaleDateString()}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No saved remedies yet</p>
          )}
        </div>

        {/* Saved Ailments */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Saved Ailments</h2>
          {userActivity.savedAilments.length > 0 ? (
            <div className="space-y-4">
              {userActivity.savedAilments.map((item: any) => (
                <Link
                  key={item.id}
                  to={`/ailments/${item.ailments.slug}`}
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <h3 className="font-medium">{item.ailments.name}</h3>
                  <p className="text-sm text-gray-600">Saved on: {new Date(item.created_at).toLocaleDateString()}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No saved ailments yet</p>
          )}
        </div>

        {/* Past Consultations */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Past Consultations</h2>
          {userActivity.consultations.length > 0 ? (
            <div className="space-y-4">
              {userActivity.consultations.map((consultation: any) => (
                <div key={consultation.id} className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-medium">Consultation #{consultation.id}</h3>
                  <p className="text-sm text-gray-600">Date: {new Date(consultation.created_at).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">Status: {consultation.status}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No consultations yet</p>
          )}
        </div>

        {/* Order History */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Order History</h2>
          {userActivity.orders.length > 0 ? (
            <div className="space-y-4">
              {userActivity.orders.map((order: any) => (
                <div key={order.id} className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-medium">Order #{order.id}</h3>
                  <p className="text-sm text-gray-600">Date: {new Date(order.created_at).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">Status: {order.status}</p>
                  <p className="text-sm font-medium text-green-600">Total: ${order.total}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No orders yet</p>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}