import React, { useState } from 'react';
import { User2, Mail, MessageSquare } from 'lucide-react';

function ConsultDoctor() {
  const [selectedSpecialist, setSelectedSpecialist] = useState('');

  const specialists = [
    { id: 1, type: 'Herbalist', name: 'Dr. Sarah Green', availability: 'Mon-Fri' },
    { id: 2, type: 'Naturopath', name: 'Dr. Michael Chen', availability: 'Tue-Sat' },
    { id: 3, type: 'Physician', name: 'Dr. Emily Wilson', availability: 'Mon-Thu' },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Consult a Specialist</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Available Specialists</h2>
            <div className="space-y-4">
              {specialists.map(specialist => (
                <div 
                  key={specialist.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedSpecialist === specialist.id
                      ? 'border-green-500 bg-green-50'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedSpecialist(specialist.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">{specialist.name}</h3>
                      <p className="text-gray-600">{specialist.type}</p>
                    </div>
                    <span className="text-sm text-gray-500">{specialist.availability}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Consultation Request</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Your Name</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 rounded-md border-gray-300 focus:ring-green-500 focus:border-green-500"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  className="block w-full pl-10 rounded-md border-gray-300 focus:ring-green-500 focus:border-green-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Your Query</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  className="block w-full pl-10 rounded-md border-gray-300 focus:ring-green-500 focus:border-green-500"
                  rows={4}
                  placeholder="Describe your health concern..."
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              disabled={!selectedSpecialist}
            >
              Submit Request
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ConsultDoctor;