import React from 'react';

export function Consultations() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-800">Your Consultations</h2>
        <p className="mt-2 text-gray-600">View and manage your upcoming and past consultations.</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800">Upcoming Consultations</h3>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            Schedule New
          </button>
        </div>
        {/* Add consultation list here */}
      </div>
    </div>
  );
} 