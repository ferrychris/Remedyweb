import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ThumbsUp, MessageSquare, AlertCircle, ArrowLeft, Loader2, Bookmark } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_profiles: {
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
  is_liked?: boolean;
  user_profiles: {
    display_name: string;
    avatar_url: string;
  };
}

function RemedyDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [remedy, setRemedy] = useState<Remedy | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingSave, setIsCheckingSave] = useState(true);

  const fetchRemedy = useCallback(async () => {
    if (!slug) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data: remedyData, error: remedyError } = await supabase
        .from('remedies')
        .select(`
          *,
          user_profiles (
            display_name,
            avatar_url
          )
        `)
        .eq('slug', slug)
        .single();

      if (remedyError) {
        throw remedyError;
      }

      if (remedyData) {
        setRemedy(remedyData);
        fetchComments(remedyData.id);

        if (user) {
          setIsCheckingSave(true);
          const { data: likeData, error: likeError } = await supabase
            .from('remedy_likes')
            .select('id')
            .eq('user_id', user.id)
            .eq('remedy_id', remedyData.id)
            .maybeSingle();

          if (likeError) console.error("Error checking like status:", likeError);
          else setRemedy(currentRemedy => currentRemedy ? { ...currentRemedy, is_liked: !!likeData } : null);

          const { data: saveData, error: saveError, count: saveCount } = await supabase
            .from('saved_remedies')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('remedy_id', remedyData.id);

          if (saveError) {
            console.error("Error checking save status:", saveError);
            setIsSaved(false);
          } else {
            setIsSaved(saveCount !== null && saveCount > 0);
          }
          setIsCheckingSave(false);
        } else {
          setRemedy(currentRemedy => currentRemedy ? { ...currentRemedy, is_liked: false } : null);
          setIsSaved(false);
          setIsCheckingSave(false);
        }
      } else {
        setError("Remedy not found.");
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load remedy');
      toast.error('Failed to load remedy');
      setIsCheckingSave(false);
    } finally {
      setIsLoading(false);
    }
  }, [slug, user]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchRemedy();
  }, [fetchRemedy]);

  const handleLike = async () => {
    if (!user) {
      toast.error('Please sign in to like remedies');
      navigate('/login');
      return;
    }
    if (!remedy) return;

    setIsLiking(true);
    const originalState = { is_liked: remedy.is_liked, likes_count: remedy.likes_count };

    try {
      const currentLikes = remedy.likes_count || 0;
      const newIsLiked = !remedy.is_liked;
      const newLikesCount = newIsLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
      
      setRemedy({
        ...remedy,
        is_liked: newIsLiked,
        likes_count: newLikesCount
      });

      if (newIsLiked) {
        const { error: likeError } = await supabase
          .from("remedy_likes")
          .insert({ user_id: user.id, remedy_id: remedy.id });
        if (likeError) throw likeError;

        const { error: incrementError } = await supabase.rpc('increment_remedy_likes', {
          p_remedy_id: remedy.id
        });
        if (incrementError) throw incrementError;

        toast.success("Added like!");
      } else {
        const { error: unlikeError } = await supabase
          .from("remedy_likes")
          .delete()
          .eq("user_id", user.id)
          .eq("remedy_id", remedy.id);
        if (unlikeError) throw unlikeError;

        const { error: decrementError } = await supabase.rpc('decrement_remedy_likes', {
          p_remedy_id: remedy.id
        });
        if (decrementError) throw decrementError;

        toast.success("Removed like");
      }
    } catch (error: any) {
      if (error?.code === '23505') {
        console.warn("Attempted to insert duplicate like:", error);
        toast.error("You've already liked this remedy.");
        setRemedy(prevRemedy => prevRemedy ? {
          ...prevRemedy, 
          is_liked: true,
          likes_count: originalState.likes_count
        } : null);
      } else {
        setRemedy(prevRemedy => prevRemedy ? {
          ...prevRemedy, 
          is_liked: originalState.is_liked,
          likes_count: originalState.likes_count
        } : null);
        console.error("Error handling like:", error);
        toast.error(error.message || 'Failed to update like');
      }
    } finally {
      setIsLiking(false);
    }
  };

  const fetchComments = async (remedyId: number) => {
    try {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from('remedy_comments')
        .select(`
          *,
          user_profiles!inner (
            display_name,
            avatar_url
          )
        `)
        .eq('remedy_id', remedyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to comment');
      navigate('/login');
      return;
    }
    if (!remedy || !newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const optimisticComment: Comment = {
        id: Date.now().toString(),
        content: newComment,
        created_at: new Date().toISOString(),
        user_id: user.id,
        user_profiles: {
          display_name: user.user_metadata.display_name || 'Anonymous',
          avatar_url: user.user_metadata.avatar_url || '/default-avatar.png'
        }
      };

      setComments([optimisticComment, ...comments]);
      setNewComment('');

      const { error: commentError } = await supabase
        .from('remedy_comments')
        .insert({
          remedy_id: remedy.id,
          user_id: user.id,
          content: optimisticComment.content
        });

      if (commentError) throw commentError;

      const { error: updateError } = await supabase
        .from('remedies')
        .update({ comments_count: (remedy.comments_count || 0) + 1 })
        .eq('id', remedy.id);

      if (updateError) throw updateError;

      setRemedy({
        ...remedy,
        comments_count: (remedy.comments_count || 0) + 1
      });

      fetchComments(remedy.id);
      toast.success('Comment added successfully!');
    } catch (error: any) {
      setComments(comments);
      setNewComment(newComment);
      toast.error(error.message || 'Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Please sign in to save remedies');
      navigate('/login');
      return;
    }
    if (!remedy || isSaving) return;

    setIsSaving(true);
    const currentlySaved = isSaved;

    setIsSaved(!currentlySaved);

    try {
      if (!currentlySaved) {
        const { error } = await supabase
          .from('saved_remedies')
          .insert({
            user_id: user.id,
            remedy_id: remedy.id
          });

        if (error) {
          if (error.code === '23505') {
            console.warn("Attempted to save an already saved remedy (duplicate key).");
            toast.error("Remedy is already saved.");
          } else {
            throw error;
          }
        } else {
          toast.success('Remedy saved!');
        }
      } else {
        const { error } = await supabase
          .from('saved_remedies')
          .delete()
          .eq('user_id', user.id)
          .eq('remedy_id', remedy.id);

        if (error) throw error;
        toast.success('Remedy unsaved.');
      }
    } catch (error: any) {
      setIsSaved(currentlySaved);
      console.error("Error saving/unsaving remedy:", error);
      toast.error(error.message || 'Failed to update saved status.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      </div>
    );
  }

  if (error || !remedy) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center mb-8">
          <Link to="/remedies" className="text-emerald-600 hover:text-emerald-700 flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Remedies
          </Link>
        </div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl p-8 shadow-sm"
        >
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Error Loading Remedy</h1>
          </div>
          <p className="text-gray-600">{error || "The remedy you're looking for doesn't exist."}</p>
          <button
            onClick={fetchRemedy}
            className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center">
        <Link to="/remedies" className="text-emerald-600 hover:text-emerald-700 flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Remedies
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-8 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">{remedy.title}</h1>
          {remedy.user_profiles && (
            <div className="flex items-center gap-3">
              <img
                src={remedy.user_profiles.avatar_url || '/default-avatar.png'}
                alt={remedy.user_profiles.display_name}
                className="w-8 h-8 rounded-full"
              />
              <div className="text-right">
                <div className="text-sm text-gray-600">Posted by</div>
                <div className="font-medium text-gray-900">{remedy.user_profiles.display_name}</div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-6 text-gray-600 mb-6">
          <button
            onClick={handleLike}
            disabled={isLiking || !user}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              remedy.is_liked
                ? 'bg-emerald-100 text-emerald-700'
                : 'hover:bg-gray-100'
            } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ThumbsUp className={`h-5 w-5 ${remedy.is_liked ? 'fill-current' : ''}`} />
            <span>{remedy.likes_count || 0} likes</span>
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-lg">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            <span className="text-emerald-700">{remedy.comments_count || 0} comments</span>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || isCheckingSave || !user}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isSaved
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-gray-100'
            } ${!user || isCheckingSave ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
            <span>{isSaving ? 'Saving...' : (isSaved ? 'Saved' : 'Save')}</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {remedy.ailments.map((ailment: string) => (
            <span 
              key={ailment}
              className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm"
            >
              {ailment}
            </span>
          ))}
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Description</h2>
            <p className="text-gray-600">{remedy.description}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Ingredients</h2>
            <div className="prose prose-emerald">
              {remedy.ingredients}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Preparation</h2>
            <div className="prose prose-emerald">
              {remedy.preparation}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Comments</h2>
            
            {user ? (
              <form onSubmit={handleAddComment} className="mb-8">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-all duration-200"
                  rows={3}
                  required
                  disabled={isSubmittingComment}
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newComment.trim()}
                  className={`mt-2 px-6 py-2 bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-2
                    ${isSubmittingComment || !newComment.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-600'}`}
                >
                  {isSubmittingComment ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    'Post Comment'
                  )}
                </button>
              </form>
            ) : (
              <div className="mb-8 p-4 bg-gray-50 rounded-xl text-gray-600 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>Please <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">sign in</Link> to comment</span>
              </div>
            )}

            {loadingComments ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {comments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-gray-50 p-4 rounded-xl"
                    >
                      <div className="flex items-center mb-2">
                        <img
                          src={comment.user_profiles.avatar_url || '/default-avatar.png'}
                          alt={comment.user_profiles.display_name}
                          className="w-8 h-8 rounded-full mr-2"
                        />
                        <div>
                          <span className="font-medium">{comment.user_profiles.display_name}</span>
                          <span className="text-gray-500 text-sm ml-2">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>
        </div>
      </motion.div>
    </div>
  );
}

export default RemedyDetail;