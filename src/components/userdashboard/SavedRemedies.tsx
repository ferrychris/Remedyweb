import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import toast from 'react-hot-toast';
import { Heart, Clock, Bookmark, Trash2 } from 'lucide-react';

interface Remedy {
  id: number;
  title: string;
  description: string;
  slug: string;
  ingredients: string[];
  preparation: string;
  ailments: string[];
}

interface SavedRemedy {
  id: string;
  remedy_id: string;
  created_at: string;
  remedies: Remedy;
}

export function SavedRemedies() {
  const { user } = useAuth();
  const [savedRemedies, setSavedRemedies] = useState<SavedRemedy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSavedRemedies();
    }
  }, [user]);

  const fetchSavedRemedies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('saved_remedies')
        .select(`
          id,
          remedy_id,
          created_at,
          remedies (
            id,
            title,
            description,
            slug,
            ingredients,
            preparation,
            ailments
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = data.map(item => ({
        id: item.id,
        remedy_id: item.remedy_id,
        created_at: item.created_at,
        remedies: Array.isArray(item.remedies) ? item.remedies[0] : item.remedies
      })) as SavedRemedy[];
      
      setSavedRemedies(transformedData);
    } catch (err: any) {
      console.error('Error fetching saved remedies:', err);
      setError(err.message);
      toast.error('Failed to load saved remedies');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (remedyId: string) => {
    try {
      const { error } = await supabase
        .from('saved_remedies')
        .delete()
        .eq('user_id', user?.id)
        .eq('remedy_id', remedyId);

      if (error) throw error;

      setSavedRemedies(prev => prev.filter(item => item.remedy_id !== remedyId));
      toast.success('Remedy unsaved successfully');
    } catch (err: any) {
      console.error('Error unsaving remedy:', err);
      toast.error('Failed to unsave remedy');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Saved Remedies</h2>
            <p className="mt-1 text-gray-600">Your collection of saved health remedies</p>
          </div>
          <div className="flex items-center space-x-2">
            <Bookmark className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-medium text-gray-700">{savedRemedies.length} saved</span>
          </div>
        </div>
      </div>

      {/* Remedies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedRemedies.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Heart className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No saved remedies yet</h3>
            <p className="mt-1 text-gray-500">Save remedies to access them later</p>
            <Link
              to="/remedies"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
            >
              Browse Remedies
            </Link>
          </div>
        ) : (
          savedRemedies.map((saved) => (
            <div
              key={saved.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {saved.remedies.title}
                    </h3>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Saved {new Date(saved.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnsave(saved.remedy_id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                {saved.remedies.description && (
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                    {saved.remedies.description}
                  </p>
                )}

                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {saved.remedies.ailments.map((ailment, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {ailment}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-between items-center">
                  <Link
                    to={`/remedy/${saved.remedies.id}`}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    View Details
                  </Link>
                  <div className="text-sm text-gray-500">
                    {saved.remedies.ingredients.length} ingredients
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
