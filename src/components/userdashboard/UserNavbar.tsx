import React, { useState, useEffect, useRef } from 'react';
import { Search, Menu, X, ShoppingCart, Calendar } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { Link } from 'react-router-dom';
import { getCartItems, getCartTotal, getCartCount, CartItem } from '../../lib/cart';
import BookingModal from './consultation/BookingModal';

interface UserNavbarProps {
  toggleSidebar: () => void;
  sidebarVisible: boolean;
}

const UserNavbar: React.FC<UserNavbarProps> = ({ toggleSidebar, sidebarVisible }) => {
  const { user, profile } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState<string | null>(null);
  
  // Refs for dropdown positioning
  const cartRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setShowCart(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Fetch cart items when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchCartItems();
    } else {
      setCartItems([]);
    }
  }, [user]);
  
  const fetchCartItems = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('Fetching cart items...');
      
      const items = await getCartItems(user.id);
      console.log('Cart items:', items);
      setCartItems(items);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const cartCount = getCartCount(cartItems);
  const cartTotal = getCartTotal(cartItems);

  const handleBookingSuccess = () => {
    setSelectedConsultant(null);
  };
  
  return (
    <div className="bg-white border-b border-gray-200 h-16 px-2 sm:px-4 flex items-center justify-between">
      {/* Left side - Menu toggle and Title */}
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar} 
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none mr-1 sm:mr-2 lg:hidden"
          aria-label="Toggle sidebar"
        >
          {sidebarVisible ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        
        <h1 className="text-lg sm:text-xl font-semibold text-emerald-600 hidden sm:block">Remedy<span className="text-gray-800">Web</span></h1>
        
        <div className="relative ml-2 sm:ml-8 hidden md:block">
          <input
            type="text"
            placeholder="Search remedies..."
            className="w-32 sm:w-64 pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div className="absolute left-2 top-2 text-gray-400">
            <Search className="h-4 w-4" />
          </div>
        </div>
      </div>
      
      {/* Right side - Cart, Consultation, and Profile */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        {/* Consultation Button */}
        <button
          onClick={() => setSelectedConsultant('new')}
          className="flex items-center px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
        >
          <Calendar className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Book Consultation</span>
        </button>

        <div className="relative" ref={cartRef}>
          <button 
            onClick={() => {
              setShowCart(!showCart);
              setShowProfile(false);
            }}
            className="p-1.5 sm:p-2 relative rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
            aria-label="Shopping cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                {cartCount}
              </span>
            )}
          </button>
          
          {showCart && (
            <div className="absolute right-0 mt-2 w-screen sm:w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 max-h-[calc(100vh-4rem)] sm:max-h-[80vh] fixed sm:relative left-0 sm:left-auto bottom-0 sm:bottom-auto">
              <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-900">Shopping Cart</h3>
                <button 
                  onClick={() => setShowCart(false)}
                  className="text-gray-400 hover:text-gray-500 sm:hidden"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 12rem)" }}>
                {loading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin h-5 w-5 border-t-2 border-emerald-500 rounded-full mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading cart...</p>
                  </div>
                ) : cartItems.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-500">Your cart is empty</p>
                  </div>
                ) : (
                  cartItems.map(item => (
                    <div key={item.id} className="p-3 border-b border-gray-100 hover:bg-gray-50">
                      <p className="text-sm font-medium text-gray-900">{item.product?.name}</p>
                      <div className="flex justify-between mt-1">
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        <p className="text-xs font-medium text-emerald-600">${(item.product?.price || 0) * item.quantity}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 border-t border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Total:</span>
                  <span className="text-sm font-bold text-emerald-600">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
                <Link 
                  to="/store/checkout" 
                  className="block text-center text-sm text-white bg-emerald-600 py-2 rounded-md hover:bg-emerald-700"
                >
                  Checkout
                </Link>
              </div>
            </div>
          )}
        </div>
        
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => {
              setShowProfile(!showProfile);
              setShowCart(false);
            }}
            className="flex items-center"
            aria-label="User profile"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 flex items-center justify-center text-white">
              {profile?.display_name?.charAt(0) || 'U'}
            </div>
          </button>
          
          {showProfile && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-50 sm:relative">
              <div className="p-3 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">{profile?.display_name || 'User'}</p>
                <p className="text-xs text-gray-500 mt-1">Patient</p>
              </div>
              <div>
                <Link to="/dashboard/profile" className="block w-full text-left p-3 text-sm text-gray-700 hover:bg-gray-50">
                  My Profile
                </Link>
                <Link to="/dashboard/health" className="block w-full text-left p-3 text-sm text-gray-700 hover:bg-gray-50">
                  Health Records
                </Link>
                <Link to="/dashboard/consultations" className="block w-full text-left p-3 text-sm text-gray-700 hover:bg-gray-50">
                  My Consultations
                </Link>
                <button className="w-full text-left p-3 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100">
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {selectedConsultant && (
        <BookingModal
          isOpen={selectedConsultant !== null}
          onClose={() => setSelectedConsultant(null)}
          consultantId={selectedConsultant}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default UserNavbar; 