import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Appointment {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

const AppointmentManager: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);

        // Check if the user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No user session found. Please sign in.');
        }

        const user = session.user;

        // Fetch upcoming appointments
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0];

        const { data, error } = await supabase
          .from('appointments')
          .select('id, date, start_time, end_time, is_booked')
          .eq('consultant_id', user.id)
          .eq('is_booked', true)
          .or(`date.gt.${currentDate},and(date.eq.${currentDate},start_time.gt.${currentTime})`)
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });

        if (error) throw error;

        setAppointments(data || []);
      } catch (err) {
        setError(err.message);
        console.error('Fetch Appointments Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  if (loading) return <div className="p-4">Loading appointments...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Appointments</h2>
      {appointments.length === 0 ? (
        <p className="text-gray-600">No upcoming appointments.</p>
      ) : (
        <ul className="space-y-3">
          {appointments.map((appointment) => (
            <li key={appointment.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-gray-800 font-medium">
                  {new Date(appointment.date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  at{' '}
                  {new Date(`1970-01-01T${appointment.start_time}`).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true,
                  })}
                </p>
                <p className="text-sm text-gray-600">
                  Duration: {appointment.start_time} - {appointment.end_time}
                </p>
              </div>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition"
                onClick={() => alert('Cancel functionality to be implemented')}
              >
                Cancel
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AppointmentManager;