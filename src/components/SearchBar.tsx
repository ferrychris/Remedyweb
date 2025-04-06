import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Define proper types
type SearchResultType = "remedy" | "ailment" | "product";

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
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Fetch remedies from Supabase
      const { data: remedyData, error: remedyError } = await supabase
        .from('remedies')
        .select('name, slug, description')
        .ilike('name', `%${searchQuery}%`)
        .limit(5);

      if (remedyError) throw remedyError;

      // Fetch ailments from Supabase
      const { data: ailmentData, error: ailmentError } = await supabase
        .from('ailments')
        .select('name, slug, description')
        .ilike('name', `%${searchQuery}%`)
        .limit(5);

      if (ailmentError) throw ailmentError;

      // Fetch products from Supabase
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('id, name, slug, description')
        .ilike('name', `%${searchQuery}%`)
        .limit(5);

      if (productError) throw productError;

      // Fix type issues by properly casting or mapping the results
      const remedyResults = remedyData?.map((remedy: { name: string; slug: string; description: string | null }) => ({
        type: "remedy" as SearchResultType,
        title: remedy.name,
        slug: remedy.slug,
        description: remedy.description || '',
      })) || [];
      
      const ailmentResults = ailmentData?.map((ailment: { name: string; slug: string; description: string | null }) => ({
        type: "ailment" as SearchResultType,
        title: ailment.name,
        slug: ailment.slug,
        description: ailment.description || '',
      })) || [];
      
      const productResults = productData?.map((product: { id: string; name: string; slug: string | null; description: string | null }) => ({
        type: "product" as SearchResultType,
        title: product.name,
        slug: product.slug || product.id,
        description: product.description || '',
      })) || [];
      
      setResults([...remedyResults, ...ailmentResults, ...productResults]);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
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
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search remedies and ailments..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-300" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setResults([]);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Results dropdown */}
      {results.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-lg shadow-lg overflow-hidden z-10">
          {results.map((result, i) => (
            <Link
              key={i}
              to={`/${result.type === 'remedy' ? 'remedies' : result.type === 'ailment' ? 'ailments' : 'store'}/${result.slug}`}
              className="block px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
              onClick={() => {
                setSearchQuery('');
                setResults([]);
              }}
            >
              <div className="text-sm font-medium text-gray-900">{result.title}</div>
              <div className="text-xs text-gray-500 mt-1">{result.description.substring(0, 100)}{result.description.length > 100 ? '...' : ''}</div>
              <div className="text-xs text-emerald-500 mt-1 capitalize">{result.type}</div>
            </Link>
          ))}
          <button
            onClick={handleSubmit}
            className="w-full px-4 py-3 text-left text-sm text-green-600 hover:bg-gray-50 font-medium"
          >
            View all results for "{searchQuery}"
          </button>
        </div>
      )}
    </div>
  );
}