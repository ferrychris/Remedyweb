// Basic database types for Supabase - simplified version

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      ailments: {
        Row: {
          id: number
          title: string
          slug: string
          description: string | null
          created_at: string
          updated_at: string | null
          status: string
        }
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          quantity: number
          created_at: string
          updated_at: string | null
        }
      }
      consultants: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          email: string
          specialty: string
          bio: string
          status: string
          is_active: boolean
          created_at: string
          updated_at: string | null
        }
      }
      consultations: {
        Row: {
          id: string
          user_id: string
          consultant_id: string
          scheduled_for: string
          status: string
          notes: string | null
          created_at: string
          updated_at: string | null
        }
      }
      consultation_ratings: {
        Row: {
          id: string
          patient_id: string | null
          consultant_id: string | null
          consultation_id: string | null
          rating: number | null
          feedback: string | null
          created_at: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price_at_purchase: number
          created_at: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          total: number
          status: string
          shipping_address: Json | null
          created_at: string
          updated_at: string | null
        }
      }
      products: {
        Row: {
          id: string
          name: string
          price: number
          description: string | null
          category: string | null
          image: string | null
          slug: string | null
          stock_quantity: number
          status: string
          created_at: string
          updated_at: string | null
        }
      }
      profiles: {
        Row: {
          id: number
          user_id: string | null
          username: string | null
          bio: string | null
          created_at: string
          is_admin: boolean | null
        }
      }
      remedies: {
        Row: {
          id: number
          title: string
          slug: string
          description: string | null
          ingredients: string | null
          preparation: string | null
          created_at: string
          updated_at: string | null
          image_url: string | null
          likes_count: number
          comments_count: number
          status: string
        }
      }
    }
  }
} 