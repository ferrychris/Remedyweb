import  { useState, useEffect } from 'react';

import { Link, useNavigate } from 'react-router-dom';
import { ThumbsUp, MessageSquare, Search, Plus, Loader2, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_profile: {
    display_name: string;
    avatar_url: string;
  };
}

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
  is_liked?: boolean;
  user_profile?: {
    id: string;
    display_name: string;
    avatar_url: string;
    created_at: string;
    updated_at: string;
  };
  comments?: Comment[];
}

function Remedies() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAilment, setSelectedAilment] = useState('all');
  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [loading, setLoading] = useState(true);
  const [likingIds, setLikingIds] = useState<number[]>([]);
  const [commentingIds, setCommentingIds] = useState<number[]>([]);
  const [newComments, setNewComments] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchRemedies();
  }, []);

  const handleLike = async (remedyId: number) => {
    if (!user) {
      toast.error("Please sign in to like remedies");
      navigate('/login');
      return;
    }
    
    if (likingIds.includes(remedyId)) return;
    
    const remedyToUpdate = remedies.find(r => r.id === remedyId);
    if (!remedyToUpdate) return;
    
    setLikingIds(prev => [...prev, remedyId]);
    
    const isCurrentlyLiked = remedyToUpdate.is_liked || false;
    const updatedRemedies = remedies.map(r => 
      r.id === remedyId 
        ? { 
            ...r, 
            is_liked: !isCurrentlyLiked,
            likes_count: isCurrentlyLiked 
              ? Math.max(0, (r.likes_count || 0) - 1) 
              : (r.likes_count || 0) + 1
          } 
        : r
    );
    setRemedies(updatedRemedies);
  
    try {
      if (isCurrentlyLiked) {
        const { error: unlikeError } = await supabase
          .from("remedy_likes")
          .delete()
          .eq("user_id", user.id)
          .eq("remedy_id", remedyId);
  
        if (unlikeError) throw unlikeError;
      } else {
        const { error: likeError } = await supabase
          .from("remedy_likes")
          .insert({
            user_id: user.id,
            remedy_id: remedyId,
          });
    
        if (likeError) throw likeError;
      }
    } catch (error) {
      console.error("Error handling like:", error);
      toast.error("Failed to update like");
      setRemedies(prevRemedies => prevRemedies.map(r => 
        r.id === remedyId ? { ...remedyToUpdate } : r
      ));
    } finally {
      setLikingIds(prev => prev.filter(id => id !== remedyId));
    }
  };

  const handleComment = async (remedyId: number) => {
    if (!user) {
      toast.error("Please sign in to comment");
      navigate('/login');
      return;
    }

    const commentContent = newComments[remedyId]?.trim();
    if (!commentContent) {
      toast.error("Comment cannot be empty");
      return;
    }

    if (commentingIds.includes(remedyId)) return;
    setCommentingIds(prev => [...prev, remedyId]);

    try {
      const { data: comment, error } = await supabase
        .from('remedy_comments')
        .insert({
          remedy_id: remedyId,
          user_id: user.id,
          content: commentContent,
        })
        .select(`
          *,
          user_profile:user_id (
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Update the remedies state with the new comment
      setRemedies(prevRemedies => prevRemedies.map(remedy => {
        if (remedy.id === remedyId) {
          return {
            ...remedy,
            comments_count: (remedy.comments_count || 0) + 1,
            comments: [
              ...(remedy.comments || []),
              {
                id: comment.id,
                content: comment.content,
                created_at: comment.created_at,
                user_id: comment.user_id,
                user_profile: comment.user_profile
              }
            ]
          };
        }
        return remedy;
      }));

      // Clear the comment input
      setNewComments(prev => ({ ...prev, [remedyId]: '' }));
      toast.success("Comment added successfully");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setCommentingIds(prev => prev.filter(id => id !== remedyId));
    }
  };

  const fetchRemedies = async () => {
    try {
      setLoading(true);
      
      const { data: remediesData, error: remediesError } = await supabase
        .from('remedies')
        .select(`
          *,
          user_profile:user_id (
            id,
            display_name,
            avatar_url,
            created_at,
            updated_at
          ),
          comments:remedy_comments (
            id,
            content,
            created_at,
            user_id,
            user_profile:user_id (
              display_name,
              avatar_url
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (remediesError) throw remediesError;
      
      let enrichedRemedies = remediesData || [];
      
      if (user) {
        const { data: likedRemedies, error: likesError } = await supabase
          .from('remedy_likes')
          .select('remedy_id')
          .eq('user_id', user.id);
          
        if (likesError) {
          console.error('Error fetching liked remedies:', likesError);
        } else {
          const likedIds = new Set(likedRemedies?.map(like => like.remedy_id) || []);
          enrichedRemedies = enrichedRemedies.map(remedy => ({
            ...remedy,
            is_liked: likedIds.has(remedy.id)
          }));
        }
      }
      
      setRemedies(enrichedRemedies);
    } catch (error) {
      console.error('Error fetching remedies:', error);
      toast.error('Failed to load remedies');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString: string | undefined) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const allAilments = Array.from(
    new Set(remedies.flatMap(remedy => remedy.ailments))
  ).sort();

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Natural Remedies</h1>
        <div className="flex gap-4">
          <Link
            to="/remedies"
            className="inline-flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <Search className="h-5 w-5 mr-2" />
            Browse Remedies
          </Link>
          {user ? (
            <Link
              to="/submit-remedy"
              className="inline-flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Submit Remedy
            </Link>
          ) : (
            <button
              onClick={() => {
                toast.error("Please sign in to submit a remedy");
                navigate('/login');
              }}
              className="inline-flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Submit Remedy
            </button>
          )}
        </div>
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
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold text-gray-900 mr-2">
                        {remedy.title}
                      </h3>
                      {remedy.user_profile && (
                        <div className="flex items-center gap-2 text-right flex-shrink-0">
                          <div className="flex-shrink-0">
                            <span className="block text-sm text-gray-600 font-medium">
                              {remedy.user_profile.display_name}
                            </span>
                            <span className="block text-xs text-gray-400">
                              ID: {remedy.user_profile.id.substring(0, 8)}...
                            </span>
                            <span className="block text-xs text-gray-400">
                              Joined: {formatDate(remedy.user_profile.created_at)}
                            </span>
                          </div>
                          <img
                            src={remedy.user_profile.avatar_url || '/default-avatar.png'}
                            alt={remedy.user_profile.display_name}
                            className="w-8 h-8 rounded-full ml-2 flex-shrink-0"
                          />
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
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleLike(remedy.id)}
                      disabled={likingIds.includes(remedy.id)}
                      aria-label={remedy.is_liked ? "Unlike this remedy" : "Like this remedy"}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all duration-200 ${
                        remedy.is_liked ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-50 hover:bg-emerald-100'
                      } ${likingIds.includes(remedy.id) ? 'opacity-70 cursor-wait' : ''}`}
                    >
                      {likingIds.includes(remedy.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                      ) : (
                        <ThumbsUp 
                          className={`h-4 w-4 transition-all duration-200 ${
                            remedy.is_liked ? 'fill-emerald-600 text-emerald-600' : 'text-emerald-600'
                          }`} 
                        />
                      )}
                      <span className="text-sm text-emerald-700">
                        {remedy.likes_count || 0} {remedy.likes_count === 1 ? 'like' : 'likes'}
                      </span>
                    </motion.button>
                    <Link to={`/remedies/${remedy.slug}`} className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                      <MessageSquare className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm text-emerald-700">{remedy.comments_count || 0} comments</span>
                    </Link>
                  </div>

                  {/* Comments Section */}
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newComments[remedy.id] || ''}
                        onChange={(e) => setNewComments(prev => ({
                          ...prev,
                          [remedy.id]: e.target.value
                        }))}
                        placeholder="Add a comment..."
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        onClick={() => handleComment(remedy.id)}
                        disabled={commentingIds.includes(remedy.id)}
                        className="p-2 text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                      >
                        {commentingIds.includes(remedy.id) ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    {remedy.comments && remedy.comments.length > 0 && (
                      <div className="space-y-3">
                        {remedy.comments.slice(0, 2).map((comment) => (
                          <div key={comment.id} className="flex items-start gap-3">
                            <img
                              src={comment.user_profile.avatar_url || '/default-avatar.png'}
                              alt={comment.user_profile.display_name}
                              className="w-8 h-8 rounded-full"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {comment.user_profile.display_name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mt-1">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))}
                        {remedy.comments.length > 2 && (
                          <Link
                            to={`/remedies/${remedy.slug}`}
                            className="block text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            View all {remedy.comments.length} comments
                          </Link>
                        )}
                      </div>
                    )}
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