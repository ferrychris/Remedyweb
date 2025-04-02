import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import toast from 'react-hot-toast';

// Define the structure of an availability slot based on your DB table
interface AvailabilitySlot {
    id: string; // Assuming uuid
    consultant_id: string; // Assuming uuid
    start_time: string; // ISO string format
    end_time: string; // ISO string format
    is_booked: boolean;
    booked_by_user_id: string | null;
    created_at: string;
}

// Define the structure for the form input
interface NewSlotForm {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
}

function ManageAvailability() {
    const { user } = useAuth();
    const [consultantId, setConsultantId] = useState<string | null>(null);
    const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newSlot, setNewSlot] = useState<NewSlotForm>({
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
    });

    // 1. Fetch Consultant ID based on logged-in user
    const fetchConsultantId = useCallback(async () => {
        if (!user) return;
        try {
            // IMPORTANT: Adjust 'user_id' if your linking column is different
            const { data, error } = await supabase
                .from('consultants') // Your consultants table
                .select('id')
                .eq('user_id', user.id) // This links consultants to auth users/user_profile
                .single();

            if (error) throw error;
            if (data) {
                setConsultantId(data.id);
            } else {
                setError("Could not find consultant profile for the logged-in user.");
                // Consider redirecting or showing a clearer message if not a consultant
            }
        } catch (err: any) {
            console.error("Error fetching consultant ID:", err);
            setError(err.message || "Failed to fetch consultant profile.");
            toast.error("Failed to load consultant data.");
        }
    }, [user]);

    // 2. Fetch Availability Slots for the consultant
    const fetchSlots = useCallback(async () => {
        if (!consultantId) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('availability_slots')
                .select('*')
                .eq('consultant_id', consultantId)
                .order('start_time', { ascending: true }); // Show oldest first

            if (error) throw error;
            setSlots(data || []);
        } catch (err: any) {
            console.error("Error fetching slots:", err);
            setError(err.message || "Failed to fetch availability slots.");
            toast.error("Failed to load availability slots.");
        } finally {
            setLoading(false);
        }
    }, [consultantId]);

    // Fetch consultant ID when user loads, then fetch slots when consultant ID is known
    useEffect(() => {
        fetchConsultantId();
    }, [fetchConsultantId]);

    useEffect(() => {
        if (consultantId) {
            fetchSlots();
        }
    }, [consultantId, fetchSlots]);


    // 3. Handle Form Input Change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewSlot(prev => ({ ...prev, [name]: value }));
    };

    // 4. Handle Form Submission (Add Slot)
    const handleAddSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!consultantId) {
            toast.error("Consultant ID not found.");
            return;
        }

        // Combine date and time, ensuring valid ISO strings
        try {
            const startDateTime = new Date(`${newSlot.startDate}T${newSlot.startTime}`);
            const endDateTime = new Date(`${newSlot.endDate}T${newSlot.endTime}`);

            // Basic validation - enhance this with date-fns or moment.js
            if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
                 toast.error("Invalid date or time format. Use YYYY-MM-DD and HH:MM.");
                 return;
            }

            if (endDateTime <= startDateTime) {
                toast.error("End time must be after start time.");
                return;
            }

             if (startDateTime < new Date()) {
                 toast.error("Cannot add slots in the past.");
                 return;
             }

            setLoading(true); // Indicate processing
            const { error: insertError } = await supabase
                .from('availability_slots')
                .insert({
                    consultant_id: consultantId,
                    start_time: startDateTime.toISOString(),
                    end_time: endDateTime.toISOString(),
                    // is_booked defaults to false in DB
                });

            if (insertError) throw insertError;

            toast.success("Availability slot added!");
            setNewSlot({ startDate: '', startTime: '', endDate: '', endTime: '' }); // Reset form
            fetchSlots(); // Refresh the list
        } catch (err: any) {
            console.error("Error adding slot:", err);
            // Check for specific Supabase errors (e.g., RLS violation)
            if (err.message?.includes('check constraint')) {
                 toast.error("End time must be after start time.");
             } else if (err.message?.includes('timestamp')) {
                 toast.error("Invalid date/time format provided.");
             } else {
                 toast.error(err.message || "Failed to add slot.");
             }
             setLoading(false); // Ensure loading stops on error
        }
        // No finally block for setLoading here, fetchSlots handles its own
    };

    // 5. Handle Slot Deletion
    const handleDeleteSlot = async (slotId: string) => {
        if (!window.confirm("Are you sure you want to delete this slot? This cannot be undone.")) {
            return;
        }

        const slotToDelete = slots.find(s => s.id === slotId);
        if (!slotToDelete) return; // Should not happen

        // Add checks: Only allow deleting future, non-booked slots
        if (slotToDelete.is_booked) {
            toast.error("Cannot delete a booked slot.");
            return;
        }
         if (new Date(slotToDelete.start_time) < new Date()) {
             toast.error("Cannot delete a past slot.");
             return;
         }

        try {
            setLoading(true);
            const { error: deleteError } = await supabase
                .from('availability_slots')
                .delete()
                .eq('id', slotId)
                 // Add extra safety checks if needed (e.g., ensure it matches consultant_id)
                 .eq('consultant_id', consultantId)
                 .eq('is_booked', false); // Double check it's not booked

            if (deleteError) throw deleteError;

            toast.success("Slot deleted.");
            fetchSlots(); // Refresh list
        } catch (err: any) {
            console.error("Error deleting slot:", err);
            toast.error(err.message || "Failed to delete slot.");
            setLoading(false);
        }
    };

    // Helper to format date/time
    const formatDateTime = (isoString: string) => {
        if (!isoString) return 'N/A';
        try {
            // Use locale-sensitive formatting
            return new Date(isoString).toLocaleString(undefined, {
                 year: 'numeric', month: 'short', day: 'numeric',
                 hour: 'numeric', minute: '2-digit', hour12: true
             });
        } catch (e) {
            console.error("Error formatting date:", e);
            return 'Invalid Date';
        }
    };


    if (!user) {
        // Optionally redirect to login or show a clearer message
        return <p className="text-center text-red-600 p-4">Please log in to manage availability.</p>;
    }

    // If still loading consultant ID after initial check
    if (consultantId === null && error === null && loading) {
        return <p className="text-center p-4">Loading consultant data...</p>;
    }

     // If consultant ID check finished but resulted in an error (e.g., user not a consultant)
     if (consultantId === null && error) {
         return <p className="text-center text-red-600 p-4">Error: {error}</p>;
     }

     // If user is logged in but not linked to a consultant profile
     if (consultantId === null && !loading && !error) {
          return <p className="text-center text-orange-600 p-4">Consultant profile not found. Only registered consultants can manage availability.</p>;
     }


    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Manage Your Availability</h1>

            {/* Add New Slot Form */}
            <form onSubmit={handleAddSlot} className="mb-8 p-6 border rounded-lg shadow-md bg-white">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Add New Slot</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Start Date/Time */}
                    <div className="col-span-1">
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                        <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={newSlot.startDate}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div className="col-span-1">
                        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Start Time</label>
                        <input
                            type="time"
                            id="startTime"
                            name="startTime"
                            value={newSlot.startTime}
                            onChange={handleInputChange}
                            required
                            step="1800" /* 30 minutes step */
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>

                     {/* End Date/Time */}
                     <div className="col-span-1">
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
                        <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            value={newSlot.endDate}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div className="col-span-1">
                        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">End Time</label>
                        <input
                            type="time"
                            id="endTime"
                            name="endTime"
                            value={newSlot.endTime}
                            onChange={handleInputChange}
                            required
                            step="1800" /* 30 minutes step */
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={loading || !consultantId}
                    className="mt-5 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading && !slots.length ? 'Adding...' : 'Add Slot'}
                </button>
                 {!consultantId && !loading && <p className="text-red-500 text-sm mt-2">Cannot add slots: Consultant profile not loaded.</p>}
            </form>

            {/* List Existing Slots */}
            <div className="bg-white p-6 border rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Your Current Slots</h2>
                 {loading && slots.length === 0 && <p className="text-gray-500">Loading slots...</p>}
                 {error && !loading && <p className="text-red-600">Error loading slots: {error}</p>}
                 {!loading && !error && slots.length === 0 && consultantId && (
                     <p className="text-gray-500">You haven't added any availability slots yet.</p>
                 )}
                {slots.length > 0 && (
                    <ul className="space-y-3">
                        {slots.map((slot) => (
                            <li key={slot.id} className={`p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center ${slot.is_booked ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}>
                                <div>
                                    <p className="font-medium text-gray-800">
                                        {formatDateTime(slot.start_time)} - {formatDateTime(slot.end_time)}
                                    </p>
                                    <p className={`text-sm font-medium mt-1 ${slot.is_booked ? 'text-orange-600' : 'text-green-600'}`}>
                                        Status: {slot.is_booked ? `Booked` : 'Available'}
                                    </p>
                                    {slot.is_booked && slot.booked_by_user_id && (
                                        <p className="text-xs text-gray-500 mt-1">Booked by User ID: {slot.booked_by_user_id}</p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">Created: {formatDateTime(slot.created_at)}</p>
                                </div>
                                <div className="mt-3 sm:mt-0 sm:ml-4 flex-shrink-0">
                                    {!slot.is_booked && new Date(slot.start_time) > new Date() && ( // Only allow deleting future, unbooked slots
                                        <button
                                            onClick={() => handleDeleteSlot(slot.id)}
                                            disabled={loading}
                                            className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label={`Delete slot from ${formatDateTime(slot.start_time)}`}
                                        >
                                            Delete
                                        </button>
                                     )}
                                     {slot.is_booked && <span className="text-sm text-gray-500 px-2 py-1 rounded bg-gray-200">Booked</span>}
                                     {!slot.is_booked && new Date(slot.start_time) <= new Date() && <span className="text-sm text-gray-500 px-2 py-1 rounded bg-yellow-100 text-yellow-700">Past</span>}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
             </div>
        </div>
    );
}

export default ManageAvailability; 