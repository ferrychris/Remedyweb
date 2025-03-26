import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface Ailment {
  id: number;
  title: string;
  description: string | null;
  created_at: string;
  status: string;
}

export function AilmentsManagement() {
  const [ailments, setAilments] = useState<Ailment[]>([]);
  const [newAilment, setNewAilment] = useState({
    title: '',
    description: '',
    status: 'pending',
  });
  const [editingAilment, setEditingAilment] = useState<Ailment | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
      } else {
        toast.error('Please log in to manage ailments');
        setIsAuthenticated(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAilments();
    }
  }, [isAuthenticated]);

  const fetchAilments = async () => {
    try {
      const { data, error } = await supabase.from('ailments').select('*');
      if (error) {
        console.error('Error fetching ailments:', error.message, error.details);
        toast.error('Failed to load ailments: ' + error.message);
        return;
      }
      console.log('Fetched ailments:', data);
      setAilments(data || []);
    } catch (err) {
      console.error('Unexpected error fetching ailments:', err);
      toast.error('Unexpected error while loading ailments');
    }
  };

  const createAilment = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to create an ailment');
      return;
    }

    if (!newAilment.title.trim()) {
      toast.error('Title is required');
      return;
    }

    console.log('Creating ailment with:', newAilment);
    try {
      const { data, error } = await supabase.from('ailments').insert({
        title: newAilment.title.trim(),
        description: newAilment.description || null,
        status: newAilment.status || 'pending',
      }).select();

      if (error) {
        console.error('Error creating ailment:', error.message, error.details);
        toast.error('Failed to create ailment: ' + error.message);
        return;
      }

      if (!data || data.length === 0) {
        console.error('No data returned after insert - possible RLS issue');
        toast.error('Ailment not created - check database permissions');
        return;
      }

      toast.success('Ailment created successfully');
      setNewAilment((prev) => ({ ...prev, title: '', description: '' }));
      fetchAilments();
    } catch (err) {
      console.error('Unexpected error creating ailment:', err);
      toast.error('Unexpected error while creating ailment');
    }
  };

  const updateAilment = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to update an ailment');
      return;
    }

    if (!editingAilment) return;

    console.log('Updating ailment with:', editingAilment);
    try {
      const { data, error } = await supabase
        .from('ailments')
        .update({
          title: editingAilment.title,
          description: editingAilment.description || null,
          status: editingAilment.status,
        })
        .eq('id', editingAilment.id)
        .select();

      if (error) {
        console.error('Error updating ailment:', error.message, error.details);
        toast.error('Failed to update ailment: ' + error.message);
        return;
      }

      if (!data || data.length === 0) {
        console.error('No data returned after update - possible RLS issue');
        toast.error('Ailment not updated - check database permissions');
        return;
      }

      toast.success('Ailment updated successfully');
      setEditingAilment(null);
      fetchAilments();
    } catch (err) {
      console.error('Unexpected error updating ailment:', err);
      toast.error('Unexpected error while updating ailment');
    }
  };

  const deleteAilment = async (id: number) => {
    if (!isAuthenticated) {
      toast.error('Please log in to delete an ailment');
      return;
    }

    console.log('Deleting ailment with id:', id);
    try {
      const { data, error } = await supabase.from('ailments').delete().eq('id', id).select();

      if (error) {
        console.error('Error deleting ailment:', error.message, error.details);
        toast.error('Failed to delete ailment: ' + error.message);
        return;
      }

      if (!data || data.length === 0) {
        console.error('No data returned after delete - possible RLS issue');
        toast.error('Ailment not deleted - check database permissions');
        return;
      }

      toast.success('Ailment deleted successfully');
      fetchAilments();
    } catch (err) {
      console.error('Unexpected error deleting ailment:', err);
      toast.error('Unexpected error while deleting ailment');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Manage Ailments</h2>
        <p className="text-red-600">You must be logged in to manage ailments.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Manage Ailments</h2>

      {/* Create Form */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Add New Ailment</h3>
        <input
          type="text"
          placeholder="Title"
          value={newAilment.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setNewAilment((prev) => ({ ...prev, title: e.target.value }))
          }
          className="border p-2 mb-2 w-full rounded"
        />
        <textarea
          placeholder="Description"
          value={newAilment.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setNewAilment((prev) => ({ ...prev, description: e.target.value }))
          }
          className="border p-2 mb-2 w-full rounded"
        />
        <select
          value={newAilment.status}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setNewAilment((prev) => ({ ...prev, status: e.target.value }))
          }
          className="border p-2 mb-2 w-full rounded"
        >
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            createAilment();
          }}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 z-10"
        >
          Create Ailment
        </button>
      </div>

      {/* List and Edit */}
      <div className="bg-white rounded-lg shadow">
        {ailments.map((ailment) => (
          <div
            key={ailment.id}
            className="border-b p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4"
          >
            {editingAilment?.id === ailment.id ? (
              <div className="flex-1">
                <input
                  type="text"
                  value={editingAilment.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditingAilment((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="border p-2 mb-2 w-full rounded"
                />
                <textarea
                  value={editingAilment.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditingAilment((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="border p-2 mb-2 w-full rounded"
                />
                <select
                  value={editingAilment.status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setEditingAilment((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="border p-2 mb-2 w-full rounded"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      console.log('Save button clicked');
                      updateAilment();
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 z-10"
                  >
                    Save
                  </button>
                  <button
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      setEditingAilment(null);
                    }}
                    className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 z-10"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <h4 className="text-lg font-semibold">{ailment.title}</h4>
                <p className="text-gray-600">{ailment.description || 'No description'}</p>
                <p className="text-sm text-gray-500">Status: {ailment.status}</p>
                <p className="text-sm text-gray-500">Created: {ailment.created_at}</p>
              </div>
            )}
            {editingAilment?.id !== ailment.id && (
              <div className="flex gap-2">
                <button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    console.log('Edit button clicked for ailment:', ailment.id);
                    setEditingAilment(ailment);
                  }}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 z-10"
                >
                  Edit
                </button>
                <button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    console.log('Delete button clicked for ailment:', ailment.id);
                    deleteAilment(ailment.id);
                  }}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 z-10"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}