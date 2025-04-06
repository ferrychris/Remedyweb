// Product type definitions

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  image?: string;
  slug?: string;
  stock_quantity?: number;
  status?: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at?: string;
  updated_at?: string;
  product?: Product;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at?: string;
  user?: {
    display_name: string;
  };
} 