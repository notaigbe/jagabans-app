
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
      user_profiles: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          points: number
          profile_image: string | null
          created_at: string
          updated_at: string
          user_id: string | null
          user_role: 'user' | 'admin' | 'super_admin'
          stripe_customer_id: string | null
        }
        Insert: {
          id: string
          name: string
          email: string
          phone?: string | null
          points?: number
          profile_image?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string | null
          user_role?: 'user' | 'admin' | 'super_admin'
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          points?: number
          profile_image?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string | null
          user_role?: 'user' | 'admin' | 'super_admin'
          stripe_customer_id?: string | null
        }
      }
      menu_items: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          category: string
          image: string
          popular: boolean
          available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          category: string
          image: string
          popular?: boolean
          available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          category?: string
          image?: string
          popular?: boolean
          available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          total: number
          points_earned: number
          status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
          payment_status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled'
          delivery_address: string | null
          pickup_notes: string | null
          payment_id: string | null
          created_at: string
          updated_at: string
          uber_delivery_id: string | null
          uber_delivery_status: string | null
          uber_tracking_url: string | null
          uber_courier_name: string | null
          uber_courier_phone: string | null
          uber_courier_location: Json | null
          uber_delivery_eta: string | null
          uber_proof_of_delivery: Json | null
          delivery_triggered_at: string | null
          delivery_scheduled_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          total: number
          points_earned?: number
          status?: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
          payment_status?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled'
          delivery_address?: string | null
          pickup_notes?: string | null
          payment_id?: string | null
          created_at?: string
          updated_at?: string
          uber_delivery_id?: string | null
          uber_delivery_status?: string | null
          uber_tracking_url?: string | null
          uber_courier_name?: string | null
          uber_courier_phone?: string | null
          uber_courier_location?: Json | null
          uber_delivery_eta?: string | null
          uber_proof_of_delivery?: Json | null
          delivery_triggered_at?: string | null
          delivery_scheduled_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          total?: number
          points_earned?: number
          status?: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
          payment_status?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled'
          delivery_address?: string | null
          pickup_notes?: string | null
          payment_id?: string | null
          created_at?: string
          updated_at?: string
          uber_delivery_id?: string | null
          uber_delivery_status?: string | null
          uber_tracking_url?: string | null
          uber_courier_name?: string | null
          uber_courier_phone?: string | null
          uber_courier_location?: Json | null
          uber_delivery_eta?: string | null
          uber_proof_of_delivery?: Json | null
          delivery_triggered_at?: string | null
          delivery_scheduled_at?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_item_id: string | null
          name: string
          price: number
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          menu_item_id?: string | null
          name: string
          price: number
          quantity: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          menu_item_id?: string | null
          name?: string
          price?: number
          quantity?: number
          created_at?: string
        }
      }
      stripe_payments: {
        Row: {
          id: string
          user_id: string | null
          order_id: string | null
          stripe_payment_intent_id: string
          amount: number
          currency: string
          status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled'
          payment_method: string | null
          receipt_url: string | null
          error_message: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          order_id?: string | null
          stripe_payment_intent_id: string
          amount: number
          currency?: string
          status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled'
          payment_method?: string | null
          receipt_url?: string | null
          error_message?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          order_id?: string | null
          stripe_payment_intent_id?: string
          amount?: number
          currency?: string
          status?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled'
          payment_method?: string | null
          receipt_url?: string | null
          error_message?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      stripe_payment_methods: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string
          stripe_payment_method_id: string
          type: string
          card_brand: string | null
          card_last4: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id: string
          stripe_payment_method_id: string
          type: string
          card_brand?: string | null
          card_last4?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string
          stripe_payment_method_id?: string
          type?: string
          card_brand?: string | null
          card_last4?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      square_payments: {
        Row: {
          id: string
          user_id: string | null
          order_id: string | null
          square_payment_id: string
          square_order_id: string | null
          amount: number
          currency: string
          status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'
          payment_method: string | null
          receipt_url: string | null
          error_message: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          order_id?: string | null
          square_payment_id: string
          square_order_id?: string | null
          amount: number
          currency?: string
          status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'
          payment_method?: string | null
          receipt_url?: string | null
          error_message?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          order_id?: string | null
          square_payment_id?: string
          square_order_id?: string | null
          amount?: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'
          payment_method?: string | null
          receipt_url?: string | null
          error_message?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      square_cards: {
        Row: {
          id: string
          user_id: string
          square_customer_id: string
          square_card_id: string
          card_brand: string
          last_4: string
          exp_month: number
          exp_year: number
          cardholder_name: string | null
          billing_address: Json | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          square_customer_id: string
          square_card_id: string
          card_brand: string
          last_4: string
          exp_month: number
          exp_year: number
          cardholder_name?: string | null
          billing_address?: Json | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          square_customer_id?: string
          square_card_id?: string
          card_brand?: string
          last_4?: string
          exp_month?: number
          exp_year?: number
          cardholder_name?: string | null
          billing_address?: Json | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      gift_cards: {
        Row: {
          id: string
          sender_id: string | null
          recipient_id: string | null
          recipient_email: string | null
          recipient_name: string | null
          points: number
          message: string | null
          status: 'pending' | 'sent' | 'redeemed' | 'expired'
          redeemed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id?: string | null
          recipient_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          points: number
          message?: string | null
          status?: 'pending' | 'sent' | 'redeemed' | 'expired'
          redeemed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string | null
          recipient_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          points?: number
          message?: string | null
          status?: 'pending' | 'sent' | 'redeemed' | 'expired'
          redeemed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      merch_items: {
        Row: {
          id: string
          name: string
          description: string
          points_cost: number
          image: string
          in_stock: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          points_cost: number
          image: string
          in_stock?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          points_cost?: number
          image?: string
          in_stock?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      merch_redemptions: {
        Row: {
          id: string
          user_id: string | null
          merch_item_id: string | null
          merch_name: string
          points_cost: number
          delivery_address: string | null
          pickup_notes: string | null
          status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          merch_item_id?: string | null
          merch_name: string
          points_cost: number
          delivery_address?: string | null
          pickup_notes?: string | null
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          merch_item_id?: string | null
          merch_name?: string
          points_cost?: number
          delivery_address?: string | null
          pickup_notes?: string | null
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          date: string
          location: string
          capacity: number
          available_spots: number
          image: string
          is_private: boolean
          is_invite_only: boolean
          shareable_link: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          date: string
          location: string
          capacity: number
          available_spots?: number
          image: string
          is_private?: boolean
          is_invite_only?: boolean
          shareable_link?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          date?: string
          location?: string
          capacity?: number
          available_spots?: number
          image?: string
          is_private?: boolean
          is_invite_only?: boolean
          shareable_link?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      event_rsvps: {
        Row: {
          id: string
          event_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          created_at?: string
        }
      }
      payment_methods: {
        Row: {
          id: string
          user_id: string
          type: 'credit' | 'debit'
          card_number: string | null
          cardholder_name: string
          expiry_date: string
          is_default: boolean
          created_at: string
          updated_at: string
          stripe_payment_method_id: string | null
          stripe_customer_id: string | null
          last4: string | null
          brand: string | null
          exp_month: number | null
          exp_year: number | null
        }
        Insert: {
          id?: string
          user_id: string
          type: 'credit' | 'debit'
          card_number?: string | null
          cardholder_name: string
          expiry_date: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
          stripe_payment_method_id?: string | null
          stripe_customer_id?: string | null
          last4?: string | null
          brand?: string | null
          exp_month?: number | null
          exp_year?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'credit' | 'debit'
          card_number?: string | null
          cardholder_name?: string
          expiry_date?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
          stripe_payment_method_id?: string | null
          stripe_customer_id?: string | null
          last4?: string | null
          brand?: string | null
          exp_month?: number | null
          exp_year?: number | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'special' | 'event' | 'order' | 'general' | 'giftcard'
          read: boolean
          action_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'special' | 'event' | 'order' | 'general' | 'giftcard'
          read?: boolean
          action_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'special' | 'event' | 'order' | 'general' | 'giftcard'
          read?: boolean
          action_url?: string | null
          created_at?: string
        }
      }
      theme_settings: {
        Row: {
          id: string
          user_id: string
          mode: 'light' | 'dark' | 'auto'
          color_scheme: 'default' | 'warm' | 'cool' | 'vibrant' | 'minimal'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          mode?: 'light' | 'dark' | 'auto'
          color_scheme?: 'default' | 'warm' | 'cool' | 'vibrant' | 'minimal'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          mode?: 'light' | 'dark' | 'auto'
          color_scheme?: 'default' | 'warm' | 'cool' | 'vibrant' | 'minimal'
          created_at?: string
          updated_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          date: string
          time: string
          guests: number
          special_requests: string | null
          created_at: string | null
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show' | null
          table_number: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          date: string
          time: string
          guests: number
          special_requests?: string | null
          created_at?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show' | null
          table_number?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          date?: string
          time?: string
          guests?: number
          special_requests?: string | null
          created_at?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show' | null
          table_number?: string | null
        }
      }
      account_deletion_audit: {
        Row: {
          id: string
          user_id: string
          deleted_at: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          deleted_at?: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          deleted_at?: string
          reason?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
