import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import AddRemedyModal from './AddRemedyModal';
import { User, Settings, Bell, HelpCircle } from 'lucide-react';

// Define type for a remedy
interface Remedy {
  id: number | string;
  title: string; // Changed from name to title
  slug: string;
  ailments: string[];
  ingredients: string[];
  preparation: string;
  description: string;
  created_at: string;
  is_approved: boolean;
  status: string;
}

// Define type for the new remedy data from the modal
interface NewRemedySubmitData {
  title: string;
  ailmentId: string;
  description: string;
  ingredients: string;
  preparation: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

const SavedRemedies = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const fetchRemedies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('remedies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching remedies:', error);
        toast.error('Failed to load remedies');
        return;
      }

      if (data) {
        setRemedies(data);
      }
    } catch (error: any) {
      console.error('Error in fetchRemedies:', error);
      toast.error('Failed to load remedies');
    }
  };

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setUserProfile(data);
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load profile');
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchRemedies();
  }, []);

  const handleAddRemedy = async (newRemedyData: NewRemedySubmitData) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Generate a slug from the title
      const slug = newRemedyData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Ensure ingredients is an array
      const ingredientsArray = newRemedyData.ingredients
        .split(',')
        .map(i => i.trim())
        .filter(i => i.length > 0);

      const { error } = await supabase
        .from('remedies')
        .insert({
          title: newRemedyData.title,
          slug: slug,
          ailments: [newRemedyData.ailmentId],
          ingredients: ingredientsArray,
          preparation: newRemedyData.preparation,
          description: newRemedyData.description,
          user_id: user.id
        });

      if (error) {
        console.error('Error adding remedy:', error);
        toast.error(`Failed to add remedy: ${error.message}`);
        return;
      }

      toast.success('Remedy added successfully!');
      setIsModalOpen(false);
      // Refresh the remedies list
      fetchRemedies();
    } catch (error: any) {
      console.error('Error in handleAddRemedy:', error);
      toast.error(`Failed to add remedy: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get animation delay for each card
  const getAnimationDelay = (index: number) => {
    return `${index * 2}s`; // Different delays for each card
  };

  return (
    <div className="p-8 font-sans">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap');
          
          @keyframes pulse-zoom {
            0% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.02);
            }
            100% {
              transform: scale(1);
            }
          }
          .remedy-card {
            animation: pulse-zoom 8s infinite;
            animation-timing-function: ease-in-out;
          }
          
          .winky-sans {
            font-family: 'Quicksand', sans-serif;
          }
          
          .winky-sans-heading {
            font-family: 'Quicksand', sans-serif;
            font-weight: 700;
            letter-spacing: -0.5px;
          }
          
          .winky-sans-body {
            font-family: 'Quicksand', sans-serif;
            font-weight: 400;
          }
        `}
      </style>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 winky-sans-heading">Remedies</h1>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-500 text-white py-2 px-4 rounded-lg hover:bg-emerald-600 disabled:opacity-50 winky-sans"
            disabled={isLoading}
          >
            {isLoading ? 'Adding...' : 'Add Remedy'}
          </button>
          
          {/* Profile Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              {userProfile?.avatar_url ? (
                <img 
                  src={userProfile.avatar_url} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
              )}
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 winky-sans-heading">
                    {userProfile?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 winky-sans-body">
                    {userProfile?.email}
                  </p>
                </div>
                
                <div className="py-1">
                  <Link
                    to="/ndashboard/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 winky-sans"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Account Settings
                  </Link>
                  <Link
                    to="/ndashboard/notifications"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 winky-sans"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                  </Link>
                  <Link
                    to="/ndashboard/help"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 winky-sans"
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Help & Support
                  </Link>
                </div>

                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      window.location.href = '/login';
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 winky-sans"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="remedy-card bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 winky-sans-heading">Total Remedies</h2>
          <p className="text-gray-600 winky-sans-body">{remedies.length} Available</p>
        </div>
        <div className="remedy-card bg-white p-6 rounded-lg shadow-sm" style={{ animationDelay: '2s' }}>
          <h2 className="text-xl font-bold text-gray-800 winky-sans-heading">Most Liked</h2>
          <p className="text-gray-600 winky-sans-body">0 Likes</p>
        </div>
        <div className="remedy-card bg-white p-6 rounded-lg shadow-sm" style={{ animationDelay: '4s' }}>
          <h2 className="text-xl font-bold text-gray-800 winky-sans-heading">Comments</h2>
          <p className="text-gray-600 winky-sans-body">0 Total discussions</p>
        </div>
        <div className="remedy-card bg-white p-6 rounded-lg shadow-sm" style={{ animationDelay: '6s' }}>
          <h2 className="text-xl font-bold text-gray-800 winky-sans-heading">Recent</h2>
          <p className="text-gray-600 winky-sans-body">0 Last 7 days</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {remedies.map((remedy, index) => (
          <div 
            key={remedy.id} 
            className="remedy-card bg-white p-6 rounded-lg shadow-sm transition-all hover:shadow-md relative"
            style={{ animationDelay: getAnimationDelay(index) }}
          >
            {!remedy.is_approved && (
              <div className="absolute top-0 left-0 right-0 bg-yellow-50 border-b border-yellow-200 p-2">
                <div className="flex items-center justify-center">
                  <span className="text-yellow-800 text-sm font-medium flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Not Approved
                  </span>
                </div>
              </div>
            )}
            <div className={!remedy.is_approved ? "mt-8" : ""}>
              <h3 className="text-lg font-semibold text-gray-700 winky-sans-heading">{remedy.title}</h3>
              <p className="text-gray-600 winky-sans-body">{new Date(remedy.created_at).toLocaleDateString()}</p>
              <p className="text-gray-600 winky-sans-body">{remedy.description}</p>
              <div className="flex justify-between items-center mt-4">
                <div className="flex space-x-4">
                  <span className="text-gray-600 winky-sans-body">
                    Ingredients: {Array.isArray(remedy.ingredients) 
                      ? remedy.ingredients.join(', ') 
                      : 'No ingredients listed'}
                  </span>
                </div>
                <Link to={`/remedies/${remedy.id}`} className="text-emerald-600 hover:text-emerald-700 winky-sans">
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
        {remedies.length === 0 && <p className="winky-sans-body">No saved remedies yet.</p>}
      </div>

      <AddRemedyModal 
        isOpen={isModalOpen} 
        onClose={() => !isLoading && setIsModalOpen(false)}
        onSubmit={handleAddRemedy} 
      />
    </div>
  );
};

export default SavedRemedies;
