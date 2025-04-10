import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

// Type definition for Profile
interface Profile {
  id: number;
  user_id: string | null;
  username: string | null;
  bio: string | null;
  created_at: string;
  is_admin: string | null;
}

// Properly type errors
interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return 'An unknown error occurred';
}

export function AdminSettings() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    is_admin: false,
  });
  const [errors, setErrors] = useState({
    username: '',
  });

  // Fetch all profiles on mount
  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42501') {
          throw new Error('Permission denied: Unable to fetch profiles. Please check RLS policies.');
        }
        throw new Error('Failed to fetch profiles: ' + error.message);
      }

      setProfiles(data || []);
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { username: '' };

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile(profile);
    setFormData({
      username: profile.username || '',
      bio: profile.bio || '',
      is_admin: !!profile.is_admin, // Convert uuid to boolean for toggle
    });
    setErrors({ username: '' });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !editingProfile) {
      return;
    }

    try {
      setActionLoading(editingProfile.id.toString());
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username || null,
          bio: formData.bio || null,
          is_admin: formData.is_admin ? 'admin-uuid-placeholder' : null, // Replace with actual admin UUID if needed
        })
        .eq('id', editingProfile.id);

      if (error) {
        if (error.code === '42501') {
          throw new Error('Permission denied: Unable to update profile. Please check RLS policies.');
        }
        throw new Error('Failed to update profile: ' + error.message);
      }

      toast.success('Profile updated successfully');
      await fetchProfiles();
      setEditingProfile(null);
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteProfile = async (profileId: string | number) => {
    const profileIdString = profileId.toString();
    try {
      setActionLoading(profileIdString);
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileIdString);

      if (error) {
        if (error.code === '42501') {
          throw new Error('Permission denied: Unable to delete profile. Please check RLS policies.');
        }
        throw new Error('Failed to delete profile: ' + error.message);
      }

      toast.success('Profile deleted successfully');
      await fetchProfiles();
    } catch (err) {
      console.error('Error deleting profile:', err);
      toast.error(getErrorMessage(err));
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
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Settings - Manage Profiles</h1>

        {/* Edit Profile Form (Modal-like) */}
        {editingProfile && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit Profile: {editingProfile.username}</h2>
            <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.username ? 'border-red-500' : 'border-gray-300'
                  } placeholder-gray-400 hover:border-gray-400`}
                  placeholder="Enter username"
                />
                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
              </div>
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 border-gray-300 placeholder-gray-400 hover:border-gray-400 resize-y"
                  placeholder="Enter bio"
                  rows={4}
                />
              </div>
              <div>
                <label htmlFor="is_admin" className="block text-sm font-medium text-gray-700 mb-1">
                  Is Admin
                </label>
                <select
                  id="is_admin"
                  value={formData.is_admin ? 'Yes' : 'No'}
                  onChange={(e) => setFormData({ ...formData, is_admin: e.target.value === 'Yes' })}
                  className="w-full px-4 py-2 border rounded-lg shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 border-gray-300 bg-white text-gray-700 hover:border-gray-400 appearance-none custom-select"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="md:col-span-2 flex space-x-4">
                <button
                  type="submit"
                  className="w-full md:w-auto bg-green-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300 disabled:bg-green-400 disabled:cursor-not-allowed"
                  disabled={actionLoading === editingProfile.id.toString()}
                >
                  {actionLoading === editingProfile.id.toString() ? 'Updating...' : 'Update Profile'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProfile(null)}
                  className="w-full md:w-auto bg-gray-200 text-gray-700 px-6 py-2 rounded-lg shadow-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Profiles Table */}
        <div className="relative overflow-x-auto scroll-shadow">
          <table className="w-full min-w-[1600px] divide-y divide-gray-200">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px]">
                  User ID
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px]">
                  Username
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[300px]">
                  Bio
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                  Is Admin
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                  Created At
                </th>
                <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {profiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No profiles found.
                  </td>
                </tr>
              ) : (
                profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {profile.user_id || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {profile.username || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-[300px] truncate">
                      {profile.bio || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {profile.is_admin ? 'Yes' : 'No'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditProfile(profile)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                        disabled={actionLoading === profile.id.toString()}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProfile(profile.id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={actionLoading === profile.id.toString()}
                      >
                        {actionLoading === profile.id.toString() ? 'Deleting...' : 'Delete'}
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