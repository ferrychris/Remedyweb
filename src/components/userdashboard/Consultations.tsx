// src/components/userdashboard/sections/Consultations.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import toast from 'react-hot-toast';
import { Clock, Calendar, CreditCard, User, Wallet, CheckCircle } from 'lucide-react';
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
  consultant?: {
    name: string;
    specialty: string;
  };
}

interface Consultant {
  id: string;
  name: string;
  specialty: string;
  bio?: string;
  hourly_rate?: number;
  rating?: number;
  status: string;
  availability_slots?: AvailabilitySlot[];
}

interface AvailabilitySlot {
  id: string;
  consultant_id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

export function Consultations() {
  const { user, profile } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [availableConsultants, setAvailableConsultants] = useState<Consultant[]>([]);
  const [newConsultation, setNewConsultation] = useState({
    consultant_id: '',
    scheduled_for: '',
    notes: '',
  });
  const [editingConsultation, setEditingConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingConsultants, setLoadingConsultants] = useState(true);
  
  // Modal state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState<string | null>(null);
  const [selectedConsultantName, setSelectedConsultantName] = useState<string>('');
  
  // Payment state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch user consultations
        const { data: consultationsData, error: consultationsError } = await supabase
          .from('consultations')
          .select('id, user_id, consultant_id, scheduled_for, status, notes, created_at, updated_at, consultant:consultants(name, specialty)')
          .eq('user_id', user.id)
          .order('scheduled_for', { ascending: false });

        if (consultationsError) throw consultationsError;
        setConsultations(consultationsData || []);

        // Fetch all available consultants
        const { data: consultantsData, error: consultantsError } = await supabase
          .from('consultants')
          .select('id, name, specialty, bio, hourly_rate, rating, status')
          .eq('status', 'active');

        if (consultantsError) throw consultantsError;
        setConsultants(consultantsData || []);
      } catch (error) {
        toast.error('Failed to load consultations');
        console.error('Consultations error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConsultantsWithAvailability();
    fetchData();
  }, [user]);

  const fetchConsultantsWithAvailability = async () => {
    if (!user) return;
    
    setLoadingConsultants(true);
    try {
      // Fetch consultants with their availability slots
      const { data, error } = await supabase
        .from('consultants')
        .select(`
          id, 
          name, 
          specialty, 
          bio, 
          hourly_rate, 
          rating,
          status,
          availability_slots(
            id, 
            start_time, 
            end_time, 
            is_booked
          )
        `)
        .eq('status', 'active');
      
      if (error) throw error;
      
      // Filter consultants to only include those with available slots
      const consultantsWithAvailability = data?.map(consultant => ({
        ...consultant,
        availability_slots: consultant.availability_slots.filter(
          slot => !slot.is_booked && new Date(slot.start_time) > new Date()
        )
      })).filter(consultant => consultant.availability_slots.length > 0);
      
      setAvailableConsultants(consultantsWithAvailability || []);
    } catch (error) {
      console.error('Error fetching consultants with availability:', error);
      toast.error('Failed to load available consultants');
    } finally {
      setLoadingConsultants(false);
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

      // Refresh consultations
      const { data, error: fetchError } = await supabase
        .from('consultations')
        .select('id, user_id, consultant_id, scheduled_for, status, notes, created_at, updated_at, consultant:consultants(name, specialty)')
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: false });

