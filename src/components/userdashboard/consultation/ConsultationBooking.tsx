import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Consultant } from '../../../types';

// Re-use or refine the AvailabilitySlot interface
interface SlotData {
    id: string;
    start_time: string;
    end_time: string;
}

// Define our own interface without extending from types.ts
interface ConsultantWithSlots {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    bio?: string;
    specialty: string;
    status: 'active' | 'inactive';
    is_active: boolean;
    availability_slots: SlotData[];
}

function ConsultationBooking() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [consultants, setConsultants] = useState<ConsultantWithSlots[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookingInProgress, setBookingInProgress] = useState<string | null>(null); // Store ID of slot being booked
    const [error, setError] = useState<string | null>(null);
    const [selectedConsultant, setSelectedConsultant] = useState<string | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [bookingLoading, setBookingLoading] = useState(false);

    // Fetch consultants and their available (future, non-booked) slots
    const fetchAvailableConsultants = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // First fetch all active and available consultants
            const { data: consultantsData, error: consultantsError } = await supabase
                .from('consultants')
                .select('*')
                .eq('is_active', true)
                .eq('status', 'active')
                .eq('is_available', true);  // Add check for is_available

            if (consultantsError) throw consultantsError;

            if (!consultantsData || consultantsData.length === 0) {
                setConsultants([]);
                console.log('No available consultants found');
                setLoading(false);
                return;
            }

            // Then fetch available slots for these consultants
            const { data: availableSlots, error: slotsError } = await supabase
                .from('availability_slots')
                .select(`
                    *,
                    consultants!inner(*)
                `)
                .eq('is_booked', false)
                .gt('start_time', new Date().toISOString())
                .order('start_time', { ascending: true });

            if (slotsError) throw slotsError;

            if (!availableSlots || availableSlots.length === 0) {
                setConsultants([]);
                console.log('No available slots found');
                setLoading(false);
                return;
            }

            // Process the data to group slots by consultant
            const consultantsMap = new Map<string, ConsultantWithSlots>();

            availableSlots.forEach(slot => {
                // Check if consultants data exists and is an array with at least one element
                const consultantData = slot.consultants as Consultant; 
                if (!consultantData || !consultantData.id) {
                    console.warn(`Skipping slot ${slot.id} due to missing or invalid consultant data.`);
                    return; // Skip this slot if consultant data is bad
                }

                const slotData: SlotData = {
                    id: slot.id,
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                };

                if (consultantsMap.has(consultantData.id)) {
                    // Add slot to existing consultant entry
                    consultantsMap.get(consultantData.id)?.availability_slots.push(slotData);
                } else {
                    // Create new consultant entry
                    consultantsMap.set(consultantData.id, {
                        ...consultantData, // Spread consultant details (id, name, specialty, bio)
                        availability_slots: [slotData], // Start array with current slot
                    });
                }
            });

            // Convert Map values to array
            setConsultants(Array.from(consultantsMap.values()));
        } catch (error: any) {
            console.error('Error fetching consultants:', error);
            toast.error(error.message || 'Failed to load consultants');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAvailableConsultants();
    }, [fetchAvailableConsultants]);

    // Handle booking a specific slot
    const handleBookSlot = async (slotId: string, consultantName: string, startTime: string) => {
        if (!user) {
            toast.error("Please log in to book a consultation.");
            navigate('/login'); // Redirect to login if not authenticated
            return;
        }

        if (!window.confirm(`Book consultation with ${consultantName} at ${formatDateTime(startTime)}?`)) {
             return;
         }

        setBookingInProgress(slotId); // Mark this slot as being processed
        setError(null);

        try {
            // Attempt to update the slot: set is_booked=true and booked_by_user_id=currentUser.id
            // RLS policy should ensure only non-booked slots can be updated by authenticated users.
            const { error: updateError } = await supabase
                .from('availability_slots')
                .update({
                    is_booked: true,
                    booked_by_user_id: user.id
                })
                .eq('id', slotId)
                .eq('is_booked', false); // Crucial: only update if still available (prevents race conditions)

            if (updateError) {
                 // Check if the error indicates the slot was already booked (e.g., RLS violation or no rows updated)
                 // Supabase might not return a specific error code for this, might need to check affected rows if possible
                 // or rely on a subsequent fetch showing the slot is gone.
                 // For now, assume any update error means booking failed.
                 console.error("Booking update error:", updateError);
                 throw new Error("Failed to book the slot. It might have been taken already. Please refresh.");
             }


            // --- Optional: Create a record in a separate 'consultations' table ---
            // If you have a dedicated `consultations` table to track appointment details
            // (status, notes, meeting link etc.), create a record here.
            /*
            const { error: consultationInsertError } = await supabase
                .from('consultations') // Your consultations table name
                .insert({
                    patient_id: user.id,
                    consultant_id: consultants.find(c => c.availability_slots.some(s => s.id === slotId))?.id, // Find consultant ID
                    availability_slot_id: slotId, // Link to the booked slot
                    scheduled_time: startTime, // Or derive from slot
                    status: 'confirmed', // Initial status
                    // Add any other relevant fields
                });

            if (consultationInsertError) {
                // Handle potential failure to create consultation record
                // Maybe attempt to 'unbook' the slot? Complex recovery logic needed.
                console.error("Error creating consultation record:", consultationInsertError);
                toast.error("Slot booked, but failed to create consultation record. Please contact support.");
                 // Proceed cautiously, the slot is booked but the tracking record failed.
            }
            */
            // --- End Optional Section ---


            toast.success(`Consultation with ${consultantName} booked successfully!`);

            // Refresh the list to remove the booked slot
            fetchAvailableConsultants();

        } catch (err: any) {
            console.error("Error booking slot:", err);
            toast.error(err.message || "Failed to book the slot.");
        } finally {
            setBookingInProgress(null); // Clear processing state regardless of outcome
        }
    };

     // Helper to format date/time (Consider moving to a shared utils file)
     const formatDateTime = (isoString: string) => {
         if (!isoString) return 'N/A';
         try {
             return new Date(isoString).toLocaleString(undefined, {
                  year: 'numeric', month: 'short', day: 'numeric',
                  hour: 'numeric', minute: '2-digit', hour12: true
              });
         } catch (e) {
             return 'Invalid Date';
         }
     };

    // Render Logic
    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Book a Consultation</h1>

            {loading && <p className="text-center text-gray-500">Loading available consultants...</p>}
            {error && <p className="text-center text-red-600 p-4">Error: {error}</p>}

            {!loading && !error && consultants.length === 0 && (
                <p className="text-center text-gray-600">No available consultation slots found at this time.</p>
            )}

            {!loading && !error && consultants.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {consultants.map((consultant) => (
                        <div key={consultant.id} className="bg-white border rounded-lg shadow-md p-5">
                            <h2 className="text-xl font-semibold text-gray-800">{consultant.name}</h2>
                            {consultant.specialty && <p className="text-sm text-indigo-600 mb-1">{consultant.specialty}</p>}
                            {consultant.bio && <p className="text-sm text-gray-600 mb-3 line-clamp-3">{consultant.bio}</p>}

                            <h3 className="text-md font-semibold text-gray-700 mt-4 mb-2 border-t pt-3">Available Slots:</h3>
                            {consultant.availability_slots.length > 0 ? (
                                <ul className="space-y-2 max-h-60 overflow-y-auto">
                                    {consultant.availability_slots.map((slot) => (
                                        <li key={slot.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                            <span className="text-sm text-gray-700">
                                                {formatDateTime(slot.start_time)} - {formatDateTime(slot.end_time).split(', ')[1]} {/* Show only end time */}
                                            </span>
                                            <button
                                                onClick={() => handleBookSlot(slot.id, consultant.name, slot.start_time)}
                                                disabled={bookingInProgress === slot.id || !user}
                                                className="ml-2 px-3 py-1 text-xs font-medium text-white bg-emerald-500 rounded hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                 {bookingInProgress === slot.id ? 'Booking...' : 'Book'}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                /* This case shouldn't happen with the current query logic, but good fallback */
                                <p className="text-sm text-gray-500">No available slots for this consultant.</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ConsultationBooking; 