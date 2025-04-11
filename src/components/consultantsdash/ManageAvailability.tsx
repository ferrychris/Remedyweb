import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import toast from 'react-hot-toast';

// Define the structure of a consultant
interface Consultant {
  id: string;
  name: string;
  specialty: string;
}

// Define the structure of an appointment slot based on the appointments table
interface AppointmentSlot {
  id: string;
  consultant_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
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
  const { user, role, loading: authLoading } = useAuth();
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [selectedConsultantId, setSelectedConsultantId] = useState<string | null>(null);
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingConsultants, setLoadingConsultants] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newSlot, setNewSlot] = useState<NewSlotForm>({
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  });

  // Log the role for debugging
  useEffect(() => {
    if (!authLoading) {
      console.log('User role after auth loading:', role);
    }
  }, [authLoading, role]);

  // 1. Fetch All Consultants
  const fetchConsultants = useCallback(async () => {
    if (!user) {
      setError('User not authenticated. Please log in.');
      setLoadingConsultants(false);
      return;
    }

    try {
      setLoadingConsultants(true);
      setError(null);
      console.log('Fetching all consultants...');
      const { data, error } = await supabase
        .from('consultants')
        .select('id, name, specialty')
        .order('name', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('No consultants found.');
        setError('No consultants found in the system. Please add a consultant first.');
        setConsultants([]);
        setSelectedConsultantId(null);
        return;
      }

      console.log('Consultants fetched:', data);
      setConsultants(data);

      // If the currently selected consultant ID is not in the new list, reset it
      if (selectedConsultantId && !data.some(c => c.id === selectedConsultantId)) {
        console.warn('Selected consultant ID not found in fetched data. Resetting selection.');
        setSelectedConsultantId(null);
      }
    } catch (err: any) {
      console.error('Error fetching consultants:', err);
      setError(err.message || 'Failed to fetch consultants.');
      toast.error('Failed to load consultants.');
      setConsultants([]);
      setSelectedConsultantId(null);
    } finally {
      setLoadingConsultants(false);
    }
  }, [user, selectedConsultantId]);

  // 2. Fetch Appointment Slots for the selected consultant
  const fetchSlots = useCallback(async () => {
    if (!selectedConsultantId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, consultant_id, date, start_time, end_time, is_booked, created_at')
        .eq('consultant_id', selectedConsultantId)
        .eq('is_booked', false) // Only fetch unbooked slots
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSlots(data || []);
    } catch (err: any) {
      console.error('Error fetching slots:', err);
      setError(err.message || 'Failed to fetch availability slots.');
      toast.error('Failed to load availability slots.');
    } finally {
      setLoading(false);
    }
  }, [selectedConsultantId]);

  // Fetch consultants when the component mounts, but only after auth loading is complete
  useEffect(() => {
    if (!authLoading && role === 'admin') {
      fetchConsultants();
    }
  }, [authLoading, fetchConsultants, role]);

  // Fetch slots when a consultant is selected
  useEffect(() => {
    if (selectedConsultantId) {
      fetchSlots();
    }
  }, [selectedConsultantId, fetchSlots]);

  // 3. Handle Consultant Selection
  const handleConsultantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const consultantId = e.target.value;
    console.log('Selected consultant ID:', consultantId);
    setSelectedConsultantId(consultantId || null);
    setSlots([]); // Clear slots when changing consultant
  };

  // 4. Handle Form Input Change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSlot(prev => ({ ...prev, [name]: value }));
  };

  // 5. Handle Form Submission (Add Slot)
  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsultantId) {
      toast.error('Please select a consultant.');
      return;
    }

    // Validate that the selectedConsultantId exists in the consultants list
    const selectedConsultant = consultants.find(c => c.id === selectedConsultantId);
    if (!selectedConsultant) {
      console.error('Selected consultant ID does not exist in consultants:', selectedConsultantId);
      toast.error('The selected consultant does not exist. Please refresh the list and try again.');
      return;
    }

    try {
      const startDateTime = new Date(`${newSlot.startDate}T${newSlot.startTime}`);
      const endDateTime = new Date(`${newSlot.endDate}T${newSlot.endTime}`);

      // Validation
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        toast.error('Invalid date or time format. Use YYYY-MM-DD and HH:MM.');
        return;
      }

      if (endDateTime <= startDateTime) {
        toast.error('End time must be after start time.');
        return;
      }

      if (startDateTime < new Date()) {
        toast.error('Cannot add slots in the past.');
        return;
      }

      if (newSlot.startDate !== newSlot.endDate) {
        toast.error('Start date and end date must be the same.');
        return;
      }

      // Check for overlapping slots
      const { data: existingSlots, error: fetchError } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('consultant_id', selectedConsultantId)
        .eq('date', newSlot.startDate);

      if (fetchError) throw fetchError;

      const newStart = startDateTime.getTime();
      const newEnd = endDateTime.getTime();

      const hasOverlap = existingSlots?.some(slot => {
        const slotStart = new Date(`${newSlot.startDate}T${slot.start_time}`).getTime();
        const slotEnd = new Date(`${newSlot.startDate}T${slot.end_time}`).getTime();
        return newStart < slotEnd && newEnd > slotStart;
      });

      if (hasOverlap) {
        toast.error('This slot overlaps with an existing slot.');
        return;
      }

      setLoading(true);
      console.log('Inserting new slot with consultant_id:', selectedConsultantId);
      const { error: insertError } = await supabase.from('appointments').insert({
        consultant_id: selectedConsultantId,
        date: newSlot.startDate,
        start_time: newSlot.startTime,
        end_time: newSlot.endTime,
        is_booked: false,
      });

      if (insertError) throw insertError;

      toast.success('Availability slot added!');
      setNewSlot({ startDate: '', startTime: '', endDate: '', endTime: '' });
      fetchSlots();
    } catch (err: any) {
      console.error('Error adding slot:', err);
      if (err.message?.includes('foreign key constraint')) {
        toast.error('The selected consultant does not exist in the system. Please refresh and try again.');
      } else if (err.message?.includes('check constraint')) {
        toast.error('End time must be after start time.');
      } else if (err.message?.includes('timestamp')) {
        toast.error('Invalid date/time format provided.');
      } else {
        toast.error(err.message || 'Failed to add slot.');
      }
      setLoading(false);
    }
  };

  // 6. Handle Slot Deletion
  const handleDeleteSlot = async (slotId: string) => {
    if (!window.confirm('Are you sure you want to delete this slot? This cannot be undone.')) {
      return;
    }

    const slotToDelete = slots.find(s => s.id === slotId);
    if (!slotToDelete) return;

    if (slotToDelete.is_booked) {
      toast.error('Cannot delete a booked slot.');
      return;
    }

    const slotStartTime = new Date(`${slotToDelete.date}T${slotToDelete.start_time}`);
    if (slotStartTime < new Date()) {
      toast.error('Cannot delete a past slot.');
      return;
    }

    try {
      setLoading(true);
      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', slotId)
        .eq('consultant_id', selectedConsultantId)
        .eq('is_booked', false);

      if (deleteError) throw deleteError;

      toast.success('Slot deleted.');
      fetchSlots();
    } catch (err: any) {
      console.error('Error deleting slot:', err);
      toast.error(err.message || 'Failed to delete slot.');
      setLoading(false);
    }
  };

  // Helper to format date/time
  const formatDateTime = (date: string, time: string) => {
    if (!date || !time) return 'N/A';
    try {
      return new Date(`${date}T${time}`).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid Date';
    }
  };

  // Wait for auth loading to complete
  if (authLoading) {
    return <p className="text-center p-4">Loading authentication...</p>;
  }

  if (!user) {
    return <p className="text-center text-red-600 p-4">Please log in to manage availability.</p>;
  }

  // Check if the user is an admin
  if (role !== 'admin') {
    return (
      <div className="text-center p-4">
        <p className="text-red-600">Access Denied: Only admins can manage consultant availability.</p>
        <p className="text-gray-600 mt-2">Your role: {role || 'unknown'}</p>
      </div>
    );
  }

  if (loadingConsultants) {
    return <p className="text-center p-4">Loading consultants...</p>;
  }

  if (error && !loadingConsultants) {
    return (
      <div className="text-center p-4">
        <p className="text-red-600">Error: {error}</p>
        <button
          onClick={fetchConsultants}
          className="mt-2 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Refresh Consultants
        </button>
      </div>
    );
  }

  if (!loadingConsultants && consultants.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-orange-600">No consultants found in the system.</p>
        <button
          onClick={fetchConsultants}
          className="mt-2 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Refresh Consultants
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Manage Consultant Availability</h1>

      {/* Consultant Selection */}
      <div className="mb-8 p-6 border rounded-lg shadow-md bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-700">Select a Consultant</h2>
          <button
            onClick={fetchConsultants}
            disabled={loadingConsultants}
            className="inline-flex justify-center py-1 px-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loadingConsultants ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <select
          value={selectedConsultantId || ''}
          onChange={handleConsultantChange}
          className="mt-4 w-full p-2 border rounded-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          disabled={consultants.length === 0}
        >
          <option value="">-- Select a Consultant --</option>
          {consultants.map(consultant => (
            <option key={consultant.id} value={consultant.id}>
              {consultant.name} ({consultant.specialty})
            </option>
          ))}
        </select>
      </div>

      {selectedConsultantId && (
        <>
          {/* Add New Slot Form */}
          <form onSubmit={handleAddSlot} className="mb-8 p-6 border rounded-lg shadow-md bg-white">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Add New Slot</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date/Time */}
              <div className="col-span-1">
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
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
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                  Start Time
                </label>
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
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
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
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                  End Time
                </label>
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
              disabled={loading || !selectedConsultantId || consultants.length === 0}
              className="mt-5 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && !slots.length ? 'Adding...' : 'Add Slot'}
            </button>
          </form>

          {/* List Existing Slots */}
          <div className="bg-white p-6 border rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Current Slots</h2>
            {loading && slots.length === 0 && <p className="text-gray-500">Loading slots...</p>}
            {error && !loading && <p className="text-red-600">Error loading slots: {error}</p>}
            {!loading && !error && slots.length === 0 && selectedConsultantId && (
              <p className="text-gray-500">No availability slots added yet for this consultant.</p>
            )}
            {slots.length > 0 && (
              <ul className="space-y-3">
                {slots.map((slot) => (
                  <li
                    key={slot.id}
                    className={`p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center ${
                      slot.is_booked ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {formatDateTime(slot.date, slot.start_time)} -{' '}
                        {formatDateTime(slot.date, slot.end_time)}
                      </p>
                      <p
                        className={`text-sm font-medium mt-1 ${
                          slot.is_booked ? 'text-orange-600' : 'text-green-600'
                        }`}
                      >
                        Status: {slot.is_booked ? 'Booked' : 'Available'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Created: {new Date(slot.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-4 flex-shrink-0">
                      {!slot.is_booked && new Date(`${slot.date}T${slot.start_time}`) > new Date() && (
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          disabled={loading}
                          className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label={`Delete slot from ${formatDateTime(slot.date, slot.start_time)}`}
                        >
                          Delete
                        </button>
                      )}
                      {slot.is_booked && (
                        <span className="text-sm text-gray-500 px-2 py-1 rounded bg-gray-200">
                          Booked
                        </span>
                      )}
                      {!slot.is_booked &&
                        new Date(`${slot.date}T${slot.start_time}`) <= new Date() && (
                          <span className="text-sm text-gray-500 px-2 py-1 rounded bg-yellow-100 text-yellow-700">
                            Past
                          </span>
                        )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ManageAvailability;