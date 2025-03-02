import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ThumbsUp, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { AuthModal } from './AuthModal';
import toast from 'react-hot-toast';

function Remedies() {
  const [activeTab, setActiveTab] = useState('browse');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    ailments: '',
    ingredients: '',
    preparation: '',
  });

  const remedies = [
    {
      id: 1,
      title: "Ginger Tea for Nausea",
      slug: "ginger-tea-nausea",
      ailments: ['Nausea', 'Digestive Issues'],
      rating: 4.5,
      votes: 128,
      comments: 24,
    },
    {
      id: 2,
      title: "Honey & Lemon for Sore Throat",
      slug: "honey-lemon-sore-throat",
      ailments: ['Sore Throat', 'Cough'],
      rating: 4.8,
      votes: 256,
      comments: 42,
    },
  ];

  const handleSubmitClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setActiveTab('submit');
    }
  };

  const handleSubmitRemedy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!user) {
        toast.error('Please log in to submit a remedy.');
        setShowAuthModal(true);
        return;
      }

      // Submit remedy
      const { error: remedyError } = await supabase
        .from('remedies')
        .insert([
          {
            title: formData.title,
            ailments: formData.ailments.split(',').map(a => a.trim()),
            ingredients: formData.ingredients,
            preparation: formData.preparation,
            user_id: user.id,
            status: 'pending'
          }
        ]);

      if (remedyError) throw remedyError;

      toast.success('Thank you! Your remedy has been submitted for review.');
      setFormData({
        title: '',
        ailments: '',
        ingredients: '',
        preparation: '',
      });
      setActiveTab('browse');
    } catch (error: any) {
      toast.error('Error submitting remedy. Please try again.');
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Natural Remedies</h1>
        <button 
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          onClick={handleSubmitClick}
        >
          Submit Remedy
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex space-x-4 border-b mb-6">
          <TabButton 
            active={activeTab === 'browse'} 
            onClick={() => setActiveTab('browse')}
          >
            Browse Remedies
          </TabButton>
          <TabButton 
            active={activeTab === 'submit'} 
            onClick={handleSubmitClick}
          >
            Submit Remedy
          </TabButton>
        </div>

        {activeTab === 'browse' ? (
          <div className="space-y-6">
            {remedies.map(remedy => (
              <Link
                key={remedy.id}
                to={`/remedies/${remedy.slug}`}
                className="block border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-semibold text-gray-800">{remedy.title}</h3>
                <div className="flex space-x-2 mt-2">
                  {remedy.ailments.map(ailment => (
                    <span key={ailment} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {ailment}
                    </span>
                  ))}
                </div>
                <div className="flex items-center space-x-6 mt-4 text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span>{remedy.rating}/5</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ThumbsUp className="h-5 w-5" />
                    <span>{remedy.votes}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="h-5 w-5" />
                    <span>{remedy.comments}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <RemedySubmissionForm 
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmitRemedy}
            isSubmitting={isSubmitting}
          />
        )}
      </div>

      <p className="text-sm text-gray-500">
        Disclaimer: This information is for educational purposes only and is not intended to diagnose, treat, cure, or prevent any disease. 
        Always consult with a qualified healthcare provider before starting any new treatment.
      </p>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode="signin"
      />
    </div>
  );
}

function TabButton({ children, active, onClick }) {
  return (
    <button
      className={`px-4 py-2 font-medium ${
        active 
          ? 'text-green-600 border-b-2 border-green-600' 
          : 'text-gray-500 hover:text-gray-700'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function RemedySubmissionForm({ formData, setFormData, onSubmit, isSubmitting }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Remedy Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          placeholder="Enter remedy title"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Add Ailments this remedy helps, separate by commas
        </label>
        <input
          type="text"
          name="ailments"
          value={formData.ailments}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          placeholder="e.g., Headache, Stress, Anxiety"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Ingredients</label>
        <textarea
          name="ingredients"
          value={formData.ingredients}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          rows={3}
          placeholder="List the ingredients"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Preparation Steps</label>
        <textarea
          name="preparation"
          value={formData.preparation}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          rows={4}
          placeholder="Describe the preparation steps"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Remedy'}
      </button>
    </form>
  );
}

export default Remedies;