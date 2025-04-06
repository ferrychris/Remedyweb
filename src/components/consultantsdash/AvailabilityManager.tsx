import React, { useState } from 'react';
import { Clock, Plus, X, Calendar } from 'lucide-react';

interface AvailabilitySlot {
  id: number;
  day: string;
  startTime: string;
  endTime: string;
}

interface NewSlot {
  day: string;
  startTime: string;
  endTime: string;
}

function AvailabilityManager(): JSX.Element {
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [showCreateSlotForm, setShowCreateSlotForm] = useState<boolean>(false);
  const [newSlot, setNewSlot] = useState<NewSlot>({
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00'
  });
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([
    { id: 1, day: 'Monday', startTime: '09:00', endTime: '12:00' },
    { id: 2, day: 'Wednesday', startTime: '13:00', endTime: '17:00' },
    { id: 3, day: 'Friday', startTime: '10:00', endTime: '15:00' }
  ]);

  const toggleAvailability = (): void => {
    setIsAvailable(!isAvailable);
    // TODO: Add API call to update backend status
  };

  const handleCreateSlot = (): void => {
    setShowCreateSlotForm(true);
  };

  const handleCloseForm = (): void => {
    setShowCreateSlotForm(false);
    setNewSlot({
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:00'
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setNewSlot(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSlot = (): void => {
    const newId = availabilitySlots.length > 0 
      ? Math.max(...availabilitySlots.map(slot => slot.id)) + 1 
      : 1;
    
    setAvailabilitySlots([
      ...availabilitySlots,
      { 
        id: newId, 
        day: newSlot.day, 
        startTime: newSlot.startTime, 
        endTime: newSlot.endTime 
      }
    ]);
    
    handleCloseForm();
    // TODO: Add API call to save in backend
  };

  const handleDeleteSlot = (id: number): void => {
    setAvailabilitySlots(availabilitySlots.filter(slot => slot.id !== id));
    // TODO: Add API call to delete in backend
  };

  const weekdays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div>
      {/* Current availability status */}
      <div className="mb-8">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium text-gray-700">
              Current Status: {isAvailable ? 'Available for Consultations' : 'Not Available'}
            </span>
          </div>
          <button 
            onClick={toggleAvailability}
            className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${
              isAvailable 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isAvailable ? 'Turn Off Availability' : 'Turn On Availability'}
          </button>
        </div>
      </div>

      {/* Availability Slots */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800">Weekly Availability Schedule</h3>
          <button 
            onClick={handleCreateSlot}
            className="flex items-center text-sm bg-emerald-500 text-white px-3 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Time Slot
          </button>
        </div>

        {/* List of availability slots */}
        <div className="space-y-3">
          {availabilitySlots.length > 0 ? (
            availabilitySlots.map(slot => (
              <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="font-medium text-gray-700 mr-2">{slot.day}:</span>
                  <span className="text-gray-600">{slot.startTime} - {slot.endTime}</span>
                </div>
                <button 
                  onClick={() => handleDeleteSlot(slot.id)}
                  className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                  aria-label="Delete time slot"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic p-4 bg-gray-50 rounded-lg">No availability slots defined yet.</p>
          )}
        </div>
      </div>

      {/* Create Slot Form Modal */}
      {showCreateSlotForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Add Availability Slot</h3>
              <button 
                onClick={handleCloseForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
                <select
                  name="day"
                  value={newSlot.day}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {weekdays.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  name="startTime"
                  value={newSlot.startTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  name="endTime"
                  value={newSlot.endTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={handleCloseForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSlot}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  Add Slot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AvailabilityManager; 