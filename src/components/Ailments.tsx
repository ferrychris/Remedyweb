import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

function Ailments() {
  const ailments = [
    {
      category: "Digestive Issues",
      conditions: [
        { name: "Stomach Ache", slug: "stomach-ache", remedyCount: 8 },
        { name: "Ulcer", slug: "ulcer", remedyCount: 5 },
        { name: "Indigestion", slug: "indigestion", remedyCount: 12 },
        { name: "Acid Reflux", slug: "acid-reflux", remedyCount: 6 }
      ]
    },
    {
      category: "Pain & Inflammation",
      conditions: [
        { name: "Headache", slug: "headache", remedyCount: 15 },
        { name: "Joint Pain", slug: "joint-pain", remedyCount: 10 },
        { name: "Muscle Aches", slug: "muscle-aches", remedyCount: 7 },
        { name: "Back Pain", slug: "back-pain", remedyCount: 9 }
      ]
    },
    {
      category: "Skin Conditions",
      conditions: [
        { name: "Psoriasis", slug: "psoriasis", remedyCount: 6 },
        { name: "Eczema", slug: "eczema", remedyCount: 8 },
        { name: "Acne", slug: "acne", remedyCount: 11 },
        { name: "Rashes", slug: "rashes", remedyCount: 7 }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <Activity className="h-8 w-8 text-green-600" />
        <h1 className="text-3xl font-bold text-gray-800">Common Ailments</h1>
      </div>

      <p className="text-gray-600 max-w-3xl">
        Browse through common health conditions and discover natural remedies that may help provide relief. 
        Always consult with a healthcare provider before trying any new treatment.
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {ailments.map((category) => (
          <div key={category.category} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{category.category}</h2>
            <div className="space-y-3">
              {category.conditions.map((condition) => (
                <Link
                  key={condition.slug}
                  to={`/ailments/${condition.slug}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-gray-700">{condition.name}</span>
                  <span className="text-sm text-gray-500">{condition.remedyCount} remedies</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Ailments;