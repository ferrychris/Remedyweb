import React, { useState } from 'react';

function PricingManager() {
  const [consultationPrice, setConsultationPrice] = useState(''); // Default price or fetch from backend

  const handlePriceChange = (event) => {
    setConsultationPrice(event.target.value);
  };

  const handleSetPrice = () => {
    // TODO: Add input validation
    if (!consultationPrice || isNaN(consultationPrice) || consultationPrice <= 0) {
        alert("Please enter a valid positive price.");
        return;
    }
    console.log('Setting price:', consultationPrice);
    // TODO: Add API call to update the price in the backend
    alert(`Consultation price set to: $${consultationPrice}`);
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow">
      <h2 className="text-xl text-gray-700 mt-0 mb-5 border-b border-gray-200 pb-2">Set Consultation Price</h2>
      <div className="flex items-center gap-3">
        <label htmlFor="consultation-price" className="text-gray-800">Price per session ($):</label>
        <input
          type="number"
          id="consultation-price"
          value={consultationPrice}
          onChange={handlePriceChange}
          min="0"
          step="0.01"
          placeholder="e.g., 50"
          className="p-2 border border-gray-300 rounded w-20"
        />
        <button 
          onClick={handleSetPrice} 
          className="py-2 px-4 border-none rounded cursor-pointer bg-teal-500 text-white transition duration-200 ease-in-out hover:bg-teal-700"
        >
          Set Price
        </button>
      </div>
      {/* Optional: Display current price if needed */}
      {/* {consultationPrice && <p className="mt-3 text-gray-600">Current Price: ${consultationPrice}</p>} */}
    </div>
  );
}

export default PricingManager; 