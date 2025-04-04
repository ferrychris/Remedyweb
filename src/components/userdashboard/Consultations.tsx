// src/components/userdashboard/sections/Consultations.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import toast from 'react-hot-toast';
import { Consultation, Consultant } from '../../../types';

export function Consultations() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [newConsultation, setNewConsultation] = useState({
    consultant_id: '',
    scheduled_for: '',
    notes: '',
  });
  const [editingConsultation, setEditingConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch user consultations
        const { data: consultationsData, error: consultationsError } = await supabase
          .from('consultations')
          .select('id, user_id, consultant_id, scheduled_for, status, notes, created_at, updated_at, consultant:consultants(name, specialty)')
          .eq('user_id', user.id)
          .order('scheduled_for', { ascending: false });

        if (consultationsError) throw consultationsError;
        setConsultations(consultationsData || []);

        // Fetch available consultants
        const { data: consultantsData, error: consultantsError } = await supabase
          .from('consultants')
          .select('id, name, specialty')
          .eq('status', 'active');

        if (consultantsError) throw consultantsError;
        setConsultants(consultantsData || []);
      } catch (error) {
        toast.error('Failed to load consultations');
        console.error('Consultations error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleScheduleConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from('consultations').insert({
        user_id: user.id,
        consultant_id: newConsultation.consultant_id,
        scheduled_for: newConsultation.scheduled_for,
        status: 'pending',
        notes: newConsultation.notes,
      });

      if (error) throw error;
      toast.success('Consultation scheduled successfully');
      setNewConsultation({ consultant_id: '', scheduled_for: '', notes: '' });

      // Refresh consultations
      const { data, error: fetchError } = await supabase
        .from('consultations')
        .select('id, user_id, consultant_id, scheduled_for, status, notes, created_at, updated_at, consultant:consultants(name, specialty)')
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: false });

      if (fetchError) throw fetchError;
      setConsultations(data || []);
    } catch (error) {
      toast.error('Failed to schedule consultation');
      console.error('Schedule consultation error:', error);
    }
  };

  const handleUpdateNotes = async (consultationId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('consultations')
        .update({ notes })
        .eq('id', consultationId);

      if (error) throw error;
      toast.success('Notes updated successfully');
      setConsultations(
        consultations.map((consultation) =>
          consultation.id === consultationId ? { ...consultation, notes } : consultation
        )
      );
      setEditingConsultation(null);
    } catch (error) {
      toast.error('Failed to update notes');
      console.error('Update notes error:', error);
    }
  };

  const handleCancelConsultation = async (consultationId: string) => {
    try {
      const { error } = await supabase
        .from('consultations')
        .update({ status: 'cancelled' })
        .eq('id', consultationId);

      if (error) throw error;
      toast.success('Consultation cancelled successfully');
      setConsultations(
        consultations.map((consultation) =>
          consultation.id === consultationId ? { ...consultation, status: 'cancelled' } : consultation
        )
      );
    } catch (error) {
      toast.error('Failed to cancel consultation');
      console.error('Cancel consultation error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Consultations</h1>

      {/* Schedule New Consultation */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 transform transition duration-300 hover:scale-105">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Schedule a New Consultation</h2>
        <form onSubmit={handleScheduleConsultation} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Consultant</label>
            <select
              value={newConsultation.consultant_id}
              onChange={(e) => setNewConsultation({ ...newConsultation, consultant_id: e.target.value })}
              className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select a consultant</option>
              {consultants.map((consultant) => (
                <option key={consultant.id} value={consultant.id}>
                  {consultant.name} ({consultant.specialty})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date & Time</label>
            <input
              type="datetime-local"
              value={newConsultation.scheduled_for}
              onChange={(e) => setNewConsultation({ ...newConsultation, scheduled_for: e.target.value })}
              className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={newConsultation.notes}
              onChange={(e) => setNewConsultation({ ...newConsultation, notes: e.target.value })}
              className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
              placeholder="Add any notes for the consultation..."
            />
          </div>
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200"
          >
            Schedule
          </button>
        </form>
      </div>

      {/* Consultation List */}
      <div className="bg-white p-4 rounded-lg shadow transform transition duration-300 hover:scale-105">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Your Consultations</h2>
        {consultations.length === 0 ? (
          <p className="text-gray-500">No consultations scheduled.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consultant
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {consultations.map((consultation) => (
                  <tr key={consultation.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {consultation.consultant?.name || 'Unknown'} ({consultation.consultant?.specialty || ''})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(consultation.scheduled_for).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          consultation.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : consultation.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {consultation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingConsultation?.id === consultation.id ? (
                        <textarea
                          value={editingConsultation.notes || ''}
                          onChange={(e) =>
                            setEditingConsultation({ ...editingConsultation, notes: e.target.value })
                          }
                          className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                          rows={2}
                        />
                      ) : (
                        consultation.notes || 'No notes'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingConsultation?.id === consultation.id ? (
                        <>
                          <button
                            onClick={() => handleUpdateNotes(consultation.id, editingConsultation.notes || '')}
                            className="text-green-600 hover:text-green-800 mr-4"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingConsultation(null)}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingConsultation(consultation)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Edit Notes
                          </button>
                          {consultation.status === 'pending' && (
                            <button
                              onClick={() => handleCancelConsultation(consultation.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Cancel
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}