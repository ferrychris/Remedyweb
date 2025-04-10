import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import toast from 'react-hot-toast';
import { Heart, Activity } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { useNavigate } from 'react-router-dom';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface HealthMetric {
  id: string;
  user_id: string;
  metric_type: string;
  value: any; // JSONB in Supabase, parsed as object in frontend
  recorded_at: string;
}

export function HealthTracking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('heart_rate');
  const [newMetric, setNewMetric] = useState<any>({});
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchHealthMetrics();
  }, [user, navigate]);

  // Fetch Health Metrics
  const fetchHealthMetrics = async () => {
    if (!user) return;

    try {
      setLoadingMetrics(true);
      const { data, error } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(50); // Limit to last 50 entries for performance

      if (error) throw error;
      setHealthMetrics(data || []);
      analyzeHealthData(data || []);
    } catch (error) {
      toast.error('Failed to load health metrics');
      console.error('Health metrics error:', error);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Analyze Health Data for Insights
  const analyzeHealthData = (metrics: HealthMetric[]) => {
    const newInsights: string[] = [];

    // Check for high heart rate
    const heartRates = metrics
      .filter(m => m.metric_type === 'heart_rate')
      .map(m => m.value.value)
      .slice(0, 5); // Last 5 heart rate entries

    if (heartRates.length > 0) {
      const avgHeartRate = heartRates.reduce((sum, val) => sum + val, 0) / heartRates.length;
      if (avgHeartRate > 100) {
        newInsights.push('Your average heart rate is high (>100 bpm). Consider consulting a doctor.');
      }
    }

    // Check for low sleep
    const sleepData = metrics
      .filter(m => m.metric_type === 'sleep')
      .map(m => m.value.hours)
      .slice(0, 5); // Last 5 sleep entries

    if (sleepData.length > 0) {
      const avgSleep = sleepData.reduce((sum, val) => sum + val, 0) / sleepData.length;
      if (avgSleep < 6) {
        newInsights.push('Your average sleep is low (<6 hours). Aim for 7-9 hours per night.');
      }
    }

    setInsights(newInsights);
  };

  // Handle Logging a New Metric
  const handleLogMetric = async () => {
    if (!user || !newMetric.value) {
      toast.error('Please enter a valid value');
      return;
    }

    try {
      const metricData: any = {
        user_id: user.id,
        metric_type: selectedMetric,
        value: {},
        recorded_at: new Date().toISOString(),
      };

      // Structure the value based on metric type
      if (selectedMetric === 'blood_pressure') {
        metricData.value = {
          systolic: parseInt(newMetric.systolic) || 0,
          diastolic: parseInt(newMetric.diastolic) || 0,
        };
      } else if (selectedMetric === 'sleep') {
        metricData.value = { hours: parseFloat(newMetric.hours) || 0 };
      } else {
        metricData.value = { value: parseFloat(newMetric.value) || 0 };
      }

      const { error } = await supabase.from('health_metrics').insert([metricData]);

      if (error) throw error;
<<<<<<< HEAD
      toast.success('Health metric logged successfully');
      setNewMetric({});
      fetchHealthMetrics(); // Refresh metrics
=======

      setNewEntry({ rating: '', feedback: '' });
      toast.success('Health tracking entry logged successfully!');
      const { data: entries } = await supabase
        .from('consultation_ratings')
        .select('*')
        .eq('patient_id', user?.id || '')
        .order('created_at', { ascending: false });
      setHealthEntries(entries as HealthTrackingEntry[] || []);
>>>>>>> 70fa9a48920bff527ba1f6fbe46ba9ac11b6d780
    } catch (error) {
      toast.error('Failed to log health metric');
      console.error('Log metric error:', error);
    }
  };

  // Prepare Chart Data
  const getChartData = () => {
    const filteredMetrics = healthMetrics.filter(m => m.metric_type === selectedMetric);
    const labels = filteredMetrics.map(m => new Date(m.recorded_at).toLocaleDateString());
    let data: number[] = [];

    if (selectedMetric === 'blood_pressure') {
      data = filteredMetrics.map(m => m.value.systolic); // Show systolic for BP
    } else if (selectedMetric === 'sleep') {
      data = filteredMetrics.map(m => m.value.hours);
    } else {
      data = filteredMetrics.map(m => m.value.value);
    }

    return {
      labels,
      datasets: [
        {
          label: selectedMetric.replace('_', ' ').toUpperCase(),
          data,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
        },
      ],
    };
  };

  if (loadingMetrics) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <Heart className="h-6 w-6 mr-2 text-emerald-600" />
        Health Tracking
      </h1>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        {/* Log New Metric */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Log a New Health Metric</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="heart_rate">Heart Rate (bpm)</option>
              <option value="blood_pressure">Blood Pressure (mmHg)</option>
              <option value="steps">Steps</option>
              <option value="sleep">Sleep (hours)</option>
              <option value="stress">Stress Level (1-10)</option>
            </select>

            {selectedMetric === 'blood_pressure' ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Systolic"
                  value={newMetric.systolic || ''}
                  onChange={(e) => setNewMetric({ ...newMetric, systolic: e.target.value })}
                  className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="number"
                  placeholder="Diastolic"
                  value={newMetric.diastolic || ''}
                  onChange={(e) => setNewMetric({ ...newMetric, diastolic: e.target.value })}
                  className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            ) : selectedMetric === 'sleep' ? (
              <input
                type="number"
                step="0.1"
                placeholder="Hours slept"
                value={newMetric.hours || ''}
                onChange={(e) => setNewMetric({ ...newMetric, hours: e.target.value })}
                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            ) : (
              <input
                type="number"
                placeholder={`Enter ${selectedMetric.replace('_', ' ')}`}
                value={newMetric.value || ''}
                onChange={(e) => setNewMetric({ ...newMetric, value: e.target.value })}
                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            )}

            <button
              onClick={handleLogMetric}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Log Metric
            </button>
          </div>
        </div>

        {/* Insights/Alerts */}
        {insights.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Health Insights</h3>
            <ul className="list-disc pl-5 text-yellow-700">
              {insights.map((insight, index) => (
                <li key={index}>{insight}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Health Metrics Chart */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Your Health Trends</h3>
          <div className="mb-4">
            <label className="mr-2">Select Metric to View:</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="heart_rate">Heart Rate</option>
              <option value="blood_pressure">Blood Pressure</option>
              <option value="steps">Steps</option>
              <option value="sleep">Sleep</option>
              <option value="stress">Stress</option>
            </select>
          </div>

          {healthMetrics.filter(m => m.metric_type === selectedMetric).length === 0 ? (
            <p className="text-gray-600">No data available for this metric.</p>
          ) : (
            <div className="h-64">
              <Line
                data={getChartData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: selectedMetric === 'blood_pressure' ? 'mmHg' : selectedMetric === 'sleep' ? 'Hours' : selectedMetric === 'steps' ? 'Steps' : 'Value',
                      },
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'Date',
                      },
                    },
                  },
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}