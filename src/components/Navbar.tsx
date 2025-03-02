import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, ShoppingBag, Home, Settings, Stethoscope, Activity, UserCircle } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { AuthModal } from './AuthModal';
import { SearchBar } from './SearchBar';

function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        accountMenuRef.current &&
        accountButtonRef.current &&
        !accountMenuRef.current.contains(event.target as Node) &&
        !accountButtonRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <nav className="bg-green-600 text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Leaf className="h-8 w-8" />
              <span className="font-bold text-xl">Different Doctors</span>
            </Link>
            
            <div className="flex-1 max-w-xl mx-8">
              <SearchBar />
            </div>
            
            <div className="flex space-x-8">
              <Link to="/" className="flex items-center space-x-1 hover:text-green-200">
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Link>
              <Link to="/remedies" className="flex items-center space-x-1 hover:text-green-200">
                <Leaf className="h-5 w-5" />
                <span>Remedies</span>
              </Link>
              <Link to="/ailments" className="flex items-center space-x-1 hover:text-green-200">
                <Activity className="h-5 w-5" />
                <span>Ailments</span>
              </Link>
              <Link to="/consult" className="flex items-center space-x-1 hover:text-green-200">
                <Stethoscope className="h-5 w-5" />
                <span>Consult</span>
              </Link>
              <Link to="/store" className="flex items-center space-x-1 hover:text-green-200">
                <ShoppingBag className="h-5 w-5" />
                <span>Store</span>
              </Link>
              {isAdmin && (
                <Link to="/admin" className="flex items-center space-x-1 hover:text-green-200">
                  <Settings className="h-5 w-5" />
                  <span>Admin</span>
                </Link>
              )}
              {user ? (
                <div className="relative">
                  <button
                    ref={accountButtonRef}
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                    className="flex items-center space-x-1 hover:text-green-200"
                  >
                    <UserCircle className="h-5 w-5" />
                    <span>Account</span>
                  </button>
                  {accountMenuOpen && (
                    <div
                      ref={accountMenuRef}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                    >
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          signOut();
                          setAccountMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center space-x-1 hover:text-green-200"
                >
                  <UserCircle className="h-5 w-5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}

export default Navbar;