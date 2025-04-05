import React from 'react';
import AvailabilityManager from './AvailabilityManager';
import PricingManager from './PricingManager';

function ConsultantDashboard() {
  // TODO: Fetch consultant data (name, etc.)
  const consultantName = "Dr. Example"; // Placeholder

  return (
    <div className="font-sans p-5 bg-gray-100 rounded-lg shadow-lg max-w-6xl mx-auto my-5">
      <h1 className="text-center text-2xl font-semibold text-gray-800 mb-8">{consultantName}'s Dashboard</h1>
      {/* Adjusted grid: 1 column on small screens, 2 on medium and up. Adjust 'md:grid-cols-2' as needed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AvailabilityManager />
        <PricingManager />
        {/* Add more sections as needed, e.g., Appointments, Profile Settings */}
      </div>
    </div>
  );
}

export default ConsultantDashboard; 