import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Activity, Star, MessageSquare } from 'lucide-react';

function AilmentDetail() {
  const { slug } = useParams();

  // This would normally come from your database
  const ailments = {
    'stomach-ache': {
      name: "Stomach Ache",
      description: "A stomach ache (abdominal pain) is a common condition that can be caused by various factors including indigestion, gas, inflammation, or other digestive issues.",
      symptoms: [
        "Pain or discomfort in the abdomen",
        "Bloating and gas",
        "Nausea",
        "Loss of appetite",
        "Cramping"
      ],
      commonCauses: [
        "Indigestion",
        "Food allergies or sensitivities",
        "Gastritis",
        "Stress and anxiety",
        "Eating too quickly or overeating"
      ],
      relatedRemedies: [
        {
          id: 1,
          title: "Ginger Tea for Nausea",
          slug: "ginger-tea-nausea",
          rating: 4.5,
          comments: 24,
          description: "A soothing tea that helps calm the stomach and reduce nausea."
        },
        {
          id: 2,
          title: "Peppermint Oil Massage",
          slug: "peppermint-oil-massage",
          rating: 4.3,
          comments: 18,
          description: "Gentle abdominal massage with diluted peppermint oil to relieve stomach pain."
        }
      ]
    }
  };

  const ailment = ailments[slug as keyof typeof ailments];

  if (!ailment) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-2xl font-bold text-gray-800">Ailment not found</h1>
        <p className="mt-4 text-gray-600">The ailment you're looking for doesn't exist.</p>
        <Link to="/ailments" className="mt-4 inline-block text-green-600 hover:text-green-700">
          ← Back to Ailments
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center space-x-3 mb-6">
          <Activity className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-800">{ailment.name}</h1>
        </div>

        <div className="prose max-w-none">
          <p className="text-gray-600 text-lg mb-8">{ailment.description}</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Common Symptoms</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {ailment.symptoms.map((symptom, index) => (
                <li key={index}>{symptom}</li>
              ))}
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Common Causes</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {ailment.commonCauses.map((cause, index) => (
                <li key={index}>{cause}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Natural Remedies</h2>
            <div className="grid gap-6">
              {ailment.relatedRemedies.map(remedy => (
                <Link
                  key={remedy.id}
                  to={`/remedies/${remedy.slug}`}
                  className="block bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-800">{remedy.title}</h3>
                      <p className="text-gray-600">{remedy.description}</p>
                    </div>
                    <div className="flex items-center space-x-4 text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <span>{remedy.rating}/5</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="h-5 w-5" />
                        <span>{remedy.comments}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Disclaimer: This information is for educational purposes only and is not intended to diagnose, treat, cure, or prevent any disease. 
        Always consult with a qualified healthcare provider for medical advice and treatment.
      </p>
    </div>
  );
}

export default AilmentDetail;