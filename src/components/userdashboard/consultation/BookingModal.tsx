import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import toast from 'react-hot-toast';
import { X, Calendar, Clock, CheckCircle } from 'lucide-react'; // Icons for close button and other elements

// Updated interface for BookingModal props
interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    consultantId: string;
    consultantName?: string;
    onBookingSuccess?: (slot: AvailabilitySlot, consultantId: string) => void;
}

// Interface for a single availability slot (specific to this modal)
interface AvailabilitySlot {
    id: string;
    consultant_id: string;
    start_time: string;
    end_time: string;
    is_booked: boolean;
}

export default function BookingModal({
    isOpen,
    onClose,
    consultantId,
    consultantName = "",
    onBookingSuccess
}: BookingModalProps) {
    const { user } = useAuth();
    const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [groupedSlots, setGroupedSlots] = useState<Record<string, AvailabilitySlot[]>>({});
    const [consultantData, setConsultantData] = useState<{name: string, specialty: string} | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch consultant details if consultantName is not provided
    useEffect(() => {
        if (isOpen && consultantId && !consultantName) {
            fetchConsultantDetails();
        }
    }, [isOpen, consultantId, consultantName]);

    const fetchConsultantDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('consultants')
                .select('name, specialty')
                .eq('id', consultantId)
                .single();

            if (error) throw error;
            
            if (data) {
                setConsultantData({
                    name: `${data.name}`,
                    specialty: data.specialty
                });
            }
        } catch (error) {
            console.error('Error fetching consultant details:', error);
        }
    };

    const fetchAvailabilitySlots = useCallback(async () => {
        if (!consultantId) return;

        setLoading(true);
        setError(null);
        try {
            // First check if consultant is available
            const { data: consultantData, error: consultantError } = await supabase
                .from('consultants')
                .select('is_available')
                .eq('id', consultantId)
                .single();

            if (consultantError) throw consultantError;

            if (!consultantData?.is_available) {
                setError('Consultant is currently not available for bookings');
                setAvailabilitySlots([]);
                setLoading(false);
                return;
            }

            // Then fetch available slots
            const { data: slotsData, error: slotsError } = await supabase
                .from('availability_slots')
                .select('*')
                .eq('consultant_id', consultantId)
                .eq('is_booked', false)
                .gt('start_time', new Date().toISOString())
                .order('start_time', { ascending: true });

            if (slotsError) throw slotsError;

            if (!slotsData || slotsData.length === 0) {
                setError('No available slots found for this consultant');
                setAvailabilitySlots([]);
                setLoading(false);
                return;
            }

            setAvailabilitySlots(slotsData);
            
            // Group slots by date
            const grouped: Record<string, AvailabilitySlot[]> = {};
            slotsData.forEach(slot => {
                const date = new Date(slot.start_time).toLocaleDateString();
                if (!grouped[date]) {
                    grouped[date] = [];
                }
                grouped[date].push(slot);
            });
            
            setGroupedSlots(grouped);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch availability slots');
            setAvailabilitySlots([]);
        } finally {
            setLoading(false);
        }
    }, [consultantId]);

    useEffect(() => {
        if (isOpen && consultantId) {
            fetchAvailabilitySlots();
        }
    }, [isOpen, consultantId, fetchAvailabilitySlots]);

    const handleBookSlot = async () => {
        if (!selectedSlot || !user) return;
        
        try {
            // Confirm booking
            const isConfirmed = window.confirm(
                `Are you sure you want to book this appointment with ${consultantName || consultantData?.name || 'the consultant'}?`
            );
            
            if (!isConfirmed) return;
            
            const selectedSlotData = availabilitySlots.find(slot => slot.id === selectedSlot);
            
            if (!selectedSlotData) {
                toast.error('Selected slot not found');
                return;
            }
            
            // Book the consultation
            const { error } = await supabase
                .from('consultations')
                .insert({
                    user_id: user.id,
                    consultant_id: consultantId,
                    scheduled_for: selectedSlotData.start_time,
                    status: 'pending',
                    notes: ''
                });
                
            if (error) throw error;
            
            // Mark the slot as booked
            const { error: slotError } = await supabase
                .from('availability_slots')
                .update({ is_booked: true })
                .eq('id', selectedSlot);
                
            if (slotError) throw slotError;
            
            toast.success('Appointment booked successfully!');
            
            // Call the onBookingSuccess callback if provided
            if (onBookingSuccess) {
                onBookingSuccess(selectedSlotData, consultantId);
            }
            
            onClose();
        } catch (error) {
            console.error('Error booking slot:', error);
            toast.error('Failed to book appointment');
        }
    };

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const formatTime = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            hour: 'numeric',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleTimeString(undefined, options);
    };

    // Prevent rendering if modal is not open
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[80vh] overflow-auto">
                <div className="sticky top-0 bg-white z-10 p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Book Appointment with {consultantName || consultantData?.name || 'the consultant'}</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <div className="p-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <p className="text-red-600">{error}</p>
                            <p className="text-gray-500 mt-2">Please check back later or select another consultant.</p>
                        </div>
                    ) : Object.keys(groupedSlots).length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-600">No available slots found for {consultantName || consultantData?.name || 'the consultant'}.</p>
                            <p className="text-gray-500 mt-2">Please check back later or select another consultant.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedSlots).map(([date, slots]) => (
                                <div key={date} className="border rounded-lg overflow-hidden">
                                    <div className="bg-emerald-50 px-4 py-3 border-b">
                                        <div className="flex items-center text-emerald-800">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            <h3 className="font-medium">{formatDate(slots[0].start_time)}</h3>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 grid grid-cols-2 gap-3">
                                        {slots.map(slot => (
                                            <button
                                                key={slot.id}
                                                onClick={() => setSelectedSlot(slot.id)}
                                                className={`flex flex-col items-center justify-center p-3 rounded-lg border ${
                                                    selectedSlot === slot.id
                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                                        : 'border-gray-200 hover:border-emerald-200 hover:bg-emerald-50'
                                                }`}
                                            >
                                                <Clock className="h-4 w-4 mb-1" />
                                                <span className="text-sm">
                                                    {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                                </span>
                                                {selectedSlot === slot.id && (
                                                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-1" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="sticky bottom-0 bg-white p-4 border-t flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 mr-2 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleBookSlot}
                        disabled={!selectedSlot || loading}
                        className={`px-4 py-2 rounded-lg text-white ${
                            !selectedSlot || loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                    >
                        Book Appointment
                    </button>
                </div>
            </div>
        </div>
    );
} 