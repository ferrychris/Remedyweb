import { useState, useEffect } from 'react';

const RecentActivity = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
      <ul className="space-y-4">
        <li className="flex justify-between">
          <span>Consultation Scheduled</span>
          <span className="text-gray-500">2 hours ago</span>
        </li>
        <li className="flex justify-between">
          <span>New Remedy Saved</span>
          <span className="text-gray-500">Yesterday</span>
        </li>
        <li className="flex justify-between">
          <span>Order Delivered</span>
          <span className="text-gray-500">2 days ago</span>
        </li>
      </ul>
    </div>
  );
};

export default RecentActivity; 