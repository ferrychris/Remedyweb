import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Mail, Phone, Facebook, Twitter, Instagram, Heart } from 'lucide-react';

function Footer() {
  return (
    <footer className="relative mt-16 sm:mt-24">
      {/* Simplified Wave Decoration */}
      <div className="absolute top-0 left-0 right-0 h-10 sm:h-16 -mt-1 overflow-hidden">
        <div className="absolute bottom-0 inset-x-0 h-16 bg-slate-50 rounded-t-[100%]"></div>
      </div>

      <div className="bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-6 sm:pb-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
            {/* Brand Section */}
            <div className="col-span-2 sm:col-span-1 space-y-4 sm:space-y-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center shadow-inner">
                  <Leaf className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                </div>
                <span className="font-bold text-lg sm:text-xl bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                  Different Doctors
                </span>
              </div>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Empowering your wellness journey through natural healing and holistic remedies.
              </p>
              <div className="flex space-x-3 sm:space-x-4">
                <SocialLink href="#" icon={<Facebook className="h-4 w-4 sm:h-5 sm:w-5" />} />
                <SocialLink href="#" icon={<Twitter className="h-4 w-4 sm:h-5 sm:w-5" />} />
                <SocialLink href="#" icon={<Instagram className="h-4 w-4 sm:h-5 sm:w-5" />} />
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-3 sm:mb-6">Quick Links</h3>
              <ul className="space-y-2 sm:space-y-4 text-sm sm:text-base">
                <FooterLink href="/remedies">Natural Remedies</FooterLink>
                <FooterLink href="/ailments">Health Conditions</FooterLink>
                <FooterLink href="/store">Natural Products</FooterLink>
                <FooterLink href="/about">About Us</FooterLink>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-3 sm:mb-6">Legal</h3>
              <ul className="space-y-2 sm:space-y-4 text-sm sm:text-base">
                <FooterLink href="/privacy">Privacy Policy</FooterLink>
                <FooterLink href="/terms">Terms of Service</FooterLink>
                <FooterLink href="/disclaimer">Medical Disclaimer</FooterLink>
                <FooterLink href="/cookies">Cookie Policy</FooterLink>
              </ul>
            </div>

            {/* Contact */}
            <div className="col-span-2 sm:col-span-1">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-3 sm:mb-6">Get in Touch</h3>
              <div className="space-y-2 sm:space-y-4">
                <a href="mailto:contact@differentdoctors.com" 
                   className="flex items-center space-x-2 sm:space-x-3 text-sm sm:text-base text-gray-600 hover:text-emerald-600 transition-colors">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="break-all">contact@differentdoctors.com</span>
                </a>
                <a href="tel:+1234567890" 
                   className="flex items-center space-x-2 sm:space-x-3 text-sm sm:text-base text-gray-600 hover:text-emerald-600 transition-colors">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>+1 (234) 567-890</span>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-8 sm:mt-16 pt-4 sm:pt-8 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
              <p className="text-gray-600 text-xs sm:text-sm text-center sm:text-left">
                &copy; {new Date().getFullYear()} Different Doctors. All rights reserved.
              </p>
              <p className="text-gray-600 text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2">
                <span>Made with</span>
                <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 inline" />
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
      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-emerald-600 hover:border-emerald-600 transition-colors"
    >
      {icon}
    </a>
  );
}

export default Footer;