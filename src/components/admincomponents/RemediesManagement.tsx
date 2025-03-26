import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface Remedy {
  id: number;
  title: string;
  slug: string;
  ailments: string[];
  ingredients: string | null;
  preparation: string | null;
  description: string | null;
  user_id: string;
  created_at: string;
  updated_at: string | null;
  likes_count: number;
  comments_count: number;
  status: string;
}

export function RemediesManagement() {
  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [newRemedy, setNewRemedy] = useState({
    title: '',
    slug: '',
    ailments: [] as string[], // Changed to an array of strings
    ingredients: '',
    preparation: '',
    description: '',
    status: 'pending',
    user_id: '',
  });
  const [editingRemedy, setEditingRemedy] = useState<Remedy | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [ailmentsList, setAilmentsList] = useState<{ id: number; title: string }[]>([]);

  // Utility function to generate a slug from the title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/(^-|-$)/g, ''); // Remove leading/trailing hyphens
  };

  // Fetch ailments from the ailments table
  const fetchAilments = async () => {
    try {
      const { data, error } = await supabase
        .from('ailments')
        .select('id, title')
        .eq('status', 'active')
        .order('title', { ascending: true });
      if (error) {
        console.error('Error fetching ailments:', error.message, error.details);
        toast.error('Failed to load ailments: ' + error.message);
        return;
      }
      console.log('Fetched ailments:', data);
      setAilmentsList(data || []);
    } catch (err) {
      console.error('Unexpected error fetching ailments:', err);
      toast.error('Unexpected error while loading ailments');
    }
  };

  // Fetch authenticated user and set user_id
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setNewRemedy((prev) => ({ ...prev, user_id: user.id }));
        setIsAuthenticated(true);
        await fetchAilments(); // Fetch ailments after authentication
      } else {
        toast.error('Please log in to manage remedies');
        setIsAuthenticated(false);
      }
    };
    fetchUser();
  }, []);

  // Fetch remedies when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchRemedies();
    }
  }, [isAuthenticated]);

  const fetchRemedies = async () => {
    try {
      const { data, error } = await supabase.from('remedies').select('*');
      if (error) {
        console.error('Error fetching remedies:', error.message, error.details);
        toast.error('Failed to load remedies: ' + error.message);
        return;
      }
      console.log('Fetched remedies:', data);
      setRemedies(data || []);
    } catch (err) {
      console.error('Unexpected error fetching remedies:', err);
      toast.error('Unexpected error while loading remedies');
    }
  };

  const createRemedy = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to create a remedy');
      return;
    }

    if (!newRemedy.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (newRemedy.ailments.length === 0) {
      toast.error('Please select at least one ailment');
      return;
    }

    // Generate slug from title
    const slug = generateSlug(newRemedy.title);
    console.log('Creating remedy with:', { ...newRemedy, slug });

    try {
      const { data, error } = await supabase.from('remedies').insert({
        title: newRemedy.title.trim(),
        slug,
        ailments: newRemedy.ailments,
        ingredients: newRemedy.ingredients || null,
        preparation: newRemedy.preparation || null,
        description: newRemedy.description || null,
        status: newRemedy.status || 'pending',
        user_id: newRemedy.user_id,
      }).select();

      if (error) {
        console.error('Error creating remedy:', error.message, error.details);
        toast.error('Failed to create remedy: ' + error.message);
        return;
      }

      if (!data || data.length === 0) {
        console.error('No data returned after insert - possible RLS issue');
        toast.error('Remedy not created - check database permissions');
        return;
      }

      toast.success('Remedy created successfully');
      setNewRemedy((prev) => ({
        ...prev,
        title: '',
        slug: '',
        ailments: [],
        ingredients: '',
        preparation: '',
        description: '',
      }));
      fetchRemedies();
    } catch (err) {
      console.error('Unexpected error creating remedy:', err);
      toast.error('Unexpected error while creating remedy');
    }
  };

  const updateRemedy = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to update a remedy');
      return;
    }

    if (!editingRemedy) return;

    if (!editingRemedy.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (editingRemedy.ailments.length === 0) {
      toast.error('Please select at least one ailment');
      return;
    }

    // Generate slug from title
    const slug = generateSlug(editingRemedy.title);
    console.log('Updating remedy with:', { ...editingRemedy, slug });

    try {
      const { data, error } = await supabase
        .from('remedies')
        .update({
          title: editingRemedy.title,
          slug,
          ailments: editingRemedy.ailments,
          ingredients: editingRemedy.ingredients || null,
          preparation: editingRemedy.preparation || null,
          description: editingRemedy.description || null,
          status: editingRemedy.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingRemedy.id)
        .select();

      if (error) {
        console.error('Error updating remedy:', error.message, error.details);
        toast.error('Failed to update remedy: ' + error.message);
        return;
      }

      if (!data || data.length === 0) {
        console.error('No data returned after update - possible RLS issue');
        toast.error('Remedy not updated - check database permissions');
        return;
      }

      toast.success('Remedy updated successfully');
      setEditingRemedy(null);
      fetchRemedies();
    } catch (err) {
      console.error('Unexpected error updating remedy:', err);
      toast.error('Unexpected error while updating remedy');
    }
  };

  const deleteRemedy = async (id: number) => {
    if (!isAuthenticated) {
      toast.error('Please log in to delete a remedy');
      return;
    }

    console.log('Deleting remedy with id:', id);
    try {
      const { data, error } = await supabase.from('remedies').delete().eq('id', id).select();

      if (error) {
        console.error('Error deleting remedy:', error.message, error.details);
        toast.error('Failed to delete remedy: ' + error.message);
        return;
      }

      if (!data || data.length === 0) {
        console.error('No data returned after delete - possible RLS issue');
        toast.error('Remedy not deleted - check database permissions');
        return;
      }

      toast.success('Remedy deleted successfully');
      fetchRemedies();
    } catch (err) {
      console.error('Unexpected error deleting remedy:', err);
      toast.error('Unexpected error while deleting remedy');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Manage Remedies</h2>
        <p className="text-red-600">You must be logged in to manage remedies.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Manage Remedies</h2>

      {/* Create Form */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Add New Remedy</h3>
        <input
          type="text"
          placeholder="Title"
          value={newRemedy.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setNewRemedy((prev) => ({
              ...prev,
              title: e.target.value,
              slug: generateSlug(e.target.value),
            }))
          }
          className="border p-2 mb-2 w-full rounded"
        />
        <input
          type="text"
          placeholder="Slug (auto-generated)"
          value={newRemedy.slug}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setNewRemedy((prev) => ({ ...prev, slug: e.target.value }))
          }
          className="border p-2 mb-2 w-full rounded bg-gray-100"
          disabled
        />
        <select
          multiple
          value={newRemedy.ailments}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
            setNewRemedy((prev) => ({ ...prev, ailments: selectedOptions }));
          }}
          className="border p-2 mb-2 w-full rounded h-32"
        >
          {ailmentsList.map((ailment) => (
            <option key={ailment.id} value={ailment.title}>
              {ailment.title}
            </option>
          ))}
        </select>
        <textarea
          placeholder="Ingredients"
          value={newRemedy.ingredients}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setNewRemedy((prev) => ({ ...prev, ingredients: e.target.value }))
          }
          className="border p-2 mb-2 w-full rounded"
        />
        <textarea
          placeholder="Preparation"
          value={newRemedy.preparation}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setNewRemedy((prev) => ({ ...prev, preparation: e.target.value }))
          }
          className="border p-2 mb-2 w-full rounded"
        />
        <textarea
          placeholder="Description"
          value={newRemedy.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setNewRemedy((prev) => ({ ...prev, description: e.target.value }))
          }
          className="border p-2 mb-2 w-full rounded"
        />
        <select
          value={newRemedy.status}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setNewRemedy((prev) => ({ ...prev, status: e.target.value }))
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
            createRemedy();
          }}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 z-10"
        >
          Create Remedy
        </button>
      </div>

      {/* List and Edit */}
      <div className="bg-white rounded-lg shadow">
        {remedies.map((remedy) => (
          <div
            key={remedy.id}
            className="border-b p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4"
          >
            {editingRemedy?.id === remedy.id ? (
              <div className="flex-1">
                <input
                  type="text"
                  value={editingRemedy.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditingRemedy((prev) => ({
                      ...prev,
                      title: e.target.value,
                      slug: generateSlug(e.target.value),
                    }))
                  }
                  className="border p-2 mb-2 w-full rounded"
                />
                <input
                  type="text"
                  value={editingRemedy.slug}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditingRemedy((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  className="border p-2 mb-2 w-full rounded bg-gray-100"
                  disabled
                />
                <select
                  multiple
                  value={editingRemedy.ailments}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
                    setEditingRemedy((prev) => ({ ...prev, ailments: selectedOptions }));
                  }}
                  className="border p-2 mb-2 w-full rounded h-32"
                >
                  {ailmentsList.map((ailment) => (
                    <option key={ailment.id} value={ailment.title}>
                      {ailment.title}
                    </option>
                  ))}
                </select>
                <textarea
                  value={editingRemedy.ingredients || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditingRemedy((prev) => ({ ...prev, ingredients: e.target.value }))
                  }
                  placeholder="Ingredients"
                  className="border p-2 mb-2 w-full rounded"
                />
                <textarea
                  value={editingRemedy.preparation || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditingRemedy((prev) => ({ ...prev, preparation: e.target.value }))
                  }
                  placeholder="Preparation"
                  className="border p-2 mb-2 w-full rounded"
                />
                <textarea
                  value={editingRemedy.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditingRemedy((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Description"
                  className="border p-2 mb-2 w-full rounded"
                />
                <select
                  value={editingRemedy.status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setEditingRemedy((prev) => ({ ...prev, status: e.target.value }))
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
                      updateRemedy();
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 z-10"
                  >
                    Save
                  </button>
                  <button
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      setEditingRemedy(null);
                    }}
                    className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 z-10"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <h4 className="text-lg font-semibold">{remedy.title}</h4>
                <p className="text-gray-600"><strong>Slug:</strong> {remedy.slug}</p>
                <p className="text-gray-600"><strong>Ailments:</strong> {remedy.ailments.join(', ') || 'None'}</p>
                <p className="text-gray-600"><strong>Ingredients:</strong> {remedy.ingredients || 'None'}</p>
                <p className="text-gray-600"><strong>Preparation:</strong> {remedy.preparation || 'None'}</p>
                <p className="text-gray-600"><strong>Description:</strong> {remedy.description || 'None'}</p>
                <p className="text-sm text-gray-500">Status: {remedy.status}</p>
                <p className="text-sm text-gray-500">Created: {remedy.created_at}</p>
                {remedy.updated_at && <p className="text-sm text-gray-500">Updated: {remedy.updated_at}</p>}
              </div>
            )}
            {editingRemedy?.id !== remedy.id && (
              <div className="flex gap-2">
                <button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    console.log('Edit button clicked for remedy:', remedy.id);
                    setEditingRemedy(remedy);
                  }}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 z-10"
                >
                  Edit
                </button>
                <button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    console.log('Delete button clicked for remedy:', remedy.id);
                    deleteRemedy(remedy.id);
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