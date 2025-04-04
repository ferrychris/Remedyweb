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
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Store</h1>

      {/* Welcome Banner */}
      <div className="bg-green-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold text-green-800">
          Welcome to the Store
        </h2>
        <p className="text-green-600">Explore natural remedies to support your health journey!</p>
      </div>

      {/* Search and Category Filter */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search remedies and ailments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        <div className="flex space-x-2">
          {['all', 'tinctures', 'capsules', 'teas'].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg capitalize ${
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
          className="relative p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200"
        >
          <ShoppingCart className="w-6 h-6" />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {/* Product List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.length === 0 ? (
          <p className="text-gray-500 col-span-full text-center">
            No products found.
          </p>
        ) : (
          filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-4 rounded-lg shadow border border-gray-200 transform transition duration-300 hover:scale-105"
            >
              <div className="w-full h-40 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-gray-500">Image Placeholder</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
              <p className="text-gray-600">{product.description}</p>
              <p className="text-emerald-600 font-medium mt-2">
                ${product.price.toFixed(2)}
              </p>
              <button
                onClick={() => addToCart(product)}
                className="mt-4 w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200"
              >
                Add to Cart
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setCartOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween' }}
              className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center p-6 border-b">
                  <h2 className="text-xl font-semibold text-gray-800">Your Cart</h2>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-8">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 p-6 overflow-y-auto">
                      {cart.map((item) => {
                        const product = products.find((p) => p.id === item.id);
                        if (!product) return null;

                        return (
                          <div key={item.id} className="flex items-center mb-4">
                            <div className="flex-1">
                              <h3 className="font-medium">{product.name}</h3>
                              <p className="text-sm text-gray-500">
                                ${product.price.toFixed(2)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  if (item.quantity > 1) {
                                    setCart(
                                      cart.map((cartItem) =>
                                        cartItem.id === item.id
                                          ? { ...cartItem, quantity: cartItem.quantity - 1 }
                                          : cartItem
                                      )
                                    );
                                  } else {
                                    setCart(
                                      cart.filter((cartItem) => cartItem.id !== item.id)
                                    );
                                  }
                                }}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span>{item.quantity}</span>
                              <button
                                onClick={() => {
                                  setCart(
                                    cart.map((cartItem) =>
                                      cartItem.id === item.id
                                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                                        : cartItem
                                    )
                                  );
                                }}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-t p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-gray-600">Total</span>
                        <span className="text-2xl font-bold text-emerald-600">
                          ${cartTotal.toFixed(2)}
                        </span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCheckout}
                        className="w-full py-4 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors duration-200"
                      >
                        Proceed to Checkout
                      </motion.button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal with Shipping Address */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Confirm Your Order
              </h3>
              <p className="text-gray-600 mb-6">
                Total: ${cartTotal.toFixed(2)}. Please provide your shipping address.
              </p>
              <div className="space-y-4">
                {['street', 'city', 'state', 'postalCode', 'country'].map((field) => (
                  <div key={field}>
                    <input
                      type="text"
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      value={shippingAddress[field as keyof typeof shippingAddress]}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          [field]: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {!shippingAddress[field as keyof typeof shippingAddress] && (
                      <p className="text-red-500 text-xs mt-1">This field is required</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmCheckout}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Store;