import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { Product } from '../../types/product';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleIncrement = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    setQuantity(prev => (prev > 1 ? prev - 1 : 1));
  };

  const addToCart = async () => {
    if (!user) {
      toast.error('Please sign in to add items to your cart');
      return;
    }

    setLoading(true);
    try {
      // Check if the item already exists in the cart
      const { data: existingItems, error: fetchError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingItems) {
        // Update existing item
        const newQuantity = existingItems.quantity + quantity;
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
          .eq('id', existingItems.id);

        if (updateError) throw updateError;
        toast.success(`Updated quantity of ${product.name} in your cart`);
      } else {
        // Add new item
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: product.id,
            quantity: quantity,
          });

        if (insertError) throw insertError;
        toast.success(`Added ${product.name} to your cart`);
      }

      setQuantity(1); // Reset quantity after adding to cart
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <Link to={`/store/product/${product.slug || product.id}`}>
        <div className="h-48 bg-gray-100 relative">
          {product.image ? (
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400">
              No Image
            </div>
          )}
          {product.stock_quantity <= 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
              Out of Stock
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-medium text-gray-900 text-lg mb-1">{product.name}</h3>
          <p className="text-emerald-600 font-bold mb-2">${product.price.toFixed(2)}</p>
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {product.description || 'No description available'}
          </p>
        </div>
      </Link>
      
      <div className="p-4 pt-0 border-t border-gray-100 mt-2">
        <div className="flex items-center mb-3">
          <button 
            onClick={handleDecrement}
            className="p-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="mx-3 text-gray-700 w-6 text-center">{quantity}</span>
          <button 
            onClick={handleIncrement}
            className="p-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        
        <button
          onClick={addToCart}
          disabled={loading || product.stock_quantity <= 0}
          className={`w-full py-2 px-4 rounded-lg flex items-center justify-center space-x-2 text-sm font-medium transition-colors
            ${product.stock_quantity <= 0 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
        >
          {loading ? (
            <span>Adding...</span>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              <span>{product.stock_quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductCard; 