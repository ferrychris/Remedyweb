import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Patient {
  id: string;
  full_name: string;
  email: string;
}

const AddHealthReview = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    overall_rating: 0,
    mental_rating: 0,
    physical_rating: 0,
    nutrition_rating: 0,
    notes: '',
    lab_results: '',
    next_review_date: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'patient');

      if (error) throw error;
      setPatients(data || []);
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const rating = Math.min(100, Math.max(0, parseInt(value) || 0));
    setFormData(prev => ({
      ...prev,
      [name]: rating
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('health_reviews')
        .insert({
          patient_id: selectedPatient,
          consultant_id: user.id,
          ...formData,
          lab_results: formData.lab_results ? JSON.parse(formData.lab_results) : null,
          next_review_date: formData.next_review_date || null
        });

      if (error) throw error;

      toast.success('Health review added successfully');
      navigate('/consultantDashboard');
    } catch (error: any) {
      console.error('Error adding health review:', error);
      toast.error('Failed to add health review');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 winky-sans-heading">Add Health Review</h1>
        <p className="text-gray-600 winky-sans-body">Record a patient's health metrics and progress</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="mb-6">
          <label className="block text-gray-700 winky-sans-body mb-2">
            Select Patient
          </label>
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            required
          >
            <option value="">Select a patient</option>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.full_name} ({patient.email})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 winky-sans-body mb-2">
              Overall Health Rating (0-100)
            </label>
            <input
              type="number"
              name="overall_rating"
              value={formData.overall_rating}
              onChange={handleRatingChange}
              min="0"
              max="100"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 winky-sans-body mb-2">
              Mental Health Rating (0-100)
            </label>
            <input
              type="number"
              name="mental_rating"
              value={formData.mental_rating}
              onChange={handleRatingChange}
              min="0"
              max="100"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 winky-sans-body mb-2">
              Physical Health Rating (0-100)
            </label>
            <input
              type="number"
              name="physical_rating"
              value={formData.physical_rating}
              onChange={handleRatingChange}
              min="0"
              max="100"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 winky-sans-body mb-2">
              Nutrition Rating (0-100)
            </label>
            <input
              type="number"
              name="nutrition_rating"
              value={formData.nutrition_rating}
              onChange={handleRatingChange}
              min="0"
              max="100"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 winky-sans-body mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={4}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 winky-sans-body mb-2">
            Lab Results (JSON format)
          </label>
          <textarea
            name="lab_results"
            value={formData.lab_results}
            onChange={handleInputChange}
            rows={4}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
            placeholder='{"test1": "value1", "test2": "value2"}'
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 winky-sans-body mb-2">
            Next Review Date
          </label>
          <input
            type="date"
            name="next_review_date"
            value={formData.next_review_date}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/consultantDashboard')}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors winky-sans-body"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors winky-sans-body disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddHealthReview; 