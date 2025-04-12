import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

const HealthMetrics = () => {
  const [reviews, setReviews] = useState<HealthReview[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<HealthReview | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchHealthReviews();
    fetchConsultants();
  }, []);

  const fetchHealthReviews = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('health_reviews')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error: any) {
      console.error('Error fetching health reviews:', error);
      toast.error('Failed to load health reviews');
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
    } catch (error: any) {
      console.error('Error fetching consultants:', error);
      toast.error('Failed to load consultants');
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

  const chartData = reviews.map(review => ({
    date: formatDate(review.created_at),
    overall: review.overall_rating,
    mental: review.mental_rating,
    physical: review.physical_rating,
    nutrition: review.nutrition_rating
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 winky-sans-heading">Health Ratings</h1>
        <p className="text-gray-600 winky-sans-body">Track your health progress over time</p>
      </div>

      {/* Current Health Status */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 winky-sans-heading mb-2">Overall Health</h3>
            <div className="flex items-center justify-between">
              <div className={`text-3xl font-bold ${getRatingColor(reviews[0].overall_rating)}`}>
                {reviews[0].overall_rating}%
              </div>
              <div className="text-sm text-gray-500">{getRatingLabel(reviews[0].overall_rating)}</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 winky-sans-heading mb-2">Mental Health</h3>
            <div className="flex items-center justify-between">
              <div className={`text-3xl font-bold ${getRatingColor(reviews[0].mental_rating)}`}>
                {reviews[0].mental_rating}%
              </div>
              <div className="text-sm text-gray-500">{getRatingLabel(reviews[0].mental_rating)}</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 winky-sans-heading mb-2">Physical Health</h3>
            <div className="flex items-center justify-between">
              <div className={`text-3xl font-bold ${getRatingColor(reviews[0].physical_rating)}`}>
                {reviews[0].physical_rating}%
              </div>
              <div className="text-sm text-gray-500">{getRatingLabel(reviews[0].physical_rating)}</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 winky-sans-heading mb-2">Nutrition</h3>
            <div className="flex items-center justify-between">
              <div className={`text-3xl font-bold ${getRatingColor(reviews[0].nutrition_rating)}`}>
                {reviews[0].nutrition_rating}%
              </div>
              <div className="text-sm text-gray-500">{getRatingLabel(reviews[0].nutrition_rating)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Health Progress Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h2 className="text-xl font-semibold text-gray-800 winky-sans-heading mb-4">Rating History</h2>
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
                <h3 className="text-lg font-semibold text-gray-800 winky-sans-heading">
                  {formatDate(review.created_at)}
                </h3>
                <p className="text-sm text-gray-600 winky-sans-body">
                  {getConsultantName(review.consultant_id)}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <div className={`text-2xl font-bold ${getRatingColor(review.overall_rating)}`}>
                  {review.overall_rating}%
                </div>
                <span className="text-sm text-gray-500">{getRatingLabel(review.overall_rating)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 winky-sans-body">Mental Health</span>
                <div className="flex items-center">
                  <span className={`font-medium ${getRatingColor(review.mental_rating)} mr-2`}>
                    {review.mental_rating}%
                  </span>
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div 
                      className={`h-full rounded-full ${getRatingColor(review.mental_rating).replace('text', 'bg')}`}
                      style={{ width: `${review.mental_rating}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 winky-sans-body">Physical Health</span>
                <div className="flex items-center">
                  <span className={`font-medium ${getRatingColor(review.physical_rating)} mr-2`}>
                    {review.physical_rating}%
                  </span>
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div 
                      className={`h-full rounded-full ${getRatingColor(review.physical_rating).replace('text', 'bg')}`}
                      style={{ width: `${review.physical_rating}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 winky-sans-body">Nutrition</span>
                <div className="flex items-center">
                  <span className={`font-medium ${getRatingColor(review.nutrition_rating)} mr-2`}>
                    {review.nutrition_rating}%
                  </span>
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

      {/* Review Details Modal */}
      {selectedReview && isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-800 winky-sans-heading">
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
                <h3 className="text-lg font-semibold text-gray-800 winky-sans-heading mb-2">
                  Consultation Details
                </h3>
                <p className="text-gray-600 winky-sans-body">
                  Date: {formatDate(selectedReview.created_at)}
                </p>
                <p className="text-gray-600 winky-sans-body">
                  Consultant: {getConsultantName(selectedReview.consultant_id)}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 winky-sans-heading mb-2">
                  Health Ratings
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600 winky-sans-body">Overall Health</p>
                    <p className={`text-2xl font-bold ${getRatingColor(selectedReview.overall_rating)}`}>
                      {selectedReview.overall_rating}%
                    </p>
                    <p className="text-sm text-gray-500">{getRatingLabel(selectedReview.overall_rating)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600 winky-sans-body">Mental Health</p>
                    <p className={`text-2xl font-bold ${getRatingColor(selectedReview.mental_rating)}`}>
                      {selectedReview.mental_rating}%
                    </p>
                    <p className="text-sm text-gray-500">{getRatingLabel(selectedReview.mental_rating)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600 winky-sans-body">Physical Health</p>
                    <p className={`text-2xl font-bold ${getRatingColor(selectedReview.physical_rating)}`}>
                      {selectedReview.physical_rating}%
                    </p>
                    <p className="text-sm text-gray-500">{getRatingLabel(selectedReview.physical_rating)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600 winky-sans-body">Nutrition</p>
                    <p className={`text-2xl font-bold ${getRatingColor(selectedReview.nutrition_rating)}`}>
                      {selectedReview.nutrition_rating}%
                    </p>
                    <p className="text-sm text-gray-500">{getRatingLabel(selectedReview.nutrition_rating)}</p>
                  </div>
                </div>
              </div>

              {selectedReview.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 winky-sans-heading mb-2">
                    Notes
                  </h3>
                  <p className="text-gray-600 winky-sans-body whitespace-pre-wrap">
                    {selectedReview.notes}
                  </p>
                </div>
              )}

              {selectedReview.lab_results && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 winky-sans-heading mb-2">
                    Lab Results
                  </h3>
                  <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedReview.lab_results, null, 2)}
                  </pre>
                </div>
              )}

              {selectedReview.next_review_date && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 winky-sans-heading mb-2">
                    Next Review
                  </h3>
                  <p className="text-gray-600 winky-sans-body">
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
};

export default HealthMetrics; 