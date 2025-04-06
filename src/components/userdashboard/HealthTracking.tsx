// src/components/userdashboard/sections/HealthTracking.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import toast from 'react-hot-toast';

interface HealthTrackingEntry {
  id: string;
  consultant_id: string | null;
  patient_id: string | null;
  consultation_id: string | null;
  rating: number | null;
  feedback: string | null;
  created_at: string;
}

export function HealthTracking() {
  const { user } = useAuth();
  const [healthEntries, setHealthEntries] = useState<HealthTrackingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEntry, setNewEntry] = useState({
    rating: '',
    feedback: '',
  });

  useEffect(() => {
    const fetchHealthEntries = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('consultation_ratings')
          .select('*')
          .eq('patient_id', user.id) // Fetch entries where patient_id matches the authenticated user
          .order('created_at', { ascending: false });

        if (error) throw error;
        setHealthEntries(data || []);
      } catch (error) {
        toast.error('Failed to load health tracking data');
        console.error('Fetch health tracking error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHealthEntries();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEntry.rating || isNaN(Number(newEntry.rating))) {
      toast.error('Please enter a valid health score');
      return;
    }

    try {
      const { error } = await supabase
        .from('consultation_ratings')
        .insert({
          consultant_id: null, // Patient self-logging, no consultant
          patient_id: user?.id, // Set to authenticated user, even though nullable
          consultation_id: null, // Not used for health tracking
          rating: Number(newEntry.rating),
          feedback: newEntry.feedback || null,
        });

      if (error) throw error;

      setNewEntry({ rating: '', feedback: '' });
      toast.success('Health tracking entry logged successfully!');
      const { data: entries } = await supabase
        .from('health_tracking')
        .select('*')
        .eq('patient_id', user?.id || '')
        .order('created_at', { ascending: false });
      setHealthEntries(entries as HealthTrackingEntry[] || []);
    } catch (error) {
      toast.error('Failed to log health tracking entry');
      console.error('Log health tracking error:', error);
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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Health Tracking</h1>

      {/* Welcome Banner */}
      <div className="bg-green-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold text-green-800">
          Your Health Journey, {user?.email || 'Patient'}!
        </h2>
        <p className="text-green-600">Track your personal health scores here.</p>
      </div>

      {/* Log New Health Entry Form */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Log Your Health Entry</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Health Score</label>
            <input
              type="number"
              value={newEntry.rating}
              onChange={(e) => setNewEntry({ ...newEntry, rating: e.target.value })}
              placeholder="Enter your health score"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea
              value={newEntry.feedback}
              onChange={(e) => setNewEntry({ ...newEntry, feedback: e.target.value })}
              placeholder="Add notes (e.g., 'Felt energetic today')"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200"
          >
            Log My Health
          </button>
        </form>
      </div>

      {/* Health Entries History */}
      {healthEntries.length > 0 ? (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Health Tracking History</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Health Score
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {healthEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.rating !== null ? entry.rating : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.feedback || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-gray-500">No health tracking entries logged yet.</p>
      )}
    </div>
  );
}

export default HealthTracking;