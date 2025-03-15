import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Mail, Phone, Facebook, Twitter, Instagram, Heart } from 'lucide-react';

function Footer() {
  return (
    <footer className="relative mt-24">
      {/* Top Wave Decoration */}
      <div className="absolute top-0 left-0 w-full transform -translate-y-full">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
          <path
            fill="#f8fafc"
            fillOpacity="1"
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>

      <div className="bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center shadow-inner">
                  <Leaf className="h-6 w-6 text-emerald-600" />
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                  Different Doctors
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Empowering your wellness journey through natural healing and holistic remedies.
              </p>
              <div className="flex space-x-4">
                <SocialLink href="#" icon={<Facebook className="h-5 w-5" />} />
                <SocialLink href="#" icon={<Twitter className="h-5 w-5" />} />
                <SocialLink href="#" icon={<Instagram className="h-5 w-5" />} />
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-6">Quick Links</h3>
              <ul className="space-y-4">
                <FooterLink href="/remedies">Natural Remedies</FooterLink>
                <FooterLink href="/ailments">Health Conditions</FooterLink>
                <FooterLink href="/store">Natural Products</FooterLink>
                <FooterLink href="/about">About Us</FooterLink>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-6">Legal</h3>
              <ul className="space-y-4">
                <FooterLink href="/privacy">Privacy Policy</FooterLink>
                <FooterLink href="/terms">Terms of Service</FooterLink>
                <FooterLink href="/disclaimer">Medical Disclaimer</FooterLink>
                <FooterLink href="/cookies">Cookie Policy</FooterLink>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-6">Get in Touch</h3>
              <div className="space-y-4">
                <a href="mailto:contact@differentdoctors.com" 
                   className="flex items-center space-x-3 text-gray-600 hover:text-emerald-600 transition-colors">
                  <Mail className="h-5 w-5" />
                  <span>contact@differentdoctors.com</span>
                </a>
                <a href="tel:+1234567890" 
                   className="flex items-center space-x-3 text-gray-600 hover:text-emerald-600 transition-colors">
                  <Phone className="h-5 w-5" />
                  <span>+1 (234) 567-890</span>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-gray-600 text-sm">
                &copy; {new Date().getFullYear()} Different Doctors. All rights reserved.
              </p>
              <p className="text-gray-600 text-sm flex items-center space-x-2">
                <span>Made with</span>
                <Heart className="h-4 w-4 text-red-500 inline" />
                <span>for a healthier world</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Helper component for footer links
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link 
        to={href} 
        className="text-gray-600 hover:text-emerald-600 transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}

// Helper component for social media links
function SocialLink({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-emerald-600 hover:border-emerald-600 transition-colors"
    >
      {icon}
    </a>
  );
}

export default Footer;