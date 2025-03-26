import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

// Type definition for Consultant
interface Consultant {
  id: string;
  name: string | null;
  email: string | null;
  specialty: string | null;
  bio: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

// List of medical specialties for the dropdown
const medicalSpecialties = [
  'Cardiology',
  'Neurology',
  'Pediatrics',
  'Dermatology',
  'Orthopedics',
  'Gastroenterology',
  'Endocrinology',
  'Oncology',
  'Psychiatry',
  'Radiology',
  'Anesthesiology',
  'Urology',
  'Ophthalmology',
  'Gynecology',
  'General Surgery',
  'Emergency Medicine',
  'Family Medicine',
  'Internal Medicine',
];

export function ConsultantsManagement() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newConsultant, setNewConsultant] = useState({
    name: '',
    email: '',
    specialty: '',
    bio: '',
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    specialty: '',
  });

  // Fetch consultants on mount
  useEffect(() => {
    fetchConsultants();
  }, []);

  const fetchConsultants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('consultants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42501') {
          throw new Error('Permission denied: Unable to fetch consultants. Please check RLS policies.');
        }
        throw new Error('Failed to fetch consultants: ' + error.message);
      }

      setConsultants(data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { name: '', email: '', specialty: '' };

    if (!newConsultant.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!newConsultant.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(newConsultant.email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    if (!newConsultant.specialty) {
      newErrors.specialty = 'Specialty is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleAddConsultant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      const { error } = await supabase.from('consultants').insert({
        name: newConsultant.name || null,
        email: newConsultant.email || null,
        specialty: newConsultant.specialty || null,
        bio: newConsultant.bio || null,
        status: 'active',
      });
      if (error) {
        if (error.code === '42501') {
          throw new Error('Permission denied: Unable to add consultant. Please check RLS policies.');
        }
        throw new Error('Failed to add consultant: ' + error.message);
      }
      toast.success('Consultant added successfully');
      await fetchConsultants();
      setNewConsultant({ name: '', email: '', specialty: '', bio: '' });
      setErrors({ name: '', email: '', specialty: '' });
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  const handleConsultantAction = async (action: 'delete' | 'activate' | 'deactivate', consultantId: string) => {
    try {
      setActionLoading(consultantId);
      switch (action) {
        case 'delete':
          const { error: deleteError } = await supabase.from('consultants').delete().eq('id', consultantId);
          if (deleteError) {
            if (deleteError.code === '42501') {
              throw new Error('Permission denied: Unable to delete consultant. Please check RLS policies.');
            }
            throw new Error('Failed to delete consultant: ' + deleteError.message);
          }
          break;
        case 'activate':
          const { error: activateError } = await supabase
            .from('consultants')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', consultantId);
          if (activateError) {
            if (activateError.code === '42501') {
              throw new Error('Permission denied: Unable to activate consultant. Please check RLS policies.');
            }
            throw new Error('Failed to activate consultant: ' + activateError.message);
          }
          break;
        case 'deactivate':
          const { error: deactivateError } = await supabase
            .from('consultants')
            .update({ status: 'inactive', updated_at: new Date().toISOString() })
            .eq('id', consultantId);
          if (deactivateError) {
            if (deactivateError.code === '42501') {
              throw new Error('Permission denied: Unable to deactivate consultant. Please check RLS policies.');
            }
            throw new Error('Failed to deactivate consultant: ' + deactivateError.message);
          }
          break;
      }
      await fetchConsultants();
      toast.success('Consultant updated successfully');
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Consultants Management</h1>

        {/* Add Consultant Form */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Consultant</h2>
          <form onSubmit={handleAddConsultant} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={newConsultant.name}
                onChange={(e) => setNewConsultant({ ...newConsultant, name: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-400 hover:border-gray-400`}
                placeholder="Enter name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={newConsultant.email}
                onChange={(e) => setNewConsultant({ ...newConsultant, email: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-400 hover:border-gray-400`}
                placeholder="Enter email"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-1">
                Specialty
              </label>
              <select
                id="specialty"
                value={newConsultant.specialty}
                onChange={(e) => setNewConsultant({ ...newConsultant, specialty: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.specialty ? 'border-red-500' : 'border-gray-300'
                } bg-white text-gray-700 hover:border-gray-400 appearance-none custom-select`}
              >
                <option value="" disabled>
                  Select a specialty
                </option>
                {medicalSpecialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
              {errors.specialty && <p className="mt-1 text-sm text-red-600">{errors.specialty}</p>}
            </div>
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                value={newConsultant.bio}
                onChange={(e) => setNewConsultant({ ...newConsultant, bio: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 border-gray-300 placeholder-gray-400 hover:border-gray-400 resize-y"
                placeholder="Enter bio"
                rows={4}
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full md:w-auto bg-green-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300"
              >
                Add Consultant
              </button>
            </div>
          </form>
        </div>

        {/* Consultants Table */}
        <div className="relative overflow-x-auto scroll-shadow">
          <table className="w-full min-w-[1600px] divide-y divide-gray-200">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px]">
                  Name
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[250px]">
                  Email
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px]">
                  Specialty
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[300px]">
                  Bio
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                  Status
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                  Created At
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                  Updated At
                </th>
                <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {consultants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No consultants found.
                  </td>
                </tr>
              ) : (
                consultants.map((consultant) => (
                  <tr key={consultant.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {consultant.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {consultant.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {consultant.specialty || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-[300px] truncate">
                      {consultant.bio || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          consultant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {consultant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(consultant.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(consultant.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() =>
                          handleConsultantAction(
                            consultant.status === 'active' ? 'deactivate' : 'activate',
                            consultant.id
                          )
                        }
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                        disabled={actionLoading === consultant.id}
                      >
                        {actionLoading === consultant.id
                          ? consultant.status === 'active'
                            ? 'Deactivating...'
                            : 'Activating...'
                          : consultant.status === 'active'
                          ? 'Deactivate'
                          : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleConsultantAction('delete', consultant.id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={actionLoading === consultant.id}
                      >
                        {actionLoading === consultant.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}