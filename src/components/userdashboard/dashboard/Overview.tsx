import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import { Calendar, Heart, Activity, ShoppingBag, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Consultation {
  id: number;
  scheduled_for: string;
  status: string;
  consultant: {
    name: string;
    specialty: string;
  } | null;
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
}

interface SavedRemedy {
  id: number;
  title: string;
  created_at: string;
  ailment: string;
}

interface ConsultationData {
  id: number;
  scheduled_for: string;
  status: string;
  consultants: {
    name: string;
    specialty: string;
  } | null;
}

interface SavedRemedyData {
  id: number;
  created_at: string;
  remedies: {
    title: string;
    ailment: string;
  } | null;
}

interface OrderData {
  id: number;
  created_at: string;
  status: string;
  total: number;
}

export function Overview() {
  const { user, profile } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [healthReview, setHealthReview] = useState<HealthReview | null>(null);
  const [savedRemedies, setSavedRemedies] = useState<SavedRemedy[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch recent consultations
        const { data: consultationsData, error: consultationsError } = await supabase
          .from('consultations')
          .select(`
            id,
            scheduled_for,
            status,
            consultants (
              name,
              specialty
            )
          `)
          .eq('user_id', user.id)
          .order('scheduled_for', { ascending: false })
          .limit(3);

        if (consultationsError) throw consultationsError;
        
        // Transform the data to match our interface
        const processedConsultations = (consultationsData || []).map(consultation => {
          const consultant = Array.isArray(consultation.consultants) && consultation.consultants.length > 0
            ? consultation.consultants[0]
            : null;

          return {
            id: consultation.id,
            scheduled_for: consultation.scheduled_for,
            status: consultation.status,
            consultant: consultant ? {
              name: consultant.name,
              specialty: consultant.specialty
            } : null
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
          .from('saved_remedies')
          .select(`
            id,
            created_at,
            remedies (
              title,
              ailment
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (remediesError) throw remediesError;

        // Transform saved remedies data
        const processedRemedies = (remediesData || []).map(remedy => {
          const remedyData = Array.isArray(remedy.remedies) && remedy.remedies.length > 0
            ? remedy.remedies[0]
            : null;

          return {
            id: remedy.id,
            title: remedyData?.title || 'Unknown Remedy',
            created_at: remedy.created_at,
            ailment: remedyData?.ailment || 'Unknown Ailment'
          };
        });

        setSavedRemedies(processedRemedies);

        // Fetch recent orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('id, created_at, status, total')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (ordersError) throw ordersError;

        // Transform orders data
        const processedOrders = (ordersData || []).map(order => ({
          id: order.id,
          created_at: order.created_at,
          status: order.status,
          total_amount: order.total
        }));

        setOrders(processedOrders);
      } catch (error) {
        console.error('Error fetching overview data:', error);
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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-800">Welcome back, {profile?.display_name || 'Patient'}!</h2>
        <p className="mt-2 text-gray-600">Here's an overview of your health journey and recent activities.</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-emerald-100 mr-4">
              <Calendar className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Consultations</p>
              <p className="text-2xl font-bold text-gray-800">{consultations.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <Heart className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Saved Remedies</p>
              <p className="text-2xl font-bold text-gray-800">{savedRemedies.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
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
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 mr-4">
              <ShoppingBag className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Consultations */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Recent Consultations</h2>
            <Link to="/ndashboard/consultations" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          {consultations.length === 0 ? (
            <p className="text-gray-500">No recent consultations.</p>
          ) : (
            <div className="space-y-4">
              {consultations.map((consultation) => (
                <div key={consultation.id} className="flex items-start border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="p-2 rounded-full bg-emerald-100 mr-4">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {consultation.consultant?.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(consultation.scheduled_for).toLocaleDateString()} - {consultation.status}
                    </p>
                    <p className="text-xs text-gray-500">
                      {consultation.consultant?.specialty}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Saved Remedies */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Saved Remedies</h2>
            <Link to="/ndashboard/saved-remedies" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
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
                    <p className="text-xs text-gray-500 mt-1">For: {remedy.ailment}</p>
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
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
            <Link to="/ndashboard/orders" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          {orders.length === 0 ? (
            <p className="text-gray-500">No recent orders.</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="flex items-start border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="p-2 rounded-full bg-orange-100 mr-4">
                    <ShoppingBag className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Order #{order.id}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(order.created_at).toLocaleDateString()} - {order.status}
                    </p>
                    <p className="text-xs text-gray-500">
                      Total: ${order.total_amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Health Metrics */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Health Metrics</h2>
            <Link to="/ndashboard/health-metrics" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
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