// src/components/userdashboard/sections/Consultations.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { User, Calendar } from 'lucide-react';
import BookingModal from './consultation/BookingModal';

interface Consultation {
  id: string;
  user_id: string;
  consultant_id: string;
  scheduled_for: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
  consultant?: ConsultantProfile;
}

interface ConsultantProfile {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  specialty: string;
  bio: string;
  status: string;
  is_active: boolean;
  created_at: string;
}

interface Availability {
  id: string;
  consultant_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  day: number;
  dayName: string;
  dateString: string;
}

export function Consultations() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [activeConsultants, setActiveConsultants] = useState<ConsultantProfile[]>([]);
  const [selectedConsultant, setSelectedConsultant] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [consultationNote, setConsultationNote] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, _setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user consultations
      const { data: consultationsData, error: consultationsError } = await supabase
        .from('consultations')
        .select('*, consultant:consultants(*)')
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: false });

      if (consultationsError) throw consultationsError;
      
      console.log('Raw consultations data:', consultationsData);
      
      // Process and type the consultant data properly with stronger typing
      const processedConsultations = (consultationsData || []).map(consultation => {
        // Use a safe approach to handle any shape of consultant data
        let consultantData: ConsultantProfile | undefined = undefined;
        
        if (consultation.consultant) {
          // Handle the case where consultant might be an array
          const consultantSource = Array.isArray(consultation.consultant) 
            ? consultation.consultant[0] 
            : consultation.consultant;
          
          if (consultantSource) {
            // Safely extract all properties with fallbacks
            const name = String(consultantSource.name || '');
            const nameParts = name.split(' ');
            
            consultantData = {
              id: String(consultantSource.id || consultation.consultant_id || ''),
              user_id: String(consultantSource.user_id || ''),
              email: String(consultantSource.email || ''),
              first_name: String(consultantSource.first_name || nameParts[0] || ''),
              last_name: String(consultantSource.last_name || nameParts.slice(1).join(' ') || ''),
              specialty: String(consultantSource.specialty || ''),
              bio: String(consultantSource.bio || ''),
              status: String(consultantSource.status || 'active'),
              is_active: Boolean(consultantSource.is_active || true),
              created_at: String(consultantSource.created_at || consultation.created_at || '')
            };
          }
        }
        
        // Create a properly typed consultation object
        return {
          id: String(consultation.id || ''),
          user_id: String(consultation.user_id || ''),
          consultant_id: String(consultation.consultant_id || ''),
          scheduled_for: String(consultation.scheduled_for || ''),
          status: String(consultation.status || ''),
          notes: String(consultation.notes || ''),
          created_at: String(consultation.created_at || ''),
          updated_at: String(consultation.updated_at || ''),
          consultant: consultantData
        } as Consultation;
      });
      
      setConsultations(processedConsultations);
    } catch (error) {
      toast.error('Failed to load consultations');
      console.error('Consultations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleConsultation = async () => {
    // Implementation goes here
    // This function is declared but not used in the current code
  };

  const formatDateTime = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  const handleCancelConsultation = async (consultationId: string) => {
    try {
      const { error } = await supabase
        .from('consultations')
        .update({ status: 'cancelled' })
        .eq('id', consultationId);

      if (error) throw error;
      toast.success('Consultation cancelled');
      fetchData(); // Refresh the data
    } catch (error) {
      console.error('Error cancelling consultation:', error);
      toast.error('Failed to cancel consultation');
    }
  };

  const handleBookingSuccess = () => {
    toast.success('Booking successful!');
    fetchData(); // Refresh the consultations list
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Consultations</h1>

      {/* Available Consultants */}
      <div className="bg-white p-4 sm:p-6 rounded-md shadow-sm mb-6 sm:mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Available Consultants</h2>
          <button
            onClick={fetchData}
            className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center"
          >
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : activeConsultants.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No consultants with availability found at this time.</p>
            <p className="text-gray-500 mt-2">Please check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {activeConsultants.map(consultant => (
              <div key={consultant.id} className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="h-10 sm:h-12 w-10 sm:w-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white">
                        <User className="h-5 sm:h-6 w-5 sm:w-6" />
                      </div>
                      <div className="ml-3 sm:ml-4">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800">Dr. {consultant.first_name} {consultant.last_name}</h3>
                        <p className="text-xs sm:text-sm text-gray-600">{consultant.specialty}</p>
                      </div>
                    </div>
                  </div>
                  
                  {consultant.bio && (
                    <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600 line-clamp-2">{consultant.bio}</p>
                  )}
                  
                  <div className="mt-3 sm:mt-4">
                    <div className="flex justify-between items-center mb-1 sm:mb-2">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-700">Availability</h4>
                      <span className="text-xs text-emerald-600">{availableSlots.length} slots</span>
                    </div>
                    
                    <div className="space-y-1 sm:space-y-2 max-h-24 sm:max-h-32 overflow-y-auto">
                      {availableSlots.slice(0, 3).map(slot => (
                        <div key={slot.id} className="flex items-center justify-between bg-gray-50 px-2 sm:px-3 py-1 sm:py-2 rounded-md">
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="truncate max-w-[180px]">{formatDateTime(slot.dateString)}</span>
                          </div>
                        </div>
                      ))}
                      {(availableSlots.length || 0) > 3 && (
                        <div className="text-center text-xs text-emerald-600">
                          +{(availableSlots.length || 0) - 3} more slots
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 sm:mt-5 flex justify-between items-center">
                    <div className="text-emerald-600 font-semibold text-sm sm:text-base">
                      ${consultant.specialty === 'Psychologist' ? '50' : '30'}/hour
                    </div>
                    <button
                      onClick={() => setSelectedConsultant(consultant.id)}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Your Scheduled Consultations */}
      <div className="bg-white p-4 sm:p-6 rounded-md shadow-sm mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Your Consultations</h2>
        {consultations.length === 0 ? (
          <p className="text-gray-600">No consultations scheduled.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden sm:rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Consultant
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        Notes
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {consultations.map((consultation) => (
                      <tr key={consultation.id}>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          <div className="truncate max-w-[100px] sm:max-w-none">
                            {consultation.consultant?.first_name} {consultation.consultant?.last_name} 
                            <span className="hidden sm:inline">({consultation.consultant?.specialty || ''})</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          {new Date(consultation.scheduled_for).toLocaleString()}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-md ${
                              consultation.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : consultation.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {consultation.status}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                          {consultation.notes || 'No notes'}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                          {consultation.status !== 'cancelled' && consultation.status !== 'completed' && (
                            <button
                              onClick={() => handleCancelConsultation(consultation.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <span className="hidden sm:inline">Cancel</span>
                              <span className="sm:hidden">X</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selectedConsultant && (
        <BookingModal
          isOpen={selectedConsultant !== null}
          onClose={() => setSelectedConsultant(null)}
          consultantId={selectedConsultant}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}