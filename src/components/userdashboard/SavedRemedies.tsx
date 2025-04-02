import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import AddRemedyModal from './AddRemedyModal';

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
}

// Define type for the new remedy data from the modal
interface NewRemedySubmitData {
  title: string;
  ailmentId: string;
  description: string;
  ingredients: string;
  preparation: string;
}

const SavedRemedies = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRemedies = async () => {
    try {
      const { data, error } = await supabase
        .from('remedies')
        .select('*')
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

  // Load remedies when component mounts
  useEffect(() => {
    fetchRemedies();
  }, []);

  const handleAddRemedy = async (newRemedyData: NewRemedySubmitData) => {
    setIsLoading(true);
    try {
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
          description: newRemedyData.description
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
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-500 text-white py-2 px-4 rounded-lg hover:bg-emerald-600 disabled:opacity-50 winky-sans"
          disabled={isLoading}
        >
          {isLoading ? 'Adding...' : 'Add Remedy'}
        </button>
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
            className="remedy-card bg-white p-6 rounded-lg shadow-sm transition-all hover:shadow-md"
            style={{ animationDelay: getAnimationDelay(index) }}
          >
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
