import React from 'react';

const TodaysReminders = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold text-gray-800">Today's Reminders</h2>
      <ul className="space-y-4">
        <li className="flex justify-between">
          <span>Take Vitamins</span>
          <span className="text-gray-500">9:00 AM</span>
        </li>
        <li className="flex justify-between">
          <span>Virtual Consultation</span>
          <span className="text-gray-500">2:30 PM</span>
        </li>
        <li className="flex justify-between">
          <span>Log Blood Pressure</span>
          <span className="text-gray-500">6:00 PM</span>
        </li>
      </ul>
    </div>
  );
};

export default TodaysReminders; 