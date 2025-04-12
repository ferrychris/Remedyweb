// src/components/userdashboard/sections/Overview.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import toast from 'react-hot-toast';
import { Calendar, Clock, Heart, ShoppingBag, Activity, ChevronRight } from 'lucide-react';

// Define types for our data
interface Consultation {
  id: number;
  scheduled_for: string;
  status: string;
  notes?: string;
  consultant?: {
    id?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    specialty?: string;
  };
}

interface HealthReview {
  id: number;
  overall_rating: number;
  created_at: string;
}

interface Order {
  id: number;
  created_at: string;
  status: string;
  total_amount: number;
  items_count: number;
}

interface SavedRemedy {
  id: number;
  title: string;
  created_at: string;
  ailment: {
    id: number;
    title: string;
  };
}

export function Overview() {
  const { user, profile } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [healthReview, setHealthReview] = useState<HealthReview | null>(null);
  const [savedRemedies, setSavedRemedies] = useState<SavedRemedy[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalConsultations: 0,
    savedRemedies: 0,
    healthScore: 0,
    totalOrders: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch recent consultations
        const { data: consultationsData, error: consultationsError } = await supabase
          .from('consultations')
          .select('id, scheduled_for, status, notes, consultant:consultants(*)')
          .eq('user_id', user.id)
          .order('scheduled_for', { ascending: false })
          .limit(3);

        if (consultationsError) throw consultationsError;
        
        // Transform the data to match our interface
        const processedConsultations = (consultationsData || []).map(consultation => {
          // Handle different consultant data structures
          let consultantData = null;
          
          if (consultation.consultant) {
            const consultantSource = Array.isArray(consultation.consultant) 
              ? consultation.consultant[0] 
              : consultation.consultant;
            
            if (consultantSource) {
              consultantData = {
                id: consultantSource.id,
                name: consultantSource.name || `${consultantSource.first_name || ''} ${consultantSource.last_name || ''}`.trim(),
                first_name: consultantSource.first_name,
                last_name: consultantSource.last_name,
                specialty: consultantSource.specialty
              };
            }
          }
          
          return {
            id: consultation.id,
            scheduled_for: consultation.scheduled_for,
            status: consultation.status,
            notes: consultation.notes,
            consultant: consultantData
          };
        });
        
        setConsultations(processedConsultations);

        // Fetch latest health review
        const { data: healthReviewData, error: healthReviewError } = await supabase
          .from('health_reviews')
          .select('id, overall_rating, created_at')
          .eq('patient_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (healthReviewError) throw healthReviewError;
        setHealthReview(healthReviewData?.[0] || null);

        // Fetch saved remedies
        const { data: remediesData, error: remediesError } = await supabase
          .from('remedies')
          .select('id, title, created_at, ailment:ailments(id, title)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (remediesError) throw remediesError;
        setSavedRemedies(remediesData?.map(remedy => ({
          ...remedy,
          ailment: remedy.ailment?.[0] || { id: 0, title: 'Unknown Ailment' }
        })) || []);
        
        // Fetch recent orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('id, created_at, status, total_amount, items_count')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (ordersError) throw ordersError;
        setOrders(ordersData || []);
        
        // Set stats
        setStats({
          totalConsultations: consultationsData?.length || 0,
          savedRemedies: remediesData?.length || 0,
          healthScore: healthReviewData?.[0]?.overall_rating || 0,
          totalOrders: ordersData?.length || 0
        });
      } catch (error) {
        toast.error('Failed to load overview data');
        console.error('Overview error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getRatingColor = (rating: number) => {
    if (rating >= 80) return 'text-emerald-500';
    if (rating >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 80) return 'Excellent';
    if (rating >= 60) return 'Good';
    if (rating >= 40) return 'Fair';
    return 'Poor';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Welcome back, {profile?.display_name || 'Patient'}!</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-emerald-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-emerald-100 mr-4">
              <Calendar className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Consultations</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalConsultations}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <Heart className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Saved Remedies</p>
              <p className="text-2xl font-bold text-gray-800">{stats.savedRemedies}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 mr-4">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Health Score</p>
              {healthReview ? (
                <div className="flex flex-col">
                  <p className={`text-2xl font-bold ${getRatingColor(healthReview.overall_rating)}`}>
                    {healthReview.overall_rating}%
                  </p>
                  <p className="text-xs text-gray-500">{getRatingLabel(healthReview.overall_rating)}</p>
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-800">N/A</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 mr-4">
              <ShoppingBag className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Consultations */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Recent Consultations</h2>
            <button className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          
          {consultations.length === 0 ? (
            <p className="text-gray-500">No recent consultations.</p>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Consultant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {consultations.map((consultation) => (
                    <tr key={consultation.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {consultation.consultant?.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {consultation.consultant?.specialty || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(consultation.scheduled_for).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(consultation.scheduled_for).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            consultation.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : consultation.status === 'upcoming'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {consultation.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Saved Remedies */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Saved Remedies</h2>
            <button className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          
          {savedRemedies.length === 0 ? (
            <p className="text-gray-500">No saved remedies.</p>
          ) : (
            <div className="space-y-4">
              {savedRemedies.map((remedy) => (
                <div key={remedy.id} className="flex items-start border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="p-2 rounded-full bg-blue-100 mr-4">
                    <Heart className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{remedy.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">For: {remedy.ailment.title}</p>
                    <p className="text-xs text-gray-500">
                      Saved: {new Date(remedy.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Recent Orders */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
            <button className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          
          {orders.length === 0 ? (
            <p className="text-gray-500">No recent orders.</p>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                        <div className="text-xs text-gray-500">{order.items_count} items</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : order.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${order.total_amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Health Metrics */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Health Metrics</h2>
            <button className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          
          {healthReview ? (
            <div className="space-y-4">
              <div className="flex items-start border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <div className="p-2 rounded-full bg-purple-100 mr-4">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Overall Rating
                  </h3>
                  <p className="text-xs text-gray-900 font-medium mt-1">Value: {healthReview.overall_rating}%</p>
                  <p className="text-xs text-gray-500">
                    Recorded: {new Date(healthReview.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No health metrics recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
}
