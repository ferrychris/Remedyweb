import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Define proper types
type SearchResultType = "remedy" | "ailment";

interface SearchResult {
  type: SearchResultType;
  title: string;
  slug: string;
  description: string;
}

export function SearchBar() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch remedies from Supabase
      const { data: remedyData, error: remedyError } = await supabase
        .from('remedies')
        .select('title, slug, description')
        .ilike('title', `%${searchQuery}%`)
        .limit(5);

      if (remedyError) throw remedyError;

      // Fetch ailments from Supabase
      const { data: ailmentData, error: ailmentError } = await supabase
        .from('ailments')
        .select('title, description')
        .ilike('title', `%${searchQuery}%`)
        .limit(5);

      if (ailmentError) throw ailmentError;

      const remedyResults = remedyData?.map((remedy) => ({
        type: "remedy" as SearchResultType,
        title: remedy.title,
        slug: remedy.slug,
        description: remedy.description || '',
      })) || [];
      
      const ailmentResults = ailmentData?.map((ailment) => ({
        type: "ailment" as SearchResultType,
        title: ailment.title,
        slug: ailment.title, // Using title as slug since slug column doesn't exist
        description: ailment.description || '',
      })) || [];
      
      setResults([...remedyResults, ...ailmentResults]);
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to fetch search results. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setResults([]);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) handleSearch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search remedies and ailments..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setResults([]);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Results dropdown */}
      {(results.length > 0 || isLoading || error) && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-lg shadow-lg overflow-hidden z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin h-5 w-5 border-t-2 border-emerald-500 rounded-full mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Searching...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500 text-sm">
              {error}
            </div>
          ) : (
            <>
              {results.map((result, i) => (
                <Link
                  key={i}
                  to={`/${result.type === 'remedy' ? 'remedies' : 'ailments'}/${result.slug}`}
                  className="block px-4 py-3 hover:bg-emerald-50 border-b last:border-b-0 transition-colors"
                  onClick={() => {
                    setSearchQuery('');
                    setResults([]);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900">{result.title}</div>
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-600 capitalize">
                      {result.type}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {result.description}
                  </div>
                </Link>
              ))}
              <button
                onClick={handleSubmit}
                className="w-full px-4 py-3 text-left text-sm text-emerald-600 hover:bg-emerald-50 font-medium border-t border-gray-100"
              >
                View all results for "{searchQuery}"
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}