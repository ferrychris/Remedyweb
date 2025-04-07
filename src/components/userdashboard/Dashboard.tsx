import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import toast from 'react-hot-toast';
import { AuthModal } from '../AuthModal';
import { supabase } from '../../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import BookingModal from './consultation/BookingModal';
import { motion } from 'framer-motion';

interface UserActivity {
  consultations: any[];
  orders: any[];
  savedRemedies: any[];
  savedAilments: any[];
}

interface AvailableConsultant {
    id: string;
    name: string;
    specialty?: string;
    bio?: string;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingConsultants, setLoadingConsultants] = useState(true);
  const [userActivity, setUserActivity] = useState<UserActivity>({
    consultations: [],
    orders: [],
    savedRemedies: [],
    savedAilments: [],
  });
  const [availableConsultants, setAvailableConsultants] = useState<AvailableConsultant[]>([]);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState<AvailableConsultant | null>(null);

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
          console.error('Error fetching some user activity:', { consultError, orderError, remedyError, ailmentError });
          toast.error('Failed to load some user activity data.');
        }

        setUserActivity({
          consultations: consultations || [],
          orders: orders || [],
          savedRemedies: savedRemedies || [],
          savedAilments: savedAilments || [],
        });
      } catch (error) {
        toast.error('Failed to load user activity');
        console.error('Error fetching user activity:', error);
      } finally {
        setLoading(false);
      }
    }
    if (user) {
        fetchUserActivity();
    } else {
        setLoading(false);
        setLoadingConsultants(false);
    }
  }, [user]);

  const fetchConsultantsWithAvailability = useCallback(async () => {
    setLoadingConsultants(true);
    try {
        const { data: availableSlots, error: slotError } = await supabase
            .from('availability_slots')
            .select('consultant_id')
            .eq('is_booked', false)
            .gt('start_time', new Date().toISOString());

        if (slotError) throw slotError;
        if (!availableSlots || availableSlots.length === 0) {
            setAvailableConsultants([]);
        } else {
            const uniqueConsultantIds = [...new Set(availableSlots.map(slot => slot.consultant_id))];

            const { data: consultants, error: consultantError } = await supabase
                .from('consultants')
                .select('id, name, specialty, bio')
                .in('id', uniqueConsultantIds);

            if (consultantError) throw consultantError;

            setAvailableConsultants(consultants || []);
        }

    } catch (error: any) {
        console.error("Error fetching available consultants:", error);
        toast.error("Failed to load available consultants.");
        setAvailableConsultants([]);
    } finally {
        setLoadingConsultants(false);
        setLoading(false);
    }
  }, []);

  useEffect(() => {
      if (user) {
         fetchConsultantsWithAvailability();
      } 
  }, [user, fetchConsultantsWithAvailability]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const openBookingModal = (consultant: AvailableConsultant) => {
      if (!user) {
          toast.error("Please log in to book a consultation.");
          return;
      }
      setSelectedConsultant(consultant);
      setIsBookingModalOpen(true);
  }

  const closeBookingModal = () => {
      setIsBookingModalOpen(false);
      setSelectedConsultant(null);
      fetchConsultantsWithAvailability();
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center">
        <button 
          onClick={() => navigate(-1)} 
          className="text-emerald-600 hover:text-emerald-700 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-8 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Welcome, {profile?.display_name || 'User'}</h1>
            <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-red-600 hover:text-red-700 px-4 py-2 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
          >
            Sign Out
          </button>
        </div>

        <div className="space-y-8">
          {/* Profile Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Profile Information</h2>
            <div className="bg-gray-50 rounded-xl p-6 space-y-3">
              <p><span className="font-medium">Display Name:</span> {profile?.display_name || 'Not set'}</p>
              <p><span className="font-medium">Bio:</span> {profile?.bio || 'No bio yet'}</p>
              <p><span className="font-medium">Member Since:</span> {new Date(profile?.created_at || '').toLocaleDateString()}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/remedies"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium"
              >
                Browse Remedies
              </Link>
              <Link
                to="/ailments"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium"
              >
                View Ailments
              </Link>
            </div>
          </div>

          {/* Consultations Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Available Consultants</h2>
            {loadingConsultants && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              </div>
            )}
            
            {!loadingConsultants && availableConsultants.length === 0 && (
              <p className="text-gray-600 bg-gray-50 rounded-xl p-6">No consultants currently available for booking.</p>
            )}
            
            {!loadingConsultants && availableConsultants.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availableConsultants.map(consultant => (
                  <div key={consultant.id} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors">
                    <h3 className="font-semibold text-lg text-gray-800">{consultant.name}</h3>
                    {consultant.specialty && (
                      <p className="text-sm text-emerald-600 mt-1">{consultant.specialty}</p>
                    )}
                    {consultant.bio && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{consultant.bio}</p>
                    )}
                    <button
                      onClick={() => openBookingModal(consultant)}
                      className="mt-4 w-full bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                    >
                      Book Consultation
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Activity</h2>
            
            {/* Saved Remedies */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Saved Remedies</h3>
                {userActivity.savedRemedies.length > 0 ? (
                  <div className="space-y-3">
                    {userActivity.savedRemedies.map((saved) => (
                      <Link 
                        key={saved.id} 
                        to={`/remedies/${saved.remedies.slug}`}
                        className="block bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                      >
                        <h4 className="font-medium text-gray-800">{saved.remedies.title}</h4>
                        {saved.remedies.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{saved.remedies.description}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 bg-gray-50 rounded-xl p-4">You haven't saved any remedies yet.</p>
                )}
              </div>

              {/* Recent Consultations */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Recent Consultations</h3>
                {userActivity.consultations.length > 0 ? (
                  <div className="space-y-3">
                    {userActivity.consultations.slice(0, 3).map((consultation) => (
                      <div key={consultation.id} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-gray-800">
                            {consultation.consultant_name || 'Consultation'}
                          </h4>
                          <span className="text-sm text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            {consultation.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(consultation.start_time).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 bg-gray-50 rounded-xl p-4">No consultations yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Booking Modal */}
      {isBookingModalOpen && selectedConsultant && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={closeBookingModal}
          consultantId={selectedConsultant.id}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultIsSignUp={false}
        />
      )}
    </div>
  );
}