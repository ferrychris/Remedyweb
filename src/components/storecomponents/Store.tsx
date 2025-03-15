import { useState } from 'react';
import { ShoppingCart, X, Plus, Minus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function Store() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{
    id: number;
    name: string;
    price: number;
    quantity: number;
  }[]>([]);

  const products = [
    {
      id: 1,
      name: "Organic Echinacea Tincture",
      price: 24.99,
      category: "tinctures",
      description: "Boost your immune system naturally"
    },
    // ... other products
  ];

  const cartTotal = cart.reduce((total, item) => {
    const product = products.find(p => p.id === item.id);
    return total + (product?.price || 0) * item.quantity;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
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
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-8">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 p-6 overflow-y-auto">
                      {cart.map(item => {
                        const product = products.find(p => p.id === item.id);
                        if (!product) return null;
                        
                        return (
                          <div key={item.id} className="flex items-center mb-4">
                            <div className="flex-1">
                              <h3 className="font-medium">{product.name}</h3>
                              <p className="text-sm text-gray-500">${product.price}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  if (item.quantity > 1) {
                                    setCart(cart.map(cartItem =>
                                      cartItem.id === item.id
                                        ? { ...cartItem, quantity: cartItem.quantity - 1 }
                                        : cartItem
                                    ));
                                  } else {
                                    setCart(cart.filter(cartItem => cartItem.id !== item.id));
                                  }
                                }}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span>{item.quantity}</span>
                              <button
                                onClick={() => {
                                  setCart(cart.map(cartItem =>
                                    cartItem.id === item.id
                                      ? { ...cartItem, quantity: cartItem.quantity + 1 }
                                      : cartItem
                                  ));
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
                        <span className="text-2xl font-bold text-emerald-600">${cartTotal.toFixed(2)}</span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
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
    </div>
  );
}

export default Store;
