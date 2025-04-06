// Define common types used throughout the application

export interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  description: string;
  category: string;
  slug?: string;
  status?: 'active' | 'inactive';
  stock?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  id: string;
  product_id: string;
  user_id: string;
  quantity: number;
  created_at?: string;
  updated_at?: string;
  product?: Product;
}

export interface Consultant {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  bio?: string;
  specialty: string;
  status: 'active' | 'inactive';
  is_active: boolean;
  availability_slots?: AvailabilitySlot[];
}

export interface AvailabilitySlot {
  id: string;
  consultant_id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  created_at?: string;
  updated_at?: string;
} 