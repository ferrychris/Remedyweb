// src/components/userdashboard/sections/Overview.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import toast from 'react-hot-toast';
import { Consultation, HealthMetric } from '../../../types';

export function Overview() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch recent consultations
        const { data: consultationsData, error: consultationsError } = await supabase
          .from('consultations')
          .select('id, scheduled_for, status, notes, consultant:consultants(name, specialty)')
          .eq('user_id', user.id)
          .order('scheduled_for', { ascending: false })
          .limit(3);

        if (consultationsError) throw consultationsError;
        setConsultations(consultationsData || []);

        // Fetch recent health metrics (unchanged from previous implementation)
        const { data: healthData, error: healthError } = await supabase
          .from('health_tracking')
          .select('id, metric, value, recorded_at')
          .eq('user_id', user.id)
          .order('recorded_at', { ascending: false })
          .limit(3);

        if (healthError) throw healthError;
        setHealthMetrics(healthData || []);
      } catch (error) {
        toast.error('Failed to load overview data');
        console.error('Overview error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Overview</h1>

      {/* Welcome Banner */}
      <div className="bg-green-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold text-green-800">
          Welcome back, {user?.email?.split('@')[0]}!
        </h2>
        <p className="text-green-600">Your health journey starts here. Check your recent activities!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Consultations */}
        <div className="bg-white p-4 rounded-lg shadow transform transition duration-300 hover:scale-105">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Recent Consultations</h2>
          {consultations.length === 0 ? (
            <p className="text-gray-500">No recent consultations.</p>
          ) : (
            <ul className="space-y-2">
              {consultations.map((consultation) => (
                <li key={consultation.id} className="border-b py-2">
                  <p className="text-gray-800">
                    <strong>{consultation.consultant?.name || 'Unknown'}</strong> (
                    {consultation.consultant?.specialty || 'N/A'}) -{' '}
                    {new Date(consultation.scheduled_for).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">Status: {consultation.status}</p>
                  {consultation.notes && (
                    <p className="text-sm text-gray-500 mt-1">Notes: {consultation.notes}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Health Metrics */}
        <div className="bg-white p-4 rounded-lg shadow transform transition duration-300 hover:scale-105">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Recent Health Metrics</h2>
          {healthMetrics.length === 0 ? (
            <p className="text-gray-500">No recent health metrics.</p>
          ) : (
            <ul className="space-y-2">
              {healthMetrics.map((metric) => (
                <li key={metric.id} className="border-b py-2">
                  <p className="text-gray-800">
                    <strong>{metric.metric.replace('_', ' ')}</strong>: {metric.value}
                  </p>
                  <p className="text-sm text-gray-500">
                    Recorded: {new Date(metric.recorded_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
