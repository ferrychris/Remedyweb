import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

type SearchResult = {
  type: 'remedy' | 'ailment' | 'product';
  title: string;
  slug: string;
  description?: string;
};

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Mock search results for demonstration
      const mockResults: SearchResult[] = [
        {
          type: 'remedy',
          title: 'Ginger Tea for Nausea',
          slug: 'ginger-tea-nausea',
          description: 'Natural remedy for nausea and digestive issues'
        },
        {
          type: 'remedy',
          title: 'Honey & Lemon for Sore Throat',
          slug: 'honey-lemon-sore-throat',
          description: 'Soothing remedy for sore throat and cough'
        },
        {
          type: 'ailment',
          title: 'Headache',
          slug: 'headache',
          description: 'Natural treatments for various types of headaches'
        },
        {
          type: 'product',
          title: 'Organic Echinacea Tincture',
          slug: 'organic-echinacea-tincture',
          description: 'Immune system support tincture'
        }
      ].filter(result => 
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setResults(mockResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setResults([]);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query) handleSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search remedies and ailments..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-300" />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <X className="h-5 w-5 text-gray-300 hover:text-white" />
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <Link
              key={index}
              to={`/${result.type}s/${result.slug}`}
              className="block px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
            >
              <div className="flex items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{result.title}</h3>
                  {result.description && (
                    <p className="text-sm text-gray-500">{result.description}</p>
                  )}
                  <span className="text-xs text-green-600 mt-1 inline-block">
                    {result.type === 'remedy' ? 'Remedy' : result.type === 'ailment' ? 'Ailment' : 'Product'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          <button
            onClick={handleSubmit}
            className="w-full px-4 py-3 text-left text-sm text-green-600 hover:bg-gray-50 font-medium"
          >
            View all results for "{query}"
          </button>
        </div>
      )}
    </form>
  );
}