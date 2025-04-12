import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Leaf, Activity, ShoppingBag, Stethoscope, UserCircle, Heart } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useAuth } from './lib/auth';

function Sidebar({ isOpen, toggleSidebar }) {
  const { user } = useAuth();
  const [overallRating, setOverallRating] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchOverallRating();
    }
  }, [user]);

  const fetchOverallRating = async () => {
    try {
      const { data, error } = await supabase
        .from('health_reviews')
        .select('overall_rating')
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setOverallRating(data?.overall_rating || null);
    } catch (error) {
      console.error('Error fetching overall rating:', error);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 80) return 'text-emerald-500';
    if (rating >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div
      className={`fixed top-0 left-0 h-screen w-64 bg-white shadow-md transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out z-50 md:hidden`}
    >
      <div className="pt-20">
        {/* Health Score Display */}
        {overallRating !== null && (
          <div className="px-4 mb-6">
            <div className="bg-emerald-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Heart className="h-5 w-5 text-emerald-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Health Score</span>
                </div>
                <div className={`text-lg font-bold ${getRatingColor(overallRating)}`}>
                  {overallRating}%
                </div>
              </div>
            </div>
          </div>
        )}

        <nav className="mt-5">
          <ul className="space-y-4 px-4">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex items-center space-x-2 p-2 rounded-lg ${
                    isActive ? 'bg-emerald-100 text-emerald-600' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'
                  }`
                }
                onClick={toggleSidebar}
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/remedies"
                className={({ isActive }) =>
                  `flex items-center space-x-2 p-2 rounded-lg ${
                    isActive ? 'bg-emerald-100 text-emerald-600' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'
                  }`
                }
                onClick={toggleSidebar}
              >
                <Leaf className="h-5 w-5" />
                <span>Remedies</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/ailments"
                className={({ isActive }) =>
                  `flex items-center space-x-2 p-2 rounded-lg ${
                    isActive ? 'bg-emerald-100 text-emerald-600' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'
                  }`
                }
                onClick={toggleSidebar}
              >
                <Activity className="h-5 w-5" />
                <span>Ailments</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/store"
                className={({ isActive }) =>
                  `flex items-center space-x-2 p-2 rounded-lg ${
                    isActive ? 'bg-emerald-100 text-emerald-600' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'
                  }`
                }
                onClick={toggleSidebar}
              >
                <ShoppingBag className="h-5 w-5" />
                <span>Store</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/consult"
                className={({ isActive }) =>
                  `flex items-center space-x-2 p-2 rounded-lg ${
                    isActive ? 'bg-emerald-100 text-emerald-600' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'
                  }`
                }
                onClick={toggleSidebar}
              >
                <Stethoscope className="h-5 w-5" />
                <span>Consult Doctor</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/ndashboard"
                className={({ isActive }) =>
                  `flex items-center space-x-2 p-2 rounded-lg ${
                    isActive ? 'bg-emerald-100 text-emerald-600' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'
                  }`
                }
                onClick={toggleSidebar}
              >
                <UserCircle className="h-5 w-5" />
                <span>Dashboard</span>
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

export default Sidebar;