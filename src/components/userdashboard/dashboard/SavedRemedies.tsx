import React from 'react';

export function SavedRemedies() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-800">Saved Remedies</h2>
        <p className="mt-2 text-gray-600">Your collection of saved health remedies and treatments.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Add saved remedies cards here */}
      </div>
    </div>
  );
} 