      if (fetchError) throw fetchError;
      setConsultations(data || []);
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
          consultation.id === consultationId ? { ...consultation, notes } : consultation
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
    // Find consultant price
    const consultant = availableConsultants.find(c => c.id === consultantId);
    if (consultant && consultant.hourly_rate) {
      // Calculate price based on slot duration
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
    
    // In a real application, you would integrate with a payment processor like Stripe
    // For demo purposes, we'll simulate a successful payment
    
    try {
      // Simulating payment processing delay
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // After successful payment, update the booking status
      toast.success('Payment successful! Your consultation is confirmed.');
      setShowPaymentForm(false);
      
      // Refresh consultations list
      fetchData();
      fetchConsultantsWithAvailability();
    } catch (error) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
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

  if (loading && loadingConsultants) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Consultations</h1>

      {/* Available Consultants */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Available Consultants</h2>
        
        {loadingConsultants ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : availableConsultants.length === 0 ? (
          <p className="text-gray-600">No consultants with availability found at this time.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableConsultants.map(consultant => (
              <div key={consultant.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="h-12 w-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white">
                        <User className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-800">Dr. {consultant.name}</h3>
                        <p className="text-sm text-gray-600">{consultant.specialty}</p>
                      </div>
                    </div>
                    {consultant.rating && (
                      <div className="bg-emerald-50 px-2 py-1 rounded text-emerald-700 text-sm font-medium">
                        ★ {consultant.rating}
                      </div>
                    )}
                  </div>
                  
                  {consultant.bio && (
                    <p className="mt-3 text-gray-600 text-sm">{consultant.bio}</p>
                  )}
                  
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Availability</h4>
                      <span className="text-xs text-emerald-600">{consultant.availability_slots?.length || 0} slots</span>
                    </div>
                    
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {consultant.availability_slots?.slice(0, 3).map(slot => (
                        <div key={slot.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{formatDateTime(slot.start_time)}</span>
                          </div>
                        </div>
                      ))}
                      {(consultant.availability_slots?.length || 0) > 3 && (
                        <div className="text-center text-xs text-emerald-600">
                          +{(consultant.availability_slots?.length || 0) - 3} more slots
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-5 flex justify-between items-center">
                    <div className="text-emerald-600 font-semibold">
                      ${consultant.hourly_rate}/hour
                    </div>
                    <button
                      onClick={() => openBookingModal(consultant.id, consultant.name)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
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
      <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Your Consultations</h2>
        {consultations.length === 0 ? (
          <p className="text-gray-600">No consultations scheduled.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consultant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {consultations.map((consultation) => (
                  <tr key={consultation.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {consultation.consultant?.name || 'Unknown'} ({consultation.consultant?.specialty || ''})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(consultation.scheduled_for).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingConsultation?.id === consultation.id ? (
                        <textarea
                          value={editingConsultation.notes || ''}
                          onChange={(e) =>
                            setEditingConsultation({ ...editingConsultation, notes: e.target.value })
                          }
                          className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          rows={2}
                        />
                      ) : (
                        consultation.notes || 'No notes'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingConsultation?.id === consultation.id ? (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleUpdateNotes(consultation.id, editingConsultation.notes || '')}
                            className="text-emerald-600 hover:text-emerald-900"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingConsultation(null)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setEditingConsultation(consultation)}
                            className="text-emerald-600 hover:text-emerald-900"
                          >
                            Edit Notes
                          </button>
                          {consultation.status !== 'cancelled' && consultation.status !== 'completed' && (
                            <button
                              onClick={() => handleCancelConsultation(consultation.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {isBookingModalOpen && selectedConsultant && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={closeBookingModal}
          consultantId={selectedConsultant}
          consultantName={selectedConsultantName}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {/* Payment Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Payment for Consultation</h2>
            <div className="mb-4">
              <p className="text-gray-700">Total Amount: <span className="font-bold text-emerald-600">${paymentAmount.toFixed(2)}</span></p>
            </div>
            
            <div className="mb-4">
              <div className="flex space-x-4 mb-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center border ${
                    paymentMethod === 'card' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                      : 'border-gray-300 text-gray-700'
                  }`}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Credit Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('wallet')}
                  className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center border ${
                    paymentMethod === 'wallet' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                      : 'border-gray-300 text-gray-700'
                  }`}
                >
                  <Wallet className="h-5 w-5 mr-2" />
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center"
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
                  <div className="bg-emerald-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">Your wallet balance: <span className="font-bold text-emerald-600">$500.00</span></p>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePayment}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center"
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
    </div>
  );
}