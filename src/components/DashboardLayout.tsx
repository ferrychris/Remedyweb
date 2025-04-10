import React from 'react';
// import Navbar from './Navbar'; // This import is unused
import { Outlet, useLocation } from 'react-router-dom';
import Footer from './Footer';

/**
 * DashboardLayout is a layout component that conditionally renders the Navbar and Footer
 * based on whether the current route is a dashboard route.
 */
const DashboardLayout: React.FC = () => {
  const location = useLocation();
  
  // Check if the current route is a dashboard route
  const isDashboardRoute = 
    location.pathname.includes('/consultant-dashboard') || 
    location.pathname.includes('/ndashboard') ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Only show Navbar if not on a dashboard route */}
      {/* {!isDashboardRoute && <Navbar />} */}

      {/* Main content */}
      <main className={`flex-1 ${!isDashboardRoute ? 'container mx-auto px-4 py-8' : ''}`}>
        <Outlet />
      </main>

      {/* Only show Footer if not on a dashboard route */}
      {!isDashboardRoute && <Footer />}
    </div>
  );
};

export default DashboardLayout; 