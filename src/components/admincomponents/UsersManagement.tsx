import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  display_name: string | null;
  bio: string | null;
  is_admin: boolean | null;
  created_at: string;
  updated_at: string;
}

export function UsersManagement() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error fetching user:', userError.message);
        toast.error('Error fetching user: ' + userError.message);
        setIsAuthenticated(false);
        return;
      }

      if (user) {
        console.log('Logged-in user ID:', user.id);
        setCurrentUserId(user.id);
        setIsAuthenticated(true);

        // Check if the current user is an admin
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError.message, profileError.details);
          toast.error('Error fetching profile: ' + profileError.message);
          setIsAdmin(false);
          return;
        }

        console.log('Fetched profile:', profile);
        if (!profile) {
          toast.error('No profile found for this user. Please ensure a profile exists.');
          setIsAdmin(false);
          return;
        }

        setIsAdmin(profile.is_admin === true); // Check if is_admin is true
      } else {
        toast.error('Please log in to manage users');
        setIsAuthenticated(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchProfiles();
    }
  }, [isAuthenticated, isAdmin]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching profiles:', error.message, error.details);
        toast.error('Failed to load users: ' + error.message);
        return;
      }
      console.log('Fetched profiles:', data);
      setProfiles(data || []);
    } catch (err) {
      console.error('Unexpected error fetching profiles:', err);
      toast.error('Unexpected error while loading users');
    }
  };

  const updateProfile = async () => {
    if (!isAuthenticated || !isAdmin || !editingProfile) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          display_name: editingProfile.display_name,
          bio: editingProfile.bio,
          is_admin: editingProfile.is_admin,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingProfile.id);

      if (error) {
        console.error('Error updating profile:', error.message, error.details);
        toast.error('Failed to update user: ' + error.message);
        return;
      }

      toast.success('User updated successfully');
      setEditingProfile(null);
      fetchProfiles();
    } catch (err) {
      console.error('Unexpected error updating profile:', err);
      toast.error('Unexpected error while updating user');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Users Management</h2>
        <p className="text-red-600">You must be logged in to manage users.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Users Management</h2>
        <p className="text-red-600">
          You do not have permission to manage users. Your user ID is: {currentUserId}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Users Management</h2>
      <div className="bg-white rounded-lg shadow">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="border-b p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4"
          >
            {editingProfile?.id === profile.id ? (
              <div className="flex-1">
                <input
                  type="text"
                  value={editingProfile.display_name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditingProfile((prev) => ({ ...prev, display_name: e.target.value }))
                  }
                  className="border p-2 mb-2 w-full rounded"
                  placeholder="Display Name"
                />
                <textarea
                  value={editingProfile.bio || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditingProfile((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  className="border p-2 mb-2 w-full rounded"
                  placeholder="Bio"
                />
                <select
                  value={editingProfile.is_admin ? 'true' : 'false'}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setEditingProfile((prev) => ({ ...prev, is_admin: e.target.value === 'true' }))
                  }
                  className="border p-2 mb-2 w-full rounded"
                >
                  <option value="false">User</option>
                  <option value="true">Admin</option>
                </select>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      updateProfile();
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 z-10"
                  >
                    Save
                  </button>
                  <button
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      setEditingProfile(null);
                    }}
                    className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 z-10"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <h4 className="text-lg font-semibold">{profile.display_name || 'Unnamed User'}</h4>
                <p className="text-gray-600"><strong>Bio:</strong> {profile.bio || 'None'}</p>
                <p className="text-gray-600"><strong>Role:</strong> {profile.is_admin ? 'Admin' : 'User'}</p>
                <p className="text-sm text-gray-500">Created: {profile.created_at}</p>
                {profile.updated_at && <p className="text-sm text-gray-500">Updated: {profile.updated_at}</p>}
              </div>
            )}
            {editingProfile?.id !== profile.id && (
              <div className="flex gap-2">
                <button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    console.log('Edit button clicked for user:', profile.id);
                    setEditingProfile(profile);
                  }}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 z-10"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}