import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Leaf, Activity, ArrowLeft } from 'lucide-react';

type SearchResult = {
  type: 'remedy' | 'ailment';
  title: string;
  slug: string;
  description?: string;
};

export function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const performSearch = async () => {
      if (!query) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        // Search remedies
        const { data: remedies, error: remediesError } = await supabase
          .from('remedies')
          .select('title, slug, ingredients')
          .textSearch('title', query)
          .eq('status', 'approved');

        if (remediesError) throw remediesError;

        // Search ailments
        const { data: ailments, error: ailmentsError } = await supabase
          .from('ailment_categories')
          .select('name, slug, description')
          .textSearch('name', query);

        if (ailmentsError) throw ailmentsError;

        const searchResults: SearchResult[] = [
          ...(remedies?.map(remedy => ({
            type: 'remedy' as const,
            title: remedy.title,
            slug: remedy.slug,
            description: `Natural remedy with ${remedy.ingredients.split(',')[0]}`
          })) || []),
          ...(ailments?.map(ailment => ({
            type: 'ailment' as const,
            title: ailment.name,
            slug: ailment.slug,
            description: ailment.description
          })) || [])
        ];

        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8">
      <Link to="/" className="inline-flex items-center text-green-600 hover:text-green-700">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Home
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Search Results for "{query}"
        </h1>
        <p className="text-gray-600 mt-2">
          Found {results.length} {results.length === 1 ? 'result' : 'results'}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Searching...</p>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-6">
          {results.map((result, index) => (
            <Link
              key={index}
              to={`/${result.type}s/${result.slug}`}
              className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-green-50 rounded-lg">
                  {result.type === 'remedy' ? (
                    <Leaf className="h-6 w-6 text-green-600" />
                  ) : (
                    <Activity className="h-6 w-6 text-green-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{result.title}</h2>
                  {result.description && (
                    <p className="text-gray-600 mt-1">{result.description}</p>
                  )}
                  <span className="inline-block mt-2 text-sm text-green-600 font-medium">
                    {result.type === 'remedy' ? 'Natural Remedy' : 'Health Condition'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">No results found for "{query}"</p>
          <p className="text-gray-500 mt-2">Try different keywords or check your spelling</p>
        </div>
      )}
    </div>
  );
}