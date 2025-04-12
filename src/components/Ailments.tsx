import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Ailment {
  title: string;
  description: string;
  category: string;
}

function Ailments() {
  const [ailments, setAilments] = useState<Ailment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAilments();
  }, []);

  const fetchAilments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ailments')
        .select('title, description, category')
        .order('title');

      if (error) throw error;

      // Group ailments by category
      const groupedAilments = data.reduce((acc: { [key: string]: Ailment[] }, ailment) => {
        const category = ailment.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(ailment);
        return acc;
      }, {});

      setAilments(data);
    } catch (err) {
      console.error('Error fetching ailments:', err);
      setError('Failed to load ailments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-t-2 border-emerald-500 rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchAilments}
          className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <Activity className="h-8 w-8 text-emerald-600" />
        <h1 className="text-3xl font-bold text-gray-800">Common Ailments</h1>
      </div>

      <p className="text-gray-600 max-w-3xl">
        Browse through common health conditions and discover natural remedies that may help provide relief. 
        Always consult with a healthcare provider before trying any new treatment.
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Object.entries(
          ailments.reduce((acc: { [key: string]: Ailment[] }, ailment) => {
            const category = ailment.category || 'Uncategorized';
            if (!acc[category]) {
              acc[category] = [];
            }
            acc[category].push(ailment);
            return acc;
          }, {})
        ).map(([category, categoryAilments]) => (
          <div key={category} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{category}</h2>
            <div className="space-y-3">
              {categoryAilments.map((ailment) => (
                <Link
                  key={ailment.title}
                  to={`/ailments/${ailment.title}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  <span className="text-gray-700">{ailment.title}</span>
                  <span className="text-xs text-gray-500 line-clamp-2 max-w-[200px]">
                    {ailment.description}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Ailments;