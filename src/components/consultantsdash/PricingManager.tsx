import React, { useState } from 'react';
import { DollarSign, Edit2, Check, X } from 'lucide-react';

interface ConsultationPrice {
  name: string;
  price: number;
  duration: number;
}

interface ConsultationPrices {
  [key: string]: ConsultationPrice;
}

function PricingManager(): JSX.Element {
  const [consultationPrices, setConsultationPrices] = useState<ConsultationPrices>({
    standard: { name: 'Standard Consultation', price: 75, duration: 30 },
    extended: { name: 'Extended Consultation', price: 120, duration: 60 },
    followUp: { name: 'Follow-up Session', price: 50, duration: 20 }
  });
  
  const [editingType, setEditingType] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleEditClick = (type: string): void => {
    setEditingType(type);
    setEditValue(consultationPrices[type].price.toString());
  };

  const handleSavePrice = (): void => {
    if (!editValue || isNaN(Number(editValue)) || Number(editValue) <= 0) {
      alert("Please enter a valid positive price.");
      return;
    }

    setConsultationPrices(prev => ({
      ...prev,
      [editingType!]: {
        ...prev[editingType!],
        price: Number(editValue)
      }
    }));

    setEditingType(null);
    // TODO: Add API call to save price in backend
  };

  const handleCancelEdit = (): void => {
    setEditingType(null);
  };

  const handleAddService = (): void => {
    // Implementation for adding a new service type
    alert("Feature coming soon: Add custom consultation types");
  };

  return (
    <div>
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          Set your consultation prices for different session types. Patients will see these prices when booking appointments.
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(consultationPrices).map(([type, details]) => (
          <div 
            key={type} 
            className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center justify-between"
          >
            <div>
              <h3 className="font-medium text-gray-800">{details.name}</h3>
              <p className="text-sm text-gray-600">{details.duration} minutes</p>
            </div>

            <div className="flex items-center">
              {editingType === type ? (
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      <DollarSign className="h-4 w-4" />
                    </span>
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-24"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <button 
                    onClick={handleSavePrice}
                    className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full transition-colors"
                    title="Save"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={handleCancelEdit}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                    title="Cancel"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-xl text-gray-800">${details.price}</span>
                  <button 
                    onClick={() => handleEditClick(type)}
                    className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-gray-100 rounded-full transition-colors"
                    title="Edit price"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <button 
          onClick={handleAddService}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
        >
          + Add Custom Service Type
        </button>
      </div>

      <div className="mt-8 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <h3 className="font-medium text-yellow-800 mb-2">Pricing Tips</h3>
        <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
          <li>Consider your experience level and specialization when setting prices</li>
          <li>Research market rates for similar services in your area</li>
          <li>You can offer promotional rates for new patients</li>
          <li>Don't undersell your expertise - patients value quality care</li>
        </ul>
      </div>
    </div>
  );
}

export default PricingManager; 