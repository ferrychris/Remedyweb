import React from 'react';

const ActiveConsultations = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold text-gray-800">Active Consultations</h2>
      <p className="text-gray-600">0</p>
      <a href="/consultations" className="text-emerald-600 hover:text-emerald-700">
        View all consultations
      </a>
    </div>
  );
};

export default ActiveConsultations; 