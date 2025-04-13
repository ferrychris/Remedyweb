import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface FormData {
  title: string;
  ailments: string;
  ingredients: string;
  preparation: string;
  description: string;
}

export default function SubmitRemedy() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    ailments: '',
    ingredients: '',
    preparation: '',
    description: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to submit a remedy');
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate a URL-friendly slug from the title
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Insert the remedy
      const { data: remedy, error: remedyError } = await supabase
        .from('remedies')
        .insert({
          title: formData.title,
          slug,
          ailments: formData.ailments.split(',').map(a => a.trim()),
          ingredients: formData.ingredients,
          preparation: formData.preparation,
          description: formData.description,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          likes_count: 0,
          comments_count: 0
        })
        .select()
        .single();

      if (remedyError) throw remedyError;

      // No need to initialize likes and comments as we have default values
      toast.success('Remedy submitted successfully!');
      navigate('/remedies');
    } catch (error: any) {
      console.error('Error submitting remedy:', error);
      toast.error(error.message || 'Failed to submit remedy');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-gray-50 rounded-xl p-6 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-gray-600" />
          <p className="text-gray-600">Please sign in to submit a remedy</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto py-8 px-4"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-all duration-200"
            placeholder="Enter a descriptive title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ailments (comma-separated)
          </label>
          <input
            type="text"
            name="ailments"
            value={formData.ailments}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-all duration-200"
            placeholder="e.g., Headache, Fever, Sore Throat"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={3}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-all duration-200"
            placeholder="Describe what this remedy helps with..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ingredients
          </label>
          <textarea
            name="ingredients"
            value={formData.ingredients}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-all duration-200"
            placeholder="List the required ingredients..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preparation Instructions
          </label>
          <textarea
            name="preparation"
            value={formData.preparation}
            onChange={handleChange}
            required
            rows={6}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-all duration-200"
            placeholder="Explain how to prepare the remedy..."
          />
        </div>

        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500">
            All fields are required
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-3 bg-emerald-500 text-white rounded-xl flex items-center gap-2 hover:bg-emerald-600 transition-colors ${
              isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Remedy'}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}