import { supabase } from './supabase';

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  user_id: string;
  product?: {
    name: string;
    price: number;
    description?: string;
    image_url?: string;
  };
}

/**
 * Get all cart items for the current user
 */
export async function getCartItems(userId: string): Promise<CartItem[]> {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching cart items:', error);
    throw error;
  }
}

/**
 * Add a product to the cart
 */
export async function addToCart(userId: string, productId: string, quantity: number = 1): Promise<CartItem> {
  if (!userId) throw new Error('User ID is required');
  if (!productId) throw new Error('Product ID is required');

  try {
    // Check if the product is already in the cart
    const { data: existingItems, error: checkError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingItems) {
      // Update the quantity
      const newQuantity = existingItems.quantity + quantity;
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItems.id)
        .select('*, product:products(*)')
        .single();

      if (error) throw error;
      return data;
    } else {
      // Insert a new item
      const { data, error } = await supabase
        .from('cart_items')
        .insert({ user_id: userId, product_id: productId, quantity })
        .select('*, product:products(*)')
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

/**
 * Update the quantity of an item in the cart
 */
export async function updateCartItem(userId: string, itemId: string, quantity: number): Promise<CartItem> {
  if (!userId) throw new Error('User ID is required');
  if (!itemId) throw new Error('Item ID is required');
  if (quantity < 1) throw new Error('Quantity must be at least 1');

  try {
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)
      .eq('user_id', userId) // Ensure the user owns the item
      .select('*, product:products(*)')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
}

/**
 * Remove an item from the cart
 */
export async function removeFromCart(userId: string, itemId: string): Promise<void> {
  if (!userId) throw new Error('User ID is required');
  if (!itemId) throw new Error('Item ID is required');

  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId); // Ensure the user owns the item

    if (error) throw error;
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
}

/**
 * Clear the entire cart
 */
export async function clearCart(userId: string): Promise<void> {
  if (!userId) throw new Error('User ID is required');

  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
}

/**
 * Get the total number of items in the cart
 */
export function getCartCount(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Get the total price of all items in the cart
 */
export function getCartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => {
    const price = item.product?.price || 0;
    return total + (price * item.quantity);
  }, 0);
} 