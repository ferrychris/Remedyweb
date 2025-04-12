import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import toast from 'react-hot-toast';
import { Heart, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

interface HealthReview {
  id: string;
  patient_id: string;
  consultant_id: string;
  overall_rating: number;
  mental_rating: number;
  physical_rating: number;
  nutrition_rating: number;
  notes: string;
  lab_results: any;
  next_review_date: string;
  created_at: string;
}

interface Consultant {
  id: string;
  full_name: string;
}

export function HealthTracking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<HealthReview[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<HealthReview | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [overallRating, setOverallRating] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchHealthReviews();
    fetchConsultants();
    fetchOverallRating();
  }, [user, navigate]);

  const fetchHealthReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('health_reviews')
        .select('*')
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      toast.error('Failed to load health reviews');
      console.error('Health reviews error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConsultants = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .eq('role', 'consultant');

      if (error) throw error;
      setConsultants(data || []);
    } catch (error) {
      console.error('Error fetching consultants:', error);
    }
  };

  const fetchOverallRating = async () => {
    try {
      const { data, error } = await supabase
        .from('health_reviews')
        .select('overall_rating, created_at')
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setOverallRating(data?.overall_rating || null);
    } catch (error) {
      console.error('Error fetching overall rating:', error);
    }
  };

  const getConsultantName = (consultantId: string) => {
    const consultant = consultants.find(c => c.id === consultantId);
    return consultant?.full_name || 'Unknown Consultant';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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

  const getRatingEmoji = (rating: number) => {
    if (rating >= 80) return '⭐️⭐️⭐️⭐️⭐️';
    if (rating >= 60) return '⭐️⭐️⭐️⭐️';
    if (rating >= 40) return '⭐️⭐️⭐️';
    return '⭐️⭐️';
  };

  const chartData = reviews.map(review => ({
    date: formatDate(review.created_at),
    overall: review.overall_rating,
    mental: review.mental_rating,
    physical: review.physical_rating,
    nutrition: review.nutrition_rating
  }));

  if (isLoading) {
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
        Health Reviews
      </h1>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        {/* Overall Health Score */}
        {overallRating !== null && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Overall Health Score</h3>
            <div className="bg-emerald-50 p-6 rounded-lg">
              <div className="flex flex-col items-center">
                <div className={`text-5xl font-bold ${getRatingColor(overallRating)} mb-2`}>
                  {overallRating}%
                </div>
                <div className="text-3xl mb-2">{getRatingEmoji(overallRating)}</div>
                <div className="text-lg text-gray-600">{getRatingLabel(overallRating)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Current Health Status */}
        {reviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Overall Health</h3>
              <div className="flex flex-col items-center">
                <div className={`text-4xl font-bold ${getRatingColor(reviews[0].overall_rating)} mb-2`}>
                  {reviews[0].overall_rating}%
                </div>
                <div className="text-2xl mb-1">{getRatingEmoji(reviews[0].overall_rating)}</div>
                <div className="text-sm text-gray-500">{getRatingLabel(reviews[0].overall_rating)}</div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Mental Health</h3>
              <div className="flex flex-col items-center">
                <div className={`text-4xl font-bold ${getRatingColor(reviews[0].mental_rating)} mb-2`}>
                  {reviews[0].mental_rating}%
                </div>
                <div className="text-2xl mb-1">{getRatingEmoji(reviews[0].mental_rating)}</div>
                <div className="text-sm text-gray-500">{getRatingLabel(reviews[0].mental_rating)}</div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Physical Health</h3>
              <div className="flex flex-col items-center">
                <div className={`text-4xl font-bold ${getRatingColor(reviews[0].physical_rating)} mb-2`}>
                  {reviews[0].physical_rating}%
                </div>
                <div className="text-2xl mb-1">{getRatingEmoji(reviews[0].physical_rating)}</div>
                <div className="text-sm text-gray-500">{getRatingLabel(reviews[0].physical_rating)}</div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Nutrition</h3>
              <div className="flex flex-col items-center">
                <div className={`text-4xl font-bold ${getRatingColor(reviews[0].nutrition_rating)} mb-2`}>
                  {reviews[0].nutrition_rating}%
                </div>
                <div className="text-2xl mb-1">{getRatingEmoji(reviews[0].nutrition_rating)}</div>
                <div className="text-sm text-gray-500">{getRatingLabel(reviews[0].nutrition_rating)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Health Progress Chart */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Rating History</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'Rating']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line type="monotone" dataKey="overall" stroke="#10B981" name="Overall" />
                <Line type="monotone" dataKey="mental" stroke="#6366F1" name="Mental" />
                <Line type="monotone" dataKey="physical" stroke="#F59E0B" name="Physical" />
                <Line type="monotone" dataKey="nutrition" stroke="#EC4899" name="Nutrition" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div 
              key={review.id}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedReview(review);
                setIsModalOpen(true);
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {formatDate(review.created_at)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {getConsultantName(review.consultant_id)}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <div className={`text-3xl font-bold ${getRatingColor(review.overall_rating)}`}>
                    {review.overall_rating}%
                  </div>
                  <div className="text-xl mb-1">{getRatingEmoji(review.overall_rating)}</div>
                  <span className="text-sm text-gray-500">{getRatingLabel(review.overall_rating)}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Mental Health</span>
                  <div className="flex items-center">
                    <span className={`font-medium ${getRatingColor(review.mental_rating)} mr-2`}>
                      {review.mental_rating}%
                    </span>
                    <span className="text-sm mr-2">{getRatingEmoji(review.mental_rating)}</span>
                    <div className="w-16 h-2 bg-gray-200 rounded-full">
                      <div 
                        className={`h-full rounded-full ${getRatingColor(review.mental_rating).replace('text', 'bg')}`}
                        style={{ width: `${review.mental_rating}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Physical Health</span>
                  <div className="flex items-center">
                    <span className={`font-medium ${getRatingColor(review.physical_rating)} mr-2`}>
                      {review.physical_rating}%
                    </span>
                    <span className="text-sm mr-2">{getRatingEmoji(review.physical_rating)}</span>
                    <div className="w-16 h-2 bg-gray-200 rounded-full">
                      <div 
                        className={`h-full rounded-full ${getRatingColor(review.physical_rating).replace('text', 'bg')}`}
                        style={{ width: `${review.physical_rating}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Nutrition</span>
                  <div className="flex items-center">
                    <span className={`font-medium ${getRatingColor(review.nutrition_rating)} mr-2`}>
                      {review.nutrition_rating}%
                    </span>
                    <span className="text-sm mr-2">{getRatingEmoji(review.nutrition_rating)}</span>
                    <div className="w-16 h-2 bg-gray-200 rounded-full">
                      <div 
                        className={`h-full rounded-full ${getRatingColor(review.nutrition_rating).replace('text', 'bg')}`}
                        style={{ width: `${review.nutrition_rating}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review Details Modal */}
      {selectedReview && isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Health Review Details
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Consultation Details
                </h3>
                <p className="text-gray-600">
                  Date: {formatDate(selectedReview.created_at)}
                </p>
                <p className="text-gray-600">
                  Consultant: {getConsultantName(selectedReview.consultant_id)}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Health Ratings
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600">Overall Health</p>
                    <p className={`text-3xl font-bold ${getRatingColor(selectedReview.overall_rating)}`}>
                      {selectedReview.overall_rating}%
                    </p>
                    <p className="text-xl mb-1">{getRatingEmoji(selectedReview.overall_rating)}</p>
                    <p className="text-sm text-gray-500">{getRatingLabel(selectedReview.overall_rating)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600">Mental Health</p>
                    <p className={`text-3xl font-bold ${getRatingColor(selectedReview.mental_rating)}`}>
                      {selectedReview.mental_rating}%
                    </p>
                    <p className="text-xl mb-1">{getRatingEmoji(selectedReview.mental_rating)}</p>
                    <p className="text-sm text-gray-500">{getRatingLabel(selectedReview.mental_rating)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600">Physical Health</p>
                    <p className={`text-3xl font-bold ${getRatingColor(selectedReview.physical_rating)}`}>
                      {selectedReview.physical_rating}%
                    </p>
                    <p className="text-xl mb-1">{getRatingEmoji(selectedReview.physical_rating)}</p>
                    <p className="text-sm text-gray-500">{getRatingLabel(selectedReview.physical_rating)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600">Nutrition</p>
                    <p className={`text-3xl font-bold ${getRatingColor(selectedReview.nutrition_rating)}`}>
                      {selectedReview.nutrition_rating}%
                    </p>
                    <p className="text-xl mb-1">{getRatingEmoji(selectedReview.nutrition_rating)}</p>
                    <p className="text-sm text-gray-500">{getRatingLabel(selectedReview.nutrition_rating)}</p>
                  </div>
                </div>
              </div>

              {selectedReview.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Notes
                  </h3>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {selectedReview.notes}
                  </p>
                </div>
              )}

              {selectedReview.next_review_date && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Next Review
                  </h3>
                  <p className="text-gray-600">
                    {formatDate(selectedReview.next_review_date)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}