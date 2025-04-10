import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; // Adjust the path to your Supabase client
import { useAuth } from '../../lib/auth'; // Adjust the path to your auth hook
import toast from 'react-hot-toast';
import { Clock, Plus, X, Calendar } from 'lucide-react';

interface AvailabilitySlot {
  id: string; // Changed to string since Supabase uses UUIDs
  day: string;
  startTime: string;
  endTime: string;
}

interface NewSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface Consultant {
  id: string;
  status: string;
}

function AvailabilityManager(): JSX.Element {
  const { user } = useAuth(); // Get the logged-in user
  const [consultant, setConsultant] = useState<Consultant | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [showCreateSlotForm, setShowCreateSlotForm] = useState<boolean>(false);
  const [newSlot, setNewSlot] = useState<NewSlot>({
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
  });
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch the consultant and their availability slots on mount
  useEffect(() => {
    if (!user) return;

    const fetchConsultantAndSlots = async () => {
      try {
        setLoading(true);

        // Fetch the consultant associated with the logged-in user
        const { data: consultantData, error: consultantError } = await supabase
          .from('consultants')
          .select('id, status')
          .eq('user_id', user.id)
          .single();

        if (consultantError) {
          console.error('Error fetching consultant:', consultantError);
          throw consultantError;
        }

        if (!consultantData) {
          toast.error('No consultant profile found for this user.');
          return;
        }

        setConsultant(consultantData);
        setIsAvailable(consultantData.status === 'active');

        // Fetch availability slots for the consultant
        const { data: slotsData, error: slotsError } = await supabase
          .from('availability_slots')
          .select('id, consultant_id, start_time, end_time')
          .eq('consultant_id', consultantData.id)
          .eq('is_booked', false)
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true });

        if (slotsError) {
          console.error('Error fetching availability slots:', slotsError);
          throw slotsError;
        }

        // Map the slots to the format expected by the component
        const formattedSlots: AvailabilitySlot[] = slotsData.map(slot => {
          const startDate = new Date(slot.start_time);
          const endDate = new Date(slot.end_time);
          return {
            id: slot.id,
            day: startDate.toLocaleString('en-US', { weekday: 'long' }),
            startTime: startDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }),
            endTime: endDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }),
          };
        });

        setAvailabilitySlots(formattedSlots);
      } catch (error) {
        toast.error('Failed to load availability data.');
        console.error('Error in fetchConsultantAndSlots:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConsultantAndSlots();
  }, [user]);

  const toggleAvailability = async (): Promise<void> => {
    if (!consultant) return;

    const newStatus = isAvailable ? 'inactive' : 'active';
    try {
      const { error } = await supabase
        .from('consultants')
        .update({ status: newStatus })
        .eq('id', consultant.id);

      if (error) {
        console.error('Error updating consultant status:', error);
        throw error;
      }

      setIsAvailable(!isAvailable);
      setConsultant({ ...consultant, status: newStatus });
      toast.success(`Availability ${newStatus === 'active' ? 'enabled' : 'disabled'} successfully.`);
    } catch (error) {
      toast.error('Failed to update availability status.');
      console.error('Error in toggleAvailability:', error);
    }
  };

  const handleCreateSlot = (): void => {
    setShowCreateSlotForm(true);
  };

  const handleCloseForm = (): void => {
    setShowCreateSlotForm(false);
    setNewSlot({
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setNewSlot(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddSlot = async (): Promise<void> => {
    if (!consultant) return;

    try {
      // Convert the day and time to a proper timestamp
      const now = new Date();
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayIndex = now.getDay();
      const targetDayIndex = daysOfWeek.indexOf(newSlot.day);
      const daysDifference = (targetDayIndex - todayIndex + 7) % 7 || 7; // Ensure it's in the future

      const startDate = new Date(now);
      startDate.setDate(now.getDate() + daysDifference);
      const [startHours, startMinutes] = newSlot.startTime.split(':').map(Number);
      startDate.setHours(startHours, startMinutes, 0, 0);

      const endDate = new Date(startDate);
      const [endHours, endMinutes] = newSlot.endTime.split(':').map(Number);
      endDate.setHours(endHours, endMinutes, 0, 0);

      // Insert the new slot into the availability_slots table
      const { data, error } = await supabase
        .from('availability_slots')
        .insert({
          consultant_id: consultant.id,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          is_booked: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding availability slot:', error);
        throw error;
      }

      // Add the new slot to the local state
      setAvailabilitySlots([
        ...availabilitySlots,
        {
          id: data.id,
          day: newSlot.day,
          startTime: newSlot.startTime,
          endTime: newSlot.endTime,
        },
      ]);

      handleCloseForm();
      toast.success('Availability slot added successfully.');
    } catch (error) {
      toast.error('Failed to add availability slot.');
      console.error('Error in handleAddSlot:', error);
    }
  };

  const handleDeleteSlot = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('availability_slots')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting availability slot:', error);
        throw error;
      }

      setAvailabilitySlots(availabilitySlots.filter(slot => slot.id !== id));
      toast.success('Availability slot deleted successfully.');
    } catch (error) {
      toast.error('Failed to delete availability slot.');
      console.error('Error in handleDeleteSlot:', error);
    }
  };

  const weekdays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!consultant) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-red-700">No consultant profile found. Please create a consultant profile to manage availability.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Current availability status */}
      <div className="mb-8">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium text-gray-700">
              Current Status: {isAvailable ? 'Available for Consultations' : 'Not Available'}
            </span>
          </div>
          <button 
            onClick={toggleAvailability}
            className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${
              isAvailable 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isAvailable ? 'Turn Off Availability' : 'Turn On Availability'}
          </button>
        </div>
      </div>

      {/* Availability Slots */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800">Weekly Availability Schedule</h3>
          <button 
            onClick={handleCreateSlot}
            className="flex items-center text-sm bg-emerald-500 text-white px-3 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Time Slot
          </button>
        </div>

        {/* List of availability slots */}
        <div className="space-y-3">
          {availabilitySlots.length > 0 ? (
            availabilitySlots.map(slot => (
              <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="font-medium text-gray-700 mr-2">{slot.day}:</span>
                  <span className="text-gray-600">{slot.startTime} - {slot.endTime}</span>
                </div>
                <button 
                  onClick={() => handleDeleteSlot(slot.id)}
                  className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                  aria-label="Delete time slot"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic p-4 bg-gray-50 rounded-lg">No availability slots defined yet.</p>
          )}
        </div>
      </div>

      {/* Create Slot Form Modal */}
      {showCreateSlotForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Add Availability Slot</h3>
              <button 
                onClick={handleCloseForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
                <select
                  name="day"
                  value={newSlot.day}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {weekdays.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  name="startTime"
                  value={newSlot.startTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  name="endTime"
                  value={newSlot.endTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={handleCloseForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSlot}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  Add Slot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AvailabilityManager;