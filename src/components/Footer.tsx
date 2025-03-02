import React from 'react';
import { Leaf, Mail, Phone } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Leaf className="h-6 w-6" />
              <span className="font-bold text-lg">Different Doctors</span>
            </div>
            <p className="text-gray-400">
              Connecting you with Herbal Specialists and Natural Remedy Experts.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/remedies" className="text-gray-400 hover:text-white">Natural Remedies</a></li>
              <li><a href="/consult" className="text-gray-400 hover:text-white">Consult a Specialist</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">About Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
            <div className="space-y-2">
              <a href="mailto:contact@differentdoctors.com" className="flex items-center space-x-2 text-gray-400 hover:text-white">
                <Mail className="h-5 w-5" />
                <span>contact@differentdoctors.com</span>
              </a>
              <a href="tel:+1234567890" className="flex items-center space-x-2 text-gray-400 hover:text-white">
                <Phone className="h-5 w-5" />
                <span>+1 (234) 567-890</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Different Doctors. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer