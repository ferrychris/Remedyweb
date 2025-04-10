// Product type definitions

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  category: string | null;
  image: string | null;
  slug: string | null;
  stock_quantity: number;
  status: string;
  created_at: string;
  updated_at: string | null;
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