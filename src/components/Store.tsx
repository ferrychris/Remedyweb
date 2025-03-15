import React, { useState } from "react";

// Define types for TypeScript
type Product = {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  slug: string;
};

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

const Store = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const products: Product[] = [
    { id: 1, name: "Lavender Oil", price: 15, image: "lavender.jpg", description: "Soothing essential oil.", category: "Essential Oils", slug: "lavender-oil" },
    { id: 2, name: "Peppermint Oil", price: 18, image: "peppermint.jpg", description: "Cooling and refreshing.", category: "Essential Oils", slug: "peppermint-oil" },
    { id: 3, name: "Tea Tree Oil", price: 20, image: "tea-tree.jpg", description: "Antiseptic properties.", category: "Essential Oils", slug: "tea-tree-oil" },
    { id: 4, name: "Aloe Vera Gel", price: 12, image: "aloe-vera.jpg", description: "Hydrating and soothing.", category: "Skincare", slug: "aloe-vera-gel" },
  ];

  const categories = ["all", "essential-oils", "skincare"];

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
      }
    });
  };

  const filteredProducts = selectedCategory === "all"
    ? products
    : products.filter(product => product.category.toLowerCase().replace(/\s+/g, '-') === selectedCategory);

  return (
    <div>
      <h1>Store</h1>
      
      {/* Category Filter */}
      <div>
        {categories.map(category => (
          <button 
            key={category} 
            onClick={() => setSelectedCategory(category)}
            style={{ fontWeight: selectedCategory === category ? "bold" : "normal" }}
          >
            {category.replace('-', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Product List */}
      <div>
        {filteredProducts.map(product => (
          <div key={product.id}>
            <img src={product.image} alt={product.name} width="100" />
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p>${product.price}</p>
            <button onClick={() => addToCart(product)}>Add to Cart</button>
          </div>
        ))}
      </div>

      {/* Cart */}
      <div>
        <h2>Shopping Cart</h2>
        {cart.length === 0 ? (
          <p>Cart is empty</p>
        ) : (
          cart.map(item => (
            <div key={item.id}>
              <p>{item.name} x {item.quantity} - ${item.price * item.quantity}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Store;
