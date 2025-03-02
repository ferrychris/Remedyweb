import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ThumbsUp, MessageSquare, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  profiles: {
    display_name: string;
    avatar_url: string;
  };
}

function RemedyDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [remedy, setRemedy] = useState<any>(null);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    fetchRemedy();
  }, [slug]); // Re-run when slug changes

  const fetchRemedy = async () => {
    if (!slug) return;
    const { data } = await supabase
      .from('remedies')
      .select('*')
      .eq('slug', slug)
      .single();
    setRemedy(data);
    if (data) {
      fetchComments(data.id);
    }
  };

  const fetchComments = async (remedyId: string) => {
    try {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from('remedy_comments')
        .select(`
          *,
          profiles:user_id (
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
    } finally {
      setLoadingComments(false);
    }
  };
  
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }
    if (!remedy) return;
  
    try {
      const { error } = await supabase.from('remedy_comments').insert({
        remedy_id: remedy.id,
        user_id: user.id,
        comment: newComment
      });
  
      if (error) throw error;
  
      setNewComment('');
      fetchComments(remedy.id); // Refresh comments
      toast.success('Comment added successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add comment');
    }
  };

  if (!remedy) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-2xl font-bold text-gray-800">Remedy not found</h1>
        <p className="mt-4 text-gray-600">The remedy you're looking for doesn't exist.</p>
        <Link to="/remedies" className="mt-4 inline-flex items-center text-green-600 hover:text-green-700">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Remedies
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center">
        <Link to="/remedies" className="text-green-600 hover:text-green-700 flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Remedies
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{remedy.title}</h1>
        
        <div className="flex items-center space-x-6 text-gray-600 mb-6">
          <div className="flex items-center space-x-1">
            <Star className="h-5 w-5 text-yellow-500" />
            <span>{remedy.rating}/5</span>
          </div>
          <div className="flex items-center space-x-1">
            <ThumbsUp className="h-5 w-5" />
            <span>{remedy.votes} votes</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageSquare className="h-5 w-5" />
            <span>{remedy.comments} comments</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {remedy.ailments.map((ailment: string) => (
            <span key={ailment} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              {ailment}
            </span>
          ))}
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Ingredients</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {remedy.ingredients.map((ingredient: string, index: number) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Instructions</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              {remedy.instructions.map((step: string, index: number) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Comments</h3>
  
              {user && (
                <form onSubmit={handleAddComment} className="mb-6">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    required
                  />
                  <button
                    type="submit"
                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Post Comment
                  </button>
                </form>
              )}
  
              {loadingComments ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <img
                          src={comment.profiles.avatar_url || '/default-avatar.png'}
                          alt={comment.profiles.display_name}
                          className="w-8 h-8 rounded-full mr-2"
                        />
                        <span className="font-medium">{comment.profiles.display_name}</span>
                        <span className="text-gray-500 text-sm ml-2">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 text-yellow-800 mb-2">
              <AlertCircle className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Important Notes</h2>
            </div>
            <ul className="list-disc list-inside space-y-2 text-yellow-800">
              {remedy.warnings.map((warning: string, index: number) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Disclaimer: This information is for educational purposes only and is not intended to diagnose, treat, cure, or prevent any disease. 
        Always consult with a qualified healthcare provider before starting any new treatment.
      </p>
    </div>
  );
}

export default RemedyDetail;