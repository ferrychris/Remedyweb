import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Supabase client
const supabaseUrl = 'https://rvpfqabnglexzfzz.supabase.co';
const supabaseKey = 'your-supabase-anon-key'; // Replace with your Supabase anon key
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Stripe
const stripePromise = loadStripe('your-stripe-publishable-key'); // Replace with your Stripe publishable key

// Define types for TypeScript
type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  slug: string;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

// Checkout Form Component
const CheckoutForm: React.FC<{
  cart: CartItem[];
  totalAmount: number;
  onSuccess: () => void;
}> = ({ cart, totalAmount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found.');

        const response = await fetch('http://localhost:3000/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ items: cart, totalAmount }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to create payment intent');

        setClientSecret(data.clientSecret);
      } catch (err) {
        setError(err.message);
      }
    };

    createPaymentIntent();
  }, [cart, totalAmount]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    if (stripeError) {
      setError(stripeError.message || 'Payment failed');
      setProcessing(false);
    } else if (paymentIntent.status === 'succeeded') {
      setProcessing(false);
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Checkout</h2>
      <div className="mb-4">
        <p className="text-gray-600">Total: ${totalAmount.toFixed(2)}</p>
      </div>
      <div className="mb-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': { color: '#aab7c4' },
              },
              invalid: { color: '#9e2146' },
            },
          }}
        />
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || !clientSecret || processing}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition disabled:bg-gray-400"
      >
        {processing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};

const Store: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;

        setProducts(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = ['all', ...new Set(products.map((product) => product.category.toLowerCase().replace(/\s+/g, '-')))];

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [
          ...prevCart,
          { id: product.id, name: product.name, price: product.price, quantity: 1 },
        ];
      }
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const filteredProducts =
    selectedCategory === 'all'
      ? products
      : products.filter(
          (product) => product.category.toLowerCase().replace(/\s+/g, '-') === selectedCategory
        );

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    setCart([]); // Clear the cart after successful payment
    setShowCheckout(false);
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Error: {error}</div>;

  return (
    <div className="font-sans min-h-screen bg-gray-50 p-5 max-w-7xl mx-auto my-5">
      <h1 className="text-center text-2xl font-semibold text-gray-800 mb-8">Store</h1>

      {paymentSuccess && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
          Payment successful! Your order has been placed.
        </div>
      )}

      {/* Category Filter */}
      <div className="flex justify-center space-x-4 mb-6">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg transition ${
              selectedCategory === category
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {category.replace('-', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Product List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition"
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-40 object-cover rounded-lg mb-4"
            />
            <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
            <p className="text-gray-600 mb-2">{product.description}</p>
            <p className="text-gray-800 font-medium mb-4">${product.price}</p>
            <button
              onClick={() => addToCart(product)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>

      {/* Cart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Shopping Cart</h2>
        {cart.length === 0 ? (
          <p className="text-gray-600">Cart is empty</p>
        ) : (
          <>
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center mb-4 p-2 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-gray-800 font-medium">
                    {item.name} x {item.quantity} - ${item.price * item.quantity}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="bg-gray-200 px-2 py-1 rounded-lg hover:bg-gray-300"
                  >
                    -
                  </button>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="bg-gray-200 px-2 py-1 rounded-lg hover:bg-gray-300"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center mt-4">
              <p className="text-gray-800 font-medium">Total: ${totalAmount.toFixed(2)}</p>
              <button
                onClick={() => setShowCheckout(true)}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
              >
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <button
              onClick={() => setShowCheckout(false)}
              className="text-gray-600 hover:text-gray-800 float-right"
            >
              ✕
            </button>
            <Elements stripe={stripePromise}>
              <CheckoutForm
                cart={cart}
                totalAmount={totalAmount}
                onSuccess={handlePaymentSuccess}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
};

export default Store;