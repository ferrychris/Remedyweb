import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import toast from 'react-hot-toast';

interface Consultant {
  id: string;
  name: string;
  specialty: string;
}

interface AppointmentSlot {
  id: string;
  consultant_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  created_at: string;
}

function BookAppointment() {
  const { user } = useAuth();
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [selectedConsultantId, setSelectedConsultantId] = useState<string | null>(null);
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch consultants
  useEffect(() => {
    const fetchConsultants = async () => {
      const { data, error } = await supabase
        .from('consultants')
        .select('id, name, specialty')
        .order('name', { ascending: true });
      if (error) {
        toast.error('Failed to load consultants.');
        return;
      }
      setConsultants(data || []);
    };
    fetchConsultants();
  }, []);

  // Fetch available slots
  useEffect(() => {
    if (!selectedConsultantId) return;
    const fetchSlots = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select('id, consultant_id, date, start_time, end_time, is_booked, created_at')
        .eq('consultant_id', selectedConsultantId)
        .eq('is_booked', false)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
      if (error) {
        toast.error('Failed to load slots.');
      } else {
        setSlots(data || []);
      }
      setLoading(false);
    };
    fetchSlots();
  }, [selectedConsultantId]);

  // Book a slot
  const handleBookSlot = async (slotId: string) => {
    if (!user) {
      toast.error('Please log in to book an appointment.');
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('appointments')
      .update({ is_booked: true /*, patient_id: user.id */ })
      .eq('id', slotId)
      .eq('is_booked', false);
    if (error) {
      toast.error('Failed to book slot.');
    } else {
      toast.success('Slot booked successfully!');
      setSlots(slots.filter(slot => slot.id !== slotId));
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Book an Appointment</h1>
      <select
        value={selectedConsultantId || ''}
        onChange={(e) => setSelectedConsultantId(e.target.value || null)}
        className="w-full p-2 border rounded-md mb-4"
      >
        <option value="">-- Select a Consultant --</option>
        {consultants.map(consultant => (
          <option key={consultant.id} value={consultant.id}>
            {consultant.name} ({consultant.specialty})
          </option>
        ))}
      </select>
      {selectedConsultantId && (
        <div>
          {loading && <p>Loading slots...</p>}
          {slots.length === 0 && !loading && <p>No available slots.</p>}
          {slots.map(slot => (
            <div key={slot.id} className="p-4 border rounded-lg mb-2 flex justify-between">
              <p>
                {new Date(`${slot.date}T${slot.start_time}`).toLocaleString()} -{' '}
                {new Date(`${slot.date}T${slot.end_time}`).toLocaleString()}
              </p>
              <button
                onClick={() => handleBookSlot(slot.id)}
                disabled={loading}
                className="text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
              >
                Book
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BookAppointment;