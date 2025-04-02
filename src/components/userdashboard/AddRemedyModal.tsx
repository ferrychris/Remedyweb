import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; // Adjust path as necessary
import { X } from 'lucide-react'; // Import X icon for removing tags

// Define the structure of an Ailment
interface Ailment {
  id: string; // Or number, depending on your schema
  title: string; // Changed from name to title
}

// Define the structure for the submitted remedy data
interface NewRemedySubmitData {
  title: string;
  ailmentId: string;
  description: string;
  ingredients: string; // Submit ingredients as a single string (e.g., comma-separated)
  preparation: string;
}

interface AddRemedyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (remedy: NewRemedySubmitData) => void;
}

const AddRemedyModal: React.FC<AddRemedyModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]); // Store ingredients as an array
  const [currentIngredient, setCurrentIngredient] = useState(''); // State for the input field
  const [preparation, setPreparation] = useState('');
  const [ailmentsList, setAilmentsList] = useState<Ailment[]>([]);
  const [selectedAilment, setSelectedAilment] = useState<string>('');
  const [loadingAilments, setLoadingAilments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch ailments when the modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchAilments = async () => {
        setLoadingAilments(true);
        setError(null);
        try {
          console.log("Attempting to fetch ailments...");
          const { data, error: fetchError } = await supabase
            .from('ailments')
            .select('id, title') // Fetch 'title' instead of 'name'
            .order('title', { ascending: true }); // Order by 'title'

          if (fetchError) {
            console.error("Supabase fetch error:", fetchError);
            throw fetchError;
          }

          console.log("Ailments fetched successfully:", data);
          // Update the Ailment interface mapping if needed - here it's implicitly correct
          setAilmentsList(data || []);
          if (data && data.length > 0) {
            setSelectedAilment(data[0].id);
          } else if (!data) {
              console.log("No data returned, check RLS policies or table name.");
          }
        } catch (err: any) {
          // Log the detailed error structure
          console.error("Detailed error object fetching ailments:", err);
          // Try to extract a meaningful message
          let errorMessage = "Failed to load ailments. Please check console for details.";
          if (err && err.message) {
            errorMessage = `Failed to load ailments: ${err.message}`;
          } else if (typeof err === 'string') {
            errorMessage = `Failed to load ailments: ${err}`;
          } else {
            // Attempt to stringify if it's an object but has no message
            try {
              const errorString = JSON.stringify(err);
              errorMessage = `Failed to load ailments: ${errorString}`;
            } catch (_) {
              // Fallback if stringify fails
              errorMessage = "Failed to load ailments due to an unknown error.";
            }
          }
          setError(errorMessage);
        } finally {
          setLoadingAilments(false);
        }
      };
      fetchAilments();
    } else {
        // Reset state when modal closes
        setTitle('');
        setDescription('');
        setIngredients([]);
        setCurrentIngredient('');
        setPreparation('');
        setSelectedAilment('');
        setError(null);
    }
  }, [isOpen]);

  // --- Ingredient Handling Functions ---
  const handleAddIngredient = () => {
    if (currentIngredient.trim() && !ingredients.includes(currentIngredient.trim())) {
      setIngredients([...ingredients, currentIngredient.trim()]);
      setCurrentIngredient(''); // Clear the input field
    }
  };

  const handleIngredientKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission on Enter
      handleAddIngredient();
    }
  };

  const handleRemoveIngredient = (ingredientToRemove: string) => {
    setIngredients(ingredients.filter(ing => ing !== ingredientToRemove));
  };
  // --- End Ingredient Handling Functions ---

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validation
    if (!title || !selectedAilment || !description || ingredients.length === 0 || !preparation) {
      alert("Please fill in all fields, including at least one ingredient.");
      return;
    }
    // Submit ingredients joined as a string
    onSubmit({ title, ailmentId: selectedAilment, description, ingredients: ingredients.join(', '), preparation });
    // Reset fields happens in useEffect when isOpen becomes false after onClose is called
    onClose(); // Close the modal
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 overflow-y-auto p-4 pt-10"> {/* items-start and pt-10 */}
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add New Remedy</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="remedy-title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="remedy-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label htmlFor="remedy-ailment" className="block text-sm font-medium text-gray-700 mb-1">
              Ailment
            </label>
            <select
              id="remedy-ailment"
              value={selectedAilment}
              onChange={(e) => setSelectedAilment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              required
              disabled={loadingAilments || ailmentsList.length === 0}
            >
              {loadingAilments ? (
                <option>Loading ailments...</option>
              ) : ailmentsList.length > 0 ? (
                ailmentsList.map((ailment) => (
                  <option key={ailment.id} value={ailment.id}>{ailment.title}</option>
                ))
              ) : (
                <option disabled value="">{error ? 'Failed to load' : 'No ailments found'}</option>
              )}
            </select>
          </div>

          <div>
            <label htmlFor="remedy-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="remedy-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              required
            ></textarea>
          </div>

          <div>
            <label htmlFor="remedy-ingredient-input" className="block text-sm font-medium text-gray-700 mb-1">Ingredients</label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="remedy-ingredient-input"
                value={currentIngredient}
                onChange={(e) => setCurrentIngredient(e.target.value)}
                onKeyDown={handleIngredientKeyDown} // Handle Enter key
                className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Type ingredient and press Enter"
              />
              <button
                type="button"
                onClick={handleAddIngredient} // Handle button click
                className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 shrink-0"
              >
                Add
              </button>
            </div>
            {/* Display added ingredients as tags */}
            <div className="mt-2 flex flex-wrap gap-2">
              {ingredients.map((ing, index) => (
                <div key={index} className="flex items-center bg-emerald-100 text-emerald-700 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {ing}
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(ing)}
                    className="ml-1.5 flex-shrink-0 text-emerald-500 hover:text-emerald-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
             {ingredients.length === 0 && <p className="text-xs text-gray-500 mt-1">No ingredients added yet.</p>}
          </div>

          <div>
            <label htmlFor="remedy-preparation" className="block text-sm font-medium text-gray-700 mb-1">
              Preparation
            </label>
            <textarea
              id="remedy-preparation"
              value={preparation}
              onChange={(e) => setPreparation(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              required
            ></textarea>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600"
              disabled={loadingAilments}
            >
              Add Remedy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRemedyModal; 