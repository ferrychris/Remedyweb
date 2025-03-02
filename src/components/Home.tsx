import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Activity, ShoppingBag } from 'lucide-react';

function Home() {
  return (
    <div className="space-y-12">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-800">The Home of Natural Remedies</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Explore natural remedies, discover traditional healing wisdom, and find the supplies you need.
        </p>
      </section>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <FeatureCard 
          icon={<Leaf className="h-8 w-8 text-green-600" />}
          title="Natural Remedies"
          description="Discover and share natural remedies with detailed ingredients and preparation steps."
          link="/remedies"
        />
        <FeatureCard 
          icon={<Activity className="h-8 w-8 text-purple-600" />}
          title="Ailments"
          description="Browse by condition to find specific remedies for your health concerns."
          link="/ailments"
        />
        <FeatureCard 
          icon={<ShoppingBag className="h-8 w-8 text-blue-600" />}
          title="Natural Products"
          description="Shop our curated selection of herbs, tinctures, and natural supplies."
          link="/store"
        />
      </div>

      <section className="bg-green-50 p-8 rounded-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Step number={1} title="Browse Remedies" description="Explore our collection of natural remedies and their reviews" />
          <Step number={2} title="Share" description="Add your remedies, rate and discuss with the community" />
          <Step number={3} title="Get Your Supplies" description="Shop all your premium natural herbs and remedies" />
        </div>
      </section>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
}

function FeatureCard({ icon, title, description, link }: FeatureCardProps) {
  return (
    <Link to={link} className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        <div className="inline-block p-2 bg-gray-50 rounded-lg">{icon}</div>
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </Link>
  );
}

interface StepProps {
  number: number;
  title: string;
  description: string;
}

function Step({ number, title, description }: StepProps) {
  return (
    <div className="text-center space-y-2">
      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto">
        {number}
      </div>
      <h3 className="font-semibold text-gray-800">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

export default Home;