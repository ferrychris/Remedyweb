import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ShoppingCart, Star, Minus, Plus, ArrowLeft } from 'lucide-react';

function ProductDetail() {
  const { slug } = useParams();
  const [quantity, setQuantity] = useState(1);

  // This would normally come from your database
  const products = {
    'organic-echinacea-tincture': {
      id: 1,
      name: "Organic Echinacea Tincture",
      price: 24.99,
      image: "https://images.unsplash.com/photo-1617500603321-bcd6286973b7?w=400&q=80",
      description: "Support your immune system naturally with our organic Echinacea tincture. Made from carefully selected, sustainably harvested Echinacea purpurea.",
      category: "Tinctures",
      rating: 4.8,
      reviews: 156,
      stock: 15,
      details: [
        "2 fl oz (60ml)",
        "Organic Echinacea purpurea root",
        "Extracted in organic alcohol and purified water",
        "Dropper included",
        "Third-party tested for purity"
      ]
    }
  };

  const product = products[slug as keyof typeof products];

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-2xl font-bold text-gray-800">Product not found</h1>
        <p className="mt-4 text-gray-600">The product you're looking for doesn't exist.</p>
        <Link to="/store" className="mt-4 inline-flex items-center text-green-600 hover:text-green-700">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Store
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link to="/store" className="inline-flex items-center text-green-600 hover:text-green-700 mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Store
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="aspect-w-1 aspect-h-1 bg-gray-100 rounded-lg overflow-hidden">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-center object-cover"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{product.name}</h1>
            <p className="text-xl font-bold text-green-600 mt-2">${product.price}</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(product.rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">{product.reviews} reviews</span>
          </div>

          <p className="text-gray-600">{product.description}</p>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">Product Details</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              {product.details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Quantity</label>
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-100"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 border-x">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="p-2 hover:bg-gray-100"
                  disabled={quantity >= product.stock}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-sm text-gray-500">{product.stock} available</span>
            </div>

            <button className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-8">
        These statements have not been evaluated by the Food and Drug Administration. 
        These products are not intended to diagnose, treat, cure, or prevent any disease. 
        Please consult with a qualified healthcare provider before using any herbal products.
      </p>
    </div>
  );
}

export default ProductDetail;