import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Activity, ShoppingBag, User, Heart, Brain } from 'lucide-react';

function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-white via-emerald-50/30 to-white overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute -right-10 -top-10 w-72 h-72 bg-emerald-100 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute -left-10 top-40 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-20"></div>
        </div>

        {/* Floating Profile Images */}
        <div className="relative max-w-6xl mx-auto px-4 pt-24 pb-40">
          {/* Profile Images with Animations */}
          <div className="absolute left-20 top-20 animate-float-slow">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
              <User className="w-12 h-12 text-yellow-600" />
            </div>
          </div>
          <div className="absolute right-32 top-24 animate-float-medium">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
              <Heart className="w-12 h-12 text-blue-600" />
            </div>
          </div>
          <div className="absolute left-1/3 -top-4 animate-float-fast">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
              <Brain className="w-12 h-12 text-emerald-600" />
            </div>
          </div>

          {/* Main Hero Content */}
          <div className="relative text-center space-y-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <span className="inline-block text-emerald-600 font-semibold bg-emerald-50 px-4 py-2 rounded-full text-sm">
                Welcome to RemedyWeb
              </span>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                Simplify Your Natural Healing.
                <br />
                <span className="text-emerald-600">Accelerate Your Wellness.</span>
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Transform your journey to wellness with our comprehensive natural healing platform. 
              Find remedies, share knowledge, and access premium natural products.
            </p>
            <div className="flex items-center justify-center space-x-4 pt-4">
              <Link
                to="/remedies"
                className="px-8 py-4 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-emerald-300/50 relative z-10"
              >
                Explore Remedies
              </Link>
              <Link
                to="/about"
                className="px-8 py-4 bg-white text-emerald-600 rounded-full font-semibold hover:bg-emerald-50 border-2 border-emerald-200 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-emerald-100/50 relative z-10"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>

        {/* Enhanced Wave Divider with Background */}
        <div className="absolute bottom-0 w-full bg-emerald-50/70">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full translate-y-1">
            <path
              fill="#f0fdf4"
              fillOpacity="1"
              d="M0,160L48,144C96,128,192,96,288,90.7C384,85,480,107,576,128C672,149,768,171,864,165.3C960,160,1056,128,1152,122.7C1248,117,1344,139,1392,149.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>

        {/* Additional decorative gradient for wave section */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-emerald-50/30 to-transparent"></div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-b from-green-50 to-white py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-emerald-600 font-medium">Our Services</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2">Comprehensive Natural Solutions</h2>
            <p className="text-xl text-gray-600 mt-4 max-w-2xl mx-auto">
              Discover our range of natural healing services designed to support your wellness journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Leaf className="h-8 w-8 text-emerald-600" />}
              title="Natural Remedies"
              description="Access our comprehensive database of natural remedies, complete with preparation guides and usage instructions."
              link="/remedies"
            />
            <FeatureCard 
              icon={<Activity className="h-8 w-8 text-purple-600" />}
              title="Health Conditions"
              description="Find targeted natural solutions for specific health conditions, backed by traditional wisdom."
              link="/ailments"
            />
            <FeatureCard 
              icon={<ShoppingBag className="h-8 w-8 text-blue-600" />}
              title="Premium Products"
              description="Shop our carefully selected collection of high-quality natural herbs and healing supplies."
              link="/store"
            />
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-emerald-600 font-medium">Simple Process</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2">How It Works</h2>
            <p className="text-xl text-gray-600 mt-4 max-w-2xl mx-auto">
              Start your natural healing journey in three simple steps
            </p>
          </div>
          
          <div className="relative">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-50 via-transparent to-transparent opacity-50 rounded-3xl"></div>
            <div className="relative bg-white rounded-3xl border border-emerald-100/50 shadow-lg p-12 backdrop-blur-sm">
              <div className="grid md:grid-cols-3 gap-12">
                <Step 
                  number={1} 
                  title="Browse Remedies" 
                  description="Explore our extensive collection of natural remedies and healing solutions" 
                />
                <Step 
                  number={2} 
                  title="Share Knowledge" 
                  description="Contribute your expertise and learn from our growing community" 
                />
                <Step 
                  number={3} 
                  title="Get Your Supplies" 
                  description="Access premium quality natural products for your healing journey" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
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
    <Link to={link} className="group">
      <div className="bg-white rounded-2xl p-8 transition-all duration-300 hover:shadow-xl border border-emerald-100/50 hover:border-emerald-200 relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-50/50 to-transparent rounded-bl-full transform translate-x-16 -translate-y-16 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform duration-300"></div>
        <div className="relative z-10">
          <div className="mb-6 inline-block p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl">
            {icon}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
          <p className="text-gray-600">{description}</p>
          <div className="mt-6 flex items-center text-emerald-600 font-medium group-hover:text-emerald-700">
            Learn more
            <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
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
    <div className="relative">
      <div className="absolute -left-4 top-0 w-12 h-12 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-semibold text-lg">
        {number}
      </div>
      <div className="pl-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
      {number < 3 && (
        <div className="hidden md:block absolute top-6 left-full w-full transform -translate-x-24">
          <svg className="w-24 h-8 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path className="opacity-50" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      )}
    </div>
  );
}

export default Home;