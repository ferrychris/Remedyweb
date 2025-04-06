// src/components/userdashboard/sections/Store.tsx
import { useState, useEffect } from 'react';
import { ShoppingCart, X, Plus, Minus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import toast from 'react-hot-toast';
import { Product } from '../../../types';
import { useNavigate } from 'react-router-dom';

export function Store() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  // Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, category, description')
          .order('name', { ascending: true });

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        toast.error('Failed to load products');
        console.error('Fetch products error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on category and search query
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => {
    const product = products.find((p) => p.id === item.id);
    return total + (product?.price || 0) * item.quantity;
  }, 0);

  // Add to cart
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prevCart,
        { id: product.id, name: product.name, price: product.price, quantity: 1 },
      ];
    });
    toast.success(`${product.name} added to cart!`);
  };

  // Handle checkout
  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please sign in to checkout');
      return;
    }

    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setShowConfirmModal(true);
  };

  // Confirm checkout with shipping address
  const confirmCheckout = async () => {
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.country) {
      toast.error('Please fill in all shipping address fields');
      return;
    }

    setShowConfirmModal(false);
    try {
      // Create a new order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total: cartTotal,
          status: 'pending',
          shipping_address: shippingAddress,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderId = orderData.id;

      // Create order items
      const orderItems = cart.map((item) => ({
        order_id: orderId,
        product_id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear the cart
      setCart([]);
      setCartOpen(false);
      toast.success('Order placed successfully!');
      
      // Redirect to Orders section
      navigate('/dashboard?section=orders');
    } catch (error) {
      toast.error('Failed to place order');
      console.error('Checkout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Store</h1>

      {/* Welcome Banner - Fixed curved borders for better rendering */}
      <div className="bg-green-100 p-3 sm:p-4 rounded-md mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-green-800">
          Welcome to the Store
        </h2>
        <p className="text-sm sm:text-base text-green-600">Explore natural remedies to support your health journey!</p>
      </div>

      {/* Search and Category Filter - Fixed curved border radius */}
      <div className="flex flex-col space-y-3 mb-4 sm:mb-6">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search remedies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-1 flex-grow">
            {['all', 'tinctures', 'capsules', 'teas'].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-2 sm:px-4 py-1 sm:py-2 rounded-md capitalize whitespace-nowrap text-xs sm:text-sm ${
                  selectedCategory === category
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } transition duration-200`}
              >
                {category}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setCartOpen(true)}
            className="relative ml-2 p-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-200 flex-shrink-0"
            aria-label="Open cart"
          >
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Product List - Consistent border radius */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {filteredProducts.length === 0 ? (
          <p className="text-gray-500 col-span-full text-center py-8">
            No products found.
          </p>
        ) : (
          filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-3 sm:p-4 rounded-md shadow border border-gray-200 transform transition duration-300 hover:scale-105"
            >
              <div className="w-full h-32 sm:h-40 bg-gray-200 rounded-md mb-3 sm:mb-4 flex items-center justify-center">
                <span className="text-gray-500 text-sm">Image Placeholder</span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 line-clamp-1">{product.name}</h3>
              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 h-9">{product.description}</p>
              <p className="text-emerald-600 font-medium mt-1 sm:mt-2 text-sm sm:text-base">
                ${product.price.toFixed(2)}
              </p>
              <button
                onClick={() => addToCart(product)}
                className="mt-2 sm:mt-4 w-full py-1.5 sm:py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-200 text-xs sm:text-sm"
              >
                Add to Cart
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* Cart Sidebar - Consistent rounded corners */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween' }}
              className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-xl z-50 overflow-y-auto flex flex-col"
            >
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">Your Cart</h2>
                <button
                  onClick={() => setCartOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-grow overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between border-b pb-3">
                        <div>
                          <h3 className="font-medium text-sm sm:text-base">{item.name}</h3>
                          <p className="text-gray-600 text-xs sm:text-sm">${item.price.toFixed(2)} x {item.quantity}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setCart(cart.map((cartItem) => 
                                cartItem.id === item.id && cartItem.quantity > 1 
                                  ? { ...cartItem, quantity: cartItem.quantity - 1 } 
                                  : cartItem
                              ));
                            }}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="mx-1 text-sm">{item.quantity}</span>
                          <button
                            onClick={() => {
                              setCart(cart.map((cartItem) => 
                                cartItem.id === item.id 
                                  ? { ...cartItem, quantity: cartItem.quantity + 1 } 
                                  : cartItem
                              ));
                            }}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setCart(cart.filter((cartItem) => cartItem.id !== item.id));
                            }}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 border-t mt-auto">
                <div className="flex justify-between mb-4">
                  <span className="font-semibold">Total:</span>
                  <span className="font-semibold">${cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className={`w-full py-2 rounded-md text-white ${
                    cart.length === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  Checkout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Modal - Consistent border radius */}
      <AnimatePresence>
        {showConfirmModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-md shadow-xl w-full max-w-md mx-auto">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold">Complete Your Order</h2>
                </div>
                <div className="p-4">
                  <h3 className="font-medium mb-3">Shipping Address</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                      <input
                        type="text"
                        value={shippingAddress.street}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <input
                          type="text"
                          value={shippingAddress.state}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                        <input
                          type="text"
                          value={shippingAddress.postalCode}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                        <input
                          type="text"
                          value={shippingAddress.country}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-green-600 font-semibold">Total: ${cartTotal.toFixed(2)}</div>
                  </div>
                </div>
                <div className="p-4 border-t flex justify-end space-x-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="px-4 py-2 border rounded-md text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmCheckout}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                  >
                    Place Order
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Store;