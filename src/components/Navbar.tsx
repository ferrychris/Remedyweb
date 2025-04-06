import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Leaf,
  ShoppingBag,
  Home,
  Settings,
  Stethoscope,
  Activity,
  UserCircle,
  Search,
  Menu,
  X,
  ShoppingCart,
  Bell,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { AuthModal } from "./AuthModal";
import { SearchBar } from "./SearchBar";
import { motion, AnimatePresence } from 'framer-motion';
import UserNavbar from './userdashboard/UserNavbar';

function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();

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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const openAuthModal = (signUp: boolean) => {
    setIsSignUpMode(signUp);
    setShowAuthModal(true);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-emerald-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center space-x-3 text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center shadow-inner">
                <Leaf className="h-6 w-6" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                Different Doctors
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              <NavLink to="/" active={isActive("/")}>
                <Home className="h-5 w-5" />
                <span>Home</span>
              </NavLink>
              <NavLink to="/remedies" active={isActive("/remedies")}>
                <Leaf className="h-5 w-5" />
                <span>Remedies</span>
              </NavLink>
              <NavLink to="/ailments" active={isActive("/ailments")}>
                <Activity className="h-5 w-5" />
                <span>Ailments</span>
              </NavLink>
              <NavLink to="/store" active={isActive("/store")}>
                <ShoppingBag className="h-5 w-5" />
                <span>Store</span>
              </NavLink>
            </div>

            {/* Search and Account */}
            <div className="flex items-center space-x-6">
              <div className="hidden md:block w-64">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <SearchBar />
                </div>
              </div>

              {user ? (
                <div className="relative" ref={accountMenuRef}>
                  <button
                    ref={accountButtonRef}
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-emerald-600 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                      <UserCircle className="h-6 w-6 text-emerald-600" />
                    </div>
                  </button>

                  {accountMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-100 shadow-lg py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {profile?.display_name || "User"}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <Link
                        to="/ndashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        My Dashboard
                      </Link>
                      {/* Consultant Dashboard link */}
                      <Link
                        to="/consultant-dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        Consultant Dashboard
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          signOut();
                          setAccountMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={() => openAuthModal(false)}
                    className="px-5 py-2 bg-white text-emerald-600 border border-emerald-200 rounded-full font-medium hover:bg-emerald-50 transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => openAuthModal(true)}
                    className="px-5 py-2 bg-emerald-600 text-white rounded-full font-medium hover:bg-emerald-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-20" />

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultIsSignUp={isSignUpMode}
        />
      )}
    </>
  );
}

// NavLink component for consistent styling
function NavLink({
  to,
  children,
  active,
}: {
  to: string;
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
        active
          ? "bg-emerald-100 text-emerald-600"
          : "text-gray-600 hover:text-emerald-600 hover:bg-emerald-50"
      }`}
    >
      {children}
    </Link>
  );
}

export default Navbar;
