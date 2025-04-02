import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import toast from 'react-hot-toast';
import { X } from 'lucide-react'; // Icon for close button

// Interface for the props the modal receives
interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    consultantId: string;
    consultantName: string;
}

// Interface for a single availability slot (specific to this modal)
interface AvailabilitySlot {
    id: string;
    start_time: string;
    end_time: string;
}

function BookingModal({ isOpen, onClose, consultantId, consultantName }: BookingModalProps) {
    const { user } = useAuth();
    const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [bookingInProgress, setBookingInProgress] = useState<string | null>(null); // Track which slot ID is being booked
    const [error, setError] = useState<string | null>(null);

    // Fetch available slots for the specific consultant when the modal opens or consultantId changes
    const fetchConsultantSlots = useCallback(async () => {
        if (!isOpen || !consultantId) {
            setSlots([]); // Clear slots if modal is closed or no consultant ID
            return;
        }

        setLoadingSlots(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabase
                .from('availability_slots')
                .select('id, start_time, end_time')
                .eq('consultant_id', consultantId)
                .eq('is_booked', false)
                .gt('start_time', new Date().toISOString()) // Only future slots
                .order('start_time', { ascending: true });

            if (fetchError) throw fetchError;

            setSlots(data || []);
        } catch (err: any) {
            console.error("Error fetching consultant slots:", err);
            setError(err.message || "Failed to load availability.");
            toast.error("Failed to load available slots for this consultant.");
            setSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    }, [consultantId, isOpen]); // Re-fetch if consultantId changes while modal is technically open

    useEffect(() => {
        fetchConsultantSlots();
    }, [fetchConsultantSlots]); // Dependency array ensures fetch runs when function identity changes

    // Handle booking a slot
    const handleBookSlot = async (slotId: string, startTime: string) => {
        if (!user) {
            // This check is technically redundant if Dashboard prevents opening modal when logged out, but good practice
            toast.error("Please log in to book.");
            onClose(); // Close modal if somehow opened without user
            return;
        }

         // Confirmation before booking
         if (!window.confirm(`Confirm booking with ${consultantName} at ${formatDateTime(startTime)}?`)) {
             return;
         }

        setBookingInProgress(slotId);
        setError(null);

        try {
            // Attempt to update the slot (similar logic to before)
             const { error: updateError } = await supabase
                 .from('availability_slots')
                 .update({
                     is_booked: true,
                     booked_by_user_id: user.id
                 })
                 .eq('id', slotId)
                 .eq('is_booked', false); // Prevent race condition

            // If updateError is not null, the update failed.
            if (updateError) {
                 // Log the specific error for debugging
                 console.error("Supabase update error:", updateError);
                 // Provide a user-friendly message. It might be RLS or the slot was taken.
                 throw new Error("Failed to book the slot. It might have been taken, or there was a server issue.");
             }

            // Optional: Create record in separate 'consultations' table here if needed

            // If we reach here, updateError was null, indicating success
            toast.success(`Consultation booked with ${consultantName}!`);
            onClose(); // Close the modal after successful booking

        } catch (err: any) {
             // Catch errors from the update itself or the explicit throw above
            console.error("Error during booking process:", err);
            toast.error(err.message || "Could not book consultation. Please try again.");
            // Optionally refetch slots here to show updated availability if booking failed?
            // fetchConsultantSlots();
             setBookingInProgress(null); // Only clear booking state on error, success closes modal
        }
        // No finally block needed for bookingInProgress here, as success closes the modal
    };

    // Helper to format date/time
    const formatDateTime = (isoString: string) => {
        if (!isoString) return 'N/A';
        try {
            return new Date(isoString).toLocaleString(undefined, {
                month: 'short', day: 'numeric',
                hour: 'numeric', minute: '2-digit', hour12: true
            });
        } catch (e) { return 'Invalid Date'; }
    };
     const formatTime = (isoString: string) => {
         if (!isoString) return 'N/A';
         try {
             return new Date(isoString).toLocaleString(undefined, {
                 hour: 'numeric', minute: '2-digit', hour12: true
             });
         } catch (e) { return 'Invalid Time'; }
     };

    // Prevent rendering if modal is not open
    if (!isOpen) {
        return null;
    }

    // Basic Modal Structure (Replace with a proper modal library for accessibility)
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4 transition-opacity duration-300">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 relative transform transition-all duration-300 scale-100 opacity-100">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
                    aria-label="Close modal"
                >
                    <X size={24} />
                </button>

                <h2 className="text-xl font-semibold mb-4">Book with {consultantName}</h2>

                {loadingSlots && <p className="text-gray-600">Loading available slots...</p>}
                {error && <p className="text-red-600">Error: {error}</p>}

                {!loadingSlots && !error && slots.length === 0 && (
                    <p className="text-gray-600">No available slots found for {consultantName} at this time.</p>
                )}

                {!loadingSlots && !error && slots.length > 0 && (
                    <div>
                        <h3 className="text-md font-medium mb-2 text-gray-700">Select a time slot:</h3>
                        <ul className="space-y-2">
                            {slots.map((slot) => (
                                <li key={slot.id} className="flex justify-between items-center bg-gray-100 p-3 rounded-md">
                                    <span className="text-sm font-medium text-gray-800">
                                        {formatDateTime(slot.start_time)} - {formatTime(slot.end_time)}
                                    </span>
                                    <button
                                        onClick={() => handleBookSlot(slot.id, slot.start_time)}
                                        disabled={bookingInProgress === slot.id}
                                        className="ml-3 px-4 py-1.5 text-xs font-medium text-white bg-emerald-500 rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-wait"
                                    >
                                        {bookingInProgress === slot.id ? 'Booking...' : 'Book Now'}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Optional Footer with explicit close */}
                 <div className="mt-6 text-right">
                     <button
                         onClick={onClose}
                         className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                     >
                         Cancel
                     </button>
                 </div>
            </div>
        </div>
    );
}

export default BookingModal; 