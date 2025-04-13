import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import toast from 'react-hot-toast';
import { Calendar, Clock, Plus, Trash2 } from 'lucide-react';

interface AvailabilitySlot {
    id?: string;
    consultant_id: string;
    start_time: string;
    end_time: string;
    is_booked: boolean;
}

export default function SetAvailability() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
    const [newSlot, setNewSlot] = useState({
        start_time: '',
        end_time: '',
        date: ''
    });

    useEffect(() => {
        if (user) {
            fetchAvailabilitySlots();
        }
    }, [user]);

    const fetchAvailabilitySlots = async () => {
        if (!user) {
            console.error('No user found');
            return;
        }
        
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('availability_slots')
                .select('*')
                .eq('consultant_id', user.id)
                .order('start_time', { ascending: true });

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            if (!data) {
                console.log('No availability slots found for user:', user.id);
                setSlots([]);
                return;
            }

            // Validate and transform the data
            const validSlots = data.filter(slot => 
                slot.start_time && 
                slot.end_time && 
                new Date(slot.start_time) < new Date(slot.end_time)
            );

            console.log('Fetched availability slots:', validSlots);
            setSlots(validSlots);
        } catch (error) {
            console.error('Error fetching availability slots:', error);
            toast.error('Failed to load availability slots. Please try again.');
            setSlots([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSlot = async () => {
        if (!user || !newSlot.date || !newSlot.start_time || !newSlot.end_time) {
            toast.error('Please fill in all fields');
            return;
        }

        const startDateTime = new Date(`${newSlot.date}T${newSlot.start_time}`);
        const endDateTime = new Date(`${newSlot.date}T${newSlot.end_time}`);

        if (endDateTime <= startDateTime) {
            toast.error('End time must be after start time');
            return;
        }

        try {
            const { error } = await supabase
                .from('availability_slots')
                .insert({
                    consultant_id: user.id,
                    start_time: startDateTime.toISOString(),
                    end_time: endDateTime.toISOString(),
                    is_booked: false
                });

            if (error) throw error;

            toast.success('Availability slot added successfully');
            setNewSlot({ start_time: '', end_time: '', date: '' });
            fetchAvailabilitySlots();
        } catch (error) {
            console.error('Error adding availability slot:', error);
            toast.error('Failed to add availability slot');
        }
    };

    const handleDeleteSlot = async (slotId: string) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('availability_slots')
                .delete()
                .eq('id', slotId)
                .eq('consultant_id', user.id);

            if (error) throw error;

            toast.success('Availability slot deleted successfully');
            fetchAvailabilitySlots();
        } catch (error) {
            console.error('Error deleting availability slot:', error);
            toast.error('Failed to delete availability slot');
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

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Set Your Availability</h1>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Add New Availability Slot</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                            type="date"
                            value={newSlot.date}
                            onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                        <input
                            type="time"
                            value={newSlot.start_time}
                            onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                        <input
                            type="time"
                            value={newSlot.end_time}
                            onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                </div>
                <button
                    onClick={handleAddSlot}
                    className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex items-center"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Slot
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Your Availability Slots</h2>
                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
                    </div>
                ) : slots.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-600">No availability slots set yet.</p>
                        <p className="text-gray-500 mt-2">Add your first availability slot above.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {slots.map((slot) => (
                            <div key={slot.id} className="border rounded-lg p-4 flex justify-between items-center">
                                <div className="flex items-center space-x-4">
                                    <Calendar className="h-5 w-5 text-emerald-600" />
                                    <div>
                                        <p className="font-medium text-gray-800">{formatDate(slot.start_time)}</p>
                                        <p className="text-sm text-gray-500">
                                            <Clock className="h-4 w-4 inline-block mr-1" />
                                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => slot.id && handleDeleteSlot(slot.id)}
                                    className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
} 