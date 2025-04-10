// Common type definitions for the application

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

export interface ConsultantData {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  specialty: string;
  status: string;
  created_at: string;
  updated_at?: string;
  bio: string;
  is_active: boolean;
}

export interface Remedy {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  ingredients: string | null;
  preparation: string | null;
  ailments?: string[];
  created_at: string;
  updated_at?: string;
  image_url?: string | null;
  likes_count?: number;
  comments_count?: number;
  status: string;
}

export interface Ailment {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at?: string;
  status: string;
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  bio: string | null;
  is_admin: boolean | null;
  created_at: string;
  updated_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  created_at?: string;
  updated_at?: string;
  product?: { name: string };
}

export interface Order {
  id: string;
  user_id: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at?: string;
  shipping_address?: any;
  order_items: OrderItem[];
}

export interface Consultation {
  id: string;
  user_id: string;
  consultant_id: string;
  scheduled_for: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at?: string;
  updated_at?: string;
  consultant: { 
    name: string; 
    specialty: string;
  };
} 