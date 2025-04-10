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

      const { data: consultationsData, error: consultationsError } = await supabase
        .from('consultations')
        .select('*, consultant:consultants(*)')
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: false });

      if (consultationsError) throw consultationsError;
      
<<<<<<< HEAD
      const processedConsultations = (consultationsData || []).map(consultation => {
        let consultantData: ConsultantData | undefined = undefined;
        
        if (consultation.consultant) {
          if (typeof consultation.consultant === 'object' && 
              !Array.isArray(consultation.consultant) && 
              'name' in consultation.consultant && 
              'specialty' in consultation.consultant) {
            const typedConsultant = consultation.consultant as { name: any; specialty: any };
=======
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
            
>>>>>>> 70fa9a48920bff527ba1f6fbe46ba9ac11b6d780
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
<<<<<<< HEAD
          } else if (Array.isArray(consultation.consultant) && consultation.consultant.length > 0) {
            const firstItem = consultation.consultant[0] as { name: any; specialty: any } | null;
            if (firstItem && typeof firstItem === 'object' && 'name' in firstItem && 'specialty' in firstItem) {
              consultantData = {
                name: String(firstItem.name || ''),
                specialty: String(firstItem.specialty || '')
              };
            }
=======
>>>>>>> 70fa9a48920bff527ba1f6fbe46ba9ac11b6d780
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

<<<<<<< HEAD
  // Updated fetchConsultantsWithAvailability function with enhanced logging and error handling
  const fetchConsultantsWithAvailability = async () => {
    if (!user) return;
    
    setLoadingConsultants(true);
    try {
      console.log('Fetching consultants with availability...');
      
      // Fetch consultants where status is 'active'
      const { data: consultantsData, error: consultantsError } = await supabase
        .from('consultants')
        .select('id, name, specialty, bio, hourly_rate, rating, is_active, status')
        .eq('status', 'active');
      
      if (consultantsError) {
        console.error('Error fetching consultants:', consultantsError);
        throw consultantsError;
      }
      
      console.log('Raw consultants data:', consultantsData);
      
      const activeConsultants = consultantsData || [];
      
      if (activeConsultants.length === 0) {
        console.log('No active consultants found');
        setAvailableConsultants([]);
        setConsultants([]);
        setLoadingConsultants(false);
        return;
      }
      
      console.log(`Found ${activeConsultants.length} active consultants:`, activeConsultants.map(c => c.name));
      setConsultants(activeConsultants);
      
      // Fetch availability slots for each consultant
      const consultantsWithSlots = await Promise.all(
        activeConsultants.map(async (consultant) => {
          console.log(`Fetching slots for consultant ${consultant.id} (${consultant.name})`);
          
          const { data: slotsData, error: slotsError } = await supabase
            .from('availability_slots')
            .select('id, consultant_id, start_time, end_time, is_booked')
            .eq('consultant_id', consultant.id)
            .eq('is_booked', false)
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true });
          
          if (slotsError) {
            console.error(`Error fetching slots for consultant ${consultant.id} (${consultant.name}):`, slotsError);
            return {
              ...consultant,
              availability_slots: []
            };
          }
          
          console.log(`Found ${slotsData?.length || 0} slots for consultant ${consultant.id} (${consultant.name}):`, slotsData);
          
          return {
            ...consultant,
            availability_slots: slotsData || []
          };
        })
      );
      
      // Log the final consultants with their slots
      console.log(`Setting ${consultantsWithSlots.length} active consultants as available:`, 
        consultantsWithSlots.map(c => ({
          name: c.name,
          slotCount: c.availability_slots?.length || 0
        }))
      );
      setAvailableConsultants(consultantsWithSlots);
    } catch (error) {
      console.error('Error fetching consultants with availability:', error);
      toast.error('Failed to load available consultants');
    } finally {
      setLoadingConsultants(false);
    }
  };

  // Optional: Function to seed availability slots (for development purposes)
  const seedAvailabilitySlots = async (consultantId: string, consultantName: string) => {
    try {
      console.log(`Seeding availability slot for consultant ${consultantName} (${consultantId})`);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1); // Tomorrow's date
      tomorrow.setHours(10, 0, 0, 0); // 10:00 AM
      
      const endTime = new Date(tomorrow);
      endTime.setHours(11, 0, 0, 0); // 11:00 AM
      
      const { error } = await supabase
        .from('availability_slots')
        .insert({
          consultant_id: consultantId,
          start_time: tomorrow.toISOString(),
          end_time: endTime.toISOString(),
          is_booked: false
        });
      
      if (error) {
        console.error(`Error seeding slot for consultant ${consultantName}:`, error);
        throw error;
      }
      
      console.log(`Successfully seeded slot for consultant ${consultantName}`);
    } catch (error) {
      console.error('Error seeding availability slots:', error);
    }
  };

  // Optional: Call this function to seed slots if none exist (can be removed after initial setup)
  const initializeAvailabilitySlots = async (activeConsultants: Consultant[]) => {
    const { data: existingSlots } = await supabase
      .from('availability_slots')
      .select('consultant_id')
      .in('consultant_id', activeConsultants.map(c => c.id));
    
    const consultantsWithSlots = new Set(existingSlots?.map(slot => slot.consultant_id));
    
    for (const consultant of activeConsultants) {
      if (!consultantsWithSlots.has(consultant.id)) {
        await seedAvailabilitySlots(consultant.id, consultant.name);
      }
    }
  };

  const handleScheduleConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from('consultations').insert({
        user_id: user.id,
        consultant_id: newConsultation.consultant_id,
        scheduled_for: newConsultation.scheduled_for,
        status: 'pending',
        notes: newConsultation.notes,
      });

      if (error) throw error;
      toast.success('Consultation scheduled successfully');
      setNewConsultation({ consultant_id: '', scheduled_for: '', notes: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to schedule consultation');
      console.error('Schedule consultation error:', error);
    }
  };

  const handleUpdateNotes = async (consultationId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('consultations')
        .update({ notes })
        .eq('id', consultationId);

      if (error) throw error;
      toast.success('Notes updated successfully');
      setConsultations(
        consultations.map((consultation) =>
          consultation.id === consultationId ? { ...consultant, notes } : consultation
        )
      );
      setEditingConsultation(null);
    } catch (error) {
      toast.error('Failed to update notes');
      console.error('Update notes error:', error);
    }
  };

  const handleCancelConsultation = async (consultationId: string) => {
    try {
      const { error } = await supabase
        .from('consultations')
        .update({ status: 'cancelled' })
        .eq('id', consultationId);

      if (error) throw error;
      toast.success('Consultation cancelled successfully');
      setConsultations(
        consultations.map((consultation) =>
          consultation.id === consultationId ? { ...consultation, status: 'cancelled' } : consultation
        )
      );
    } catch (error) {
      toast.error('Failed to cancel consultation');
      console.error('Cancel consultation error:', error);
    }
  };

  const openBookingModal = (consultantId: string, consultantName: string) => {
    setSelectedConsultant(consultantId);
    setSelectedConsultantName(consultantName);
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedConsultant(null);
  };

  const handleBookingSuccess = (slot: AvailabilitySlot, consultantId: string) => {
    const consultant = availableConsultants.find(c => c.id === consultantId);
    if (consultant && consultant.hourly_rate) {
      const startTime = new Date(slot.start_time);
      const endTime = new Date(slot.end_time);
      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      const totalPrice = consultant.hourly_rate * durationHours;
      
      setPaymentAmount(totalPrice);
      setShowPaymentForm(true);
    } else {
      toast.error('Could not determine consultation price');
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Payment successful! Your consultation is confirmed.');
      setShowPaymentForm(false);
      
      fetchData();
      fetchConsultantsWithAvailability();
    } catch (error) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
=======
  const handleScheduleConsultation = async () => {
    // Implementation goes here
    // This function is declared but not used in the current code
>>>>>>> 70fa9a48920bff527ba1f6fbe46ba9ac11b6d780
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
            <p className="text-gray-600">No active consultants found at this time.</p>
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
                    
<<<<<<< HEAD
                    {consultant.availability_slots && consultant.availability_slots.length > 0 ? (
                      <div className="space-y-1 sm:space-y-2 max-h-24 sm:max-h-32 overflow-y-auto">
                        {consultant.availability_slots.slice(0, 3).map(slot => (
                          <div key={slot.id} className="flex items-center justify-between bg-gray-50 px-2 sm:px-3 py-1 sm:py-2 rounded-md">
                            <div className="flex items-center text-xs sm:text-sm text-gray-600">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              <span className="truncate max-w-[180px]">{formatDateTime(slot.start_time)}</span>
                            </div>
                          </div>
                        ))}
                        {consultant.availability_slots.length > 3 && (
                          <div className="text-center text-xs text-emerald-600">
                            +{(consultant.availability_slots.length - 3)} more slots
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-gray-500">No available slots at this time.</p>
                    )}
=======
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
>>>>>>> 70fa9a48920bff527ba1f6fbe46ba9ac11b6d780
                  </div>
                  
                  <div className="mt-4 sm:mt-5 flex justify-between items-center">
                    <div className="text-emerald-600 font-semibold text-sm sm:text-base">
<<<<<<< HEAD
                      ${consultant.hourly_rate || 0}/hour
                    </div>
                    <button
                      onClick={() => openBookingModal(consultant.id, consultant.name)}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm rounded-md transition-colors ${
                        consultant.availability_slots && consultant.availability_slots.length > 0
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!(consultant.availability_slots && consultant.availability_slots.length > 0)}
=======
                      ${consultant.specialty === 'Psychologist' ? '50' : '30'}/hour
                    </div>
                    <button
                      onClick={() => setSelectedConsultant(consultant.id)}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
>>>>>>> 70fa9a48920bff527ba1f6fbe46ba9ac11b6d780
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
<<<<<<< HEAD
      {isBookingModalOpen && selectedConsultant && (
=======
      {selectedConsultant && (
>>>>>>> 70fa9a48920bff527ba1f6fbe46ba9ac11b6d780
        <BookingModal
          isOpen={selectedConsultant !== null}
          onClose={() => setSelectedConsultant(null)}
          consultantId={selectedConsultant}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
<<<<<<< HEAD

      {/* Payment Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-lg w-full max-w-md p-4 sm:p-6 mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">Payment for Consultation</h2>
              <button 
                onClick={() => setShowPaymentForm(false)} 
                className="text-gray-400 hover:text-gray-600 sm:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-gray-700">Total Amount: <span className="font-bold text-emerald-600">${paymentAmount.toFixed(2)}</span></p>
            </div>
            
            <div className="mb-4">
              <div className="flex space-x-2 sm:space-x-4 mb-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 py-2 px-2 sm:px-3 rounded-md flex items-center justify-center border text-sm ${
                    paymentMethod === 'card' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                      : 'border-gray-300 text-gray-700'
                  }`}
                >
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  Credit Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('wallet')}
                  className={`flex-1 py-2 px-2 sm:px-3 rounded-md flex items-center justify-center border text-sm ${
                    paymentMethod === 'wallet' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                      : 'border-gray-300 text-gray-700'
                  }`}
                >
                  <Wallet className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  Wallet
                </button>
              </div>
              
              {paymentMethod === 'card' ? (
                <form onSubmit={handlePayment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardDetails.cardNumber}
                      onChange={(e) => setCardDetails({...cardDetails, cardNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardDetails.expiryDate}
                        onChange={(e) => setCardDetails({...cardDetails, expiryDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                      <input
                        type="text"
                        placeholder="123"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name on Card</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={cardDetails.name}
                      onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex items-center text-sm"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Pay ${paymentAmount.toFixed(2)}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="bg-emerald-50 p-4 rounded-md">
                    <p className="text-sm text-gray-700">Your wallet balance: <span className="font-bold text-emerald-600">$500.00</span></p>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePayment}
                      className="px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex items-center text-sm"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Wallet className="h-4 w-4 mr-2" />
                          Pay from Wallet
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
=======
>>>>>>> 70fa9a48920bff527ba1f6fbe46ba9ac11b6d780
    </div>
  );
}