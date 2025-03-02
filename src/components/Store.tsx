import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Filter, X } from 'lucide-react';

function Store() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartOpen, setCartOpen] = useState(false);
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
      image: "https://images.unsplash.com/photo-1617500603321-bcd6286973b7?w=400&q=80",
      description: "Immune system support, 2 fl oz",
      category: "Tinctures",
      slug: "organic-echinacea-tincture"
    },
    {
      id: 2,
      name: "Lavender Essential Oil",
      price: 18.99,
      image: "https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?w=400&q=80",
      description: "100% pure therapeutic grade, 15ml",
      category: "Essential Oils",
      slug: "lavender-essential-oil"
    },
    {
      id: 3,
      name: "Chamomile Sleep Tea",
      price: 12.99,
      image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80",
      description: "Organic blend for restful sleep, 20 bags",
      category: "Teas",
      slug: "chamomile-sleep-tea"
    },
    {
      id: 4,
      name: "Turmeric & Ginger Capsules",
      price: 29.99,
      image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80",
      description: "Anti-inflammatory support, 60 capsules",
      category: "Supplements",
      slug: "turmeric-ginger-capsules"
    },
    {
      id: 5,
      name: "Peppermint Essential Oil",
      price: 16.99,
      image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=80",
      description: "100% pure therapeutic grade, 15ml",
      category: "Essential Oils",
      slug: "peppermint-essential-oil"
    },
    {
      id: 6,
      name: "Elderberry Syrup",
      price: 22.99,
      image: "https://images.unsplash.com/photo-1543362906-acfc16c67564?w=400&q=80",
      description: "Immune support syrup, 4 fl oz",
      category: "Tinctures",
      slug: "elderberry-syrup"
    },
    {
      id: 7,
      name: "Stress Relief Tea Blend",
      price: 14.99,
      image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400&q=80",
      description: "Calming herbal blend, 20 bags",
      category: "Teas",
      slug: "stress-relief-tea"
    },
    {
      id: 8,
      name: "Ceramic Tea Infuser",
      price: 24.99,
      image: "https://images.unsplash.com/photo-1578252989655-bf2f209b87b4?w=400&q=80",
      description: "Handcrafted ceramic infuser with lid",
      category: "Accessories",
      slug: "ceramic-tea-infuser"
    },
    {
      id: 9,
      name: "Probiotics Complex",
      price: 34.99,
      image: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400&q=80",
      description: "Digestive health support, 30 capsules",
      category: "Supplements",
      slug: "probiotics-complex"
    },
    {
      id: 10,
      name: "Tea Tree Essential Oil",
      price: 15.99,
      image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=80",
      description: "100% pure therapeutic grade, 15ml",
      category: "Essential Oils",
      slug: "tea-tree-essential-oil"
    },
    {
      id: 11,
      name: "Glass Herb Infuser Bottle",
      price: 19.99,
      image: "https://images.unsplash.com/photo-1530968464165-7a1861cbaf9f?w=400&q=80",
      description: "Double-wall glass with infuser, 400ml",
      category: "Accessories",
      slug: "glass-herb-infuser"
    },
    {
      id: 12,
      name: "Valerian Root Tincture",
      price: 26.99,
      image: "https://images.unsplash.com/photo-1617500603321-bcd6286973b7?w=400&q=80",
      description: "Sleep support tincture, 2 fl oz",
      category: "Tinctures",
      slug: "valerian-root-tincture"
    }
  ];

  const categories = [
    { id: 'all', name: 'All Products' },
    { id: 'tinctures', name: 'Tinctures' },
    { id: 'essential-oils', name: 'Essential Oils' },
    { id: 'teas', name: 'Herbal Teas' },
    { id: 'supplements', name: 'Supplements' },
    { id: 'accessories', name: 'Accessories' }
  ];

  const addToCart = (product: typeof products[0]) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Natural Remedy Store</h1>
        <button 
          onClick={() => setCartOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
        >
          <ShoppingCart className="h-5 w-5" />
          <span>Cart ({cart.reduce((total, item) => total + item.quantity, 0)})</span>
        </button>
      </div>

      {/* Cart Sidebar */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setCartOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="relative w-96 bg-white shadow-xl">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-medium text-gray-900">Shopping Cart</h2>
                  <button 
                    onClick={() => setCartOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {cart.length === 0 ? (
                    <p className="text-gray-500 text-center">Your cart is empty</p>
                  ) : (
                    <div className="space-y-4">
                      {cart.map(item => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-500">${item.price}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              -
                            </button>
                            <span className="text-gray-600">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              +
                            </button>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500 hover:text-red-700 ml-4"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="border-t p-4">
                    <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
                      <p>Subtotal</p>
                      <p>${cartTotal.toFixed(2)}</p>
                    </div>
                    <button
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      onClick={() => {
                        // Implement checkout logic
                        alert('Checkout functionality coming soon!');
                      }}
                    >
                      Checkout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-4 overflow-x-auto py-2">
        <Filter className="h-5 w-5 text-gray-500" />
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap ${
              selectedCategory === category.id
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map(product => (
          <div 
            key={product.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <Link to={`/store/${product.slug}`}>
              <div className="h-48 overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.description}</p>
                  </div>
                  <span className="text-lg font-bold text-green-600">${product.price}</span>
                </div>
              </div>
            </Link>
            <div className="px-4 pb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{product.category}</span>
                <button 
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    addToCart(product);
                  }}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-500">
        These statements have not been evaluated by the Food and Drug Administration. 
        These products are not intended to diagnose, treat, cure, or prevent any disease. 
        Please consult with a qualified healthcare provider before using any herbal products.
      </p>
    </div>
  );
}

export default Store;