import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // To get consultantId from URL

import { supabase, } from '../../lib/supabase';

interface AppointmentSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

const BookAppointment: React.FC = () => {
  const { consultantId } = useParams<{ consultantId: string }>(); // Get consultantId from URL
  const [availableSlots, setAvailableSlots] = useState<AppointmentSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      try {
        setLoading(true);

        // Check if the patient is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No user session found. Please sign in.');
        }

        if (!consultantId) {
          throw new Error('Consultant ID is missing.');
        }

        // Fetch available slots (is_booked = false)
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0];

        const { data, error } = await supabase
          .from('appointments')
          .select('id, date, start_time, end_time, is_booked')
          .eq('consultant_id', consultantId)
          .eq('is_booked', false)
          .or(`date.gt.${currentDate},and(date.eq.${currentDate},start_time.gt.${currentTime})`)
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });

        if (error) throw error;

        setAvailableSlots(data || []);
      } catch (err) {
        setError(err.message);
        console.error('Fetch Available Slots Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableSlots();
  }, [consultantId]);

  const handleBookAppointment = async (slotId: string) => {
    try {
      setSuccess(null);
      setError(null);

      // Check if the patient is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No user session found. Please sign in.');
      }

      const patientId = session.user.id;

      // Book the slot by updating is_booked and patient_id
      const { error } = await supabase
        .from('appointments')
        .update({ is_booked: true, patient_id: patientId })
        .eq('id', slotId)
        .eq('is_booked', false); // Ensure the slot is still available

      if (error) throw error;

      setSuccess('Appointment booked successfully!');
      // Remove the booked slot from the list
      setAvailableSlots(availableSlots.filter((slot) => slot.id !== slotId));
    } catch (err) {
      setError(err.message);
      console.error('Book Appointment Error:', err);
    }
  };

  if (loading) return <div className="text-center py-10">Loading available slots...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Error: {error}</div>;

  return (
    <div className="font-sans min-h-screen bg-gray-50 p-5 max-w-6xl mx-auto my-5">
      <h1 className="text-center text-2xl font-semibold text-gray-800 mb-8">
        Book an Appointment
      </h1>
      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
          {success}
        </div>
      )}
      {availableSlots.length === 0 ? (
        <p className="text-center text-gray-600">No available slots at the moment.</p>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Available Slots</h2>
          <ul className="space-y-3">
            {availableSlots.map((slot) => (
              <li
                key={slot.id}
                className="p-3 bg-gray-50 rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="text-gray-800 font-medium">
                    {new Date(slot.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    at{' '}
                    {new Date(`1970-01-01T${slot.start_time}`).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: 'numeric',
                      hour12: true,
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    Duration: {slot.start_time} - {slot.end_time}
                  </p>
                </div>
                <button
                  onClick={() => handleBookAppointment(slot.id)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                >
                  Book
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;