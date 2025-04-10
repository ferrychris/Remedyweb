import { useState, useEffect } from 'react';

const ActiveAilments = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold text-gray-800">Active Ailments</h2>
      <p className="text-gray-600">0</p>
      <a href="/health-tracking" className="text-emerald-600 hover:text-emerald-700">
        Track health
      </a>
    </div>
  );
};

export default ActiveAilments; 