import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Home, User, Calendar, ShoppingBag, BookOpen, Bookmark } from 'lucide-react';

export function NewUserDashboard() {
  return (
    <div className="flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white p-6 shadow-md">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <User className="h-8 w-8 text-emerald-500" />
            <div className="ml-3">
              <h2 className="text-lg font-bold">ferrychris95</h2>
              <p className="text-sm text-gray-600">Patient</p>
            </div>
          </div>
          <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg">
            Health Score: 85/100
          </div>
        </div>
        <nav className="space-y-4">
          <Link to="/ndashboard/overview" className="flex items-center text-emerald-600 hover:text-emerald-700">
            <Home className="h-5 w-5 mr-2" />
            Overview
          </Link>
          <Link to="/ndashboard/consultations" className="flex items-center text-gray-600 hover:text-emerald-700">
            <Calendar className="h-5 w-5 mr-2" />
            Consultations
          </Link>
          <Link to="/ndashboard/saved-remedies" className="flex items-center text-gray-600 hover:text-emerald-700">
            <Bookmark className="h-5 w-5 mr-2" />
            Saved Remedies
          </Link>
          <Link to="/ndashboard/health-tracking" className="flex items-center text-gray-600 hover:text-emerald-700">
            <BookOpen className="h-5 w-5 mr-2" />
            Health Tracking
          </Link>
          <Link to="/ndashboard/orders" className="flex items-center text-gray-600 hover:text-emerald-700">
            <ShoppingBag className="h-5 w-5 mr-2" />
            Orders
          </Link>
        </nav>
        <div className="mt-8">
          <button className="w-full text-red-600 hover:text-red-700">Sign Out</button>
          <button className="w-full mt-4 bg-emerald-500 text-white py-2 rounded-lg hover:bg-emerald-600">
            Upgrade to Pro
          </button>
        </div>
      </aside>

      {/* Main Content - Render nested route components here */}
      <main className="flex-1 p-8">
        <Outlet /> {/* Renders the matched nested route component */}
      </main>
    </div>
  );
}
