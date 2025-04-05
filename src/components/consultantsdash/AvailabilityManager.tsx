import React, { useState } from 'react';

function AvailabilityManager() {
  const [isAvailable, setIsAvailable] = useState(true);
  // TODO: Add state and logic for managing specific availability slots

  const toggleAvailability = () => {
    setIsAvailable(!isAvailable);
    // TODO: Add API call to update backend status
  };

  const handleCreateSlot = () => {
    // TODO: Implement logic to open a modal or form for creating a new time slot
    console.log("Open create slot form/modal");
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow">
      <h2 className="text-xl text-gray-700 mt-0 mb-5 border-b border-gray-200 pb-2">Manage Availability</h2>
      <div className="flex items-center gap-4 mb-5">
        <span className="text-gray-800">Current Status:</span>
        <span 
          className={`font-bold py-1 px-3 rounded text-white ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`}>
          {isAvailable ? 'Available' : 'Unavailable'}
        </span>
        <button 
          onClick={toggleAvailability} 
          className="py-2 px-4 border-none rounded cursor-pointer bg-blue-500 text-white transition duration-200 ease-in-out hover:bg-blue-700"
        >
          {isAvailable ? 'Turn Availability Off' : 'Turn Availability On'}
        </button>
      </div>

      <div className="mt-5">
        <h3 className="text-lg text-gray-600 mb-3">Your Availability Slots</h3>
        {/* TODO: List existing availability slots here */}
        <p className="text-gray-500 italic">No slots defined yet.</p>
        <button 
          onClick={handleCreateSlot} 
          className="mt-3 py-2 px-4 border-none rounded cursor-pointer bg-blue-500 text-white transition duration-200 ease-in-out hover:bg-blue-700"
        >
          Create New Slot
        </button>
      </div>
    </div>
  );
}

export default AvailabilityManager; 