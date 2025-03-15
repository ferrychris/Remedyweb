import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThumbsUp, MessageSquare, Search, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Remedy {
  id: number;
  title: string;
  slug: string;
  ailments: string[];
  ingredients: string;
  preparation: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  description?: string;
  image?: string;
  profiles?: {
    display_name: string;
    avatar_url: string;
  };
}

function Remedies() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAilment, setSelectedAilment] = useState('all');
  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRemedies();
  }, [searchQuery, selectedAilment]);

  const handleLike = async (remedyId: number) => {
    if (!user) {
      toast.error("Please sign in to like remedies");
      navigate('/login');
      return;
    }
  
    try {
      // Check if the user has already liked this remedy
      const { data: existingLike, error: likeCheckError } = await supabase
        .from("remedy_likes")
        .select("*")
        .eq("user_id", user.id)
        .eq("remedy_id", remedyId)
        .single();
  
      if (existingLike) {
        // Unlike the remedy
        const { error: unlikeError } = await supabase
          .from("remedy_likes")
          .delete()
          .eq("user_id", user.id)
          .eq("remedy_id", remedyId);
  
        if (unlikeError) throw unlikeError;
  
        // Update likes count in remedies table
        const { error: updateError } = await supabase
          .from("remedies")
          .update({ likes_count: supabase.raw('likes_count - 1') })
          .eq("id", remedyId);
  
        if (updateError) throw updateError;
        toast.success("Removed like");
      } else {
        // Like the remedy
        const { error: likeError } = await supabase
          .from("remedy_likes")
          .insert({
            user_id: user.id,
            remedy_id: remedyId,
          });
    
        if (likeError) throw likeError;
    
        // Update likes count in remedies table
        const { error: updateError } = await supabase
          .from("remedies")
          .update({ likes_count: supabase.raw('likes_count + 1') })
          .eq("id", remedyId);
    
        if (updateError) throw updateError;
        toast.success("Added like!");
      }
      
      fetchRemedies(); // Refresh the list to show updated counts
    } catch (error) {
      console.error("Error handling like:", error);
      toast.error("Failed to update like");
    }
  };

  const fetchRemedies = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('remedies')
        .select(`
          *,
          profiles (
            display_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      if (selectedAilment !== 'all') {
        query = query.contains('ailments', [selectedAilment]);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRemedies(data || []);
    } catch (error) {
      console.error('Error fetching remedies:', error);
      toast.error('Failed to load remedies');
    } finally {
      setLoading(false);
    }
  };

  const allAilments = Array.from(
    new Set(remedies.flatMap(remedy => remedy.ailments))
  ).sort();

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Natural Remedies</h1>
        <Link
          to={user ? "/submit-remedy" : "/login"}
          className="inline-flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          onClick={(e) => {
            if (!user) {
              e.preventDefault();
              toast.error("Please sign in to submit a remedy");
              navigate('/login');
            }
          }}
        >
          <Plus className="h-5 w-5 mr-2" />
          Submit Remedy
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search remedies..."
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-100 rounded-xl focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
            />
          </div>
        </div>
        <div className="w-full md:w-64">
          <select
            value={selectedAilment}
            onChange={(e) => setSelectedAilment(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-100 rounded-xl focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
          >
            <option value="all">All Ailments</option>
            {allAilments.map(ailment => (
              <option key={ailment} value={ailment}>
                {ailment}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {remedies.map((remedy) => (
              <motion.div
                key={remedy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <Link to={`/remedies/${remedy.slug}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {remedy.title}
                      </h3>
                      {remedy.profiles && (
                        <div className="flex items-center gap-2">
                          <img
                            src={remedy.profiles.avatar_url || '/default-avatar.png'}
                            alt={remedy.profiles.display_name}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-sm text-gray-600">
                            {remedy.profiles.display_name}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {remedy.ailments.map((ailment) => (
                      <span
                        key={ailment}
                        className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm"
                      >
                        {ailment}
                      </span>
                    ))}
                  </div>
                  {remedy.description && (
                    <p className="mt-4 text-gray-600 line-clamp-3">
                      {remedy.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleLike(remedy.id)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <ThumbsUp className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm text-emerald-700">{remedy.likes_count || 0} likes</span>
                    </button>
                    <Link to={`/remedies/${remedy.slug}`} className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                      <MessageSquare className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm text-emerald-700">{remedy.comments_count || 0} comments</span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default Remedies;