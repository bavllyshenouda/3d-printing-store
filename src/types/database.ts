export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          first_name: string | null;
          id: string;
          last_name: string | null;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          first_name?: string | null;
          id: string;
          last_name?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          stock: number;
          material: string | null;
          available_colors: string[];
          is_active: boolean;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          price: number;
          stock?: number;
          material?: string | null;
          available_colors?: string[];
          is_active?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          name?: string;
          slug?: string;
          description?: string | null;
          price?: number;
          stock?: number;
          material?: string | null;
          available_colors?: string[];
          is_active?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          image_url: string;
          alt_text: string | null;
          is_primary: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          image_url: string;
          alt_text?: string | null;
          is_primary?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          image_url?: string;
          alt_text?: string | null;
          is_primary?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          color: string;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          color: string;
          quantity: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          color?: string;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cart_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      customer_addresses: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          phone: string;
          email: string | null;
          country: string;
          governorate: string;
          region: string;
          street_address: string;
          building: string | null;
          floor: string | null;
          apartment: string | null;
          notes: string | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name: string;
          last_name: string;
          phone: string;
          email?: string | null;
          country?: string;
          governorate: string;
          region: string;
          street_address: string;
          building?: string | null;
          floor?: string | null;
          apartment?: string | null;
          notes?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          phone?: string;
          email?: string | null;
          country?: string;
          governorate?: string;
          region?: string;
          street_address?: string;
          building?: string | null;
          floor?: string | null;
          apartment?: string | null;
          notes?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_addresses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      orders: {
        Row: {
          id: string;
          order_number: number;
          user_id: string | null;
          status: string;
          payment_method: string;
          payment_status: string;
          currency: string;
          subtotal: number;
          shipping_fee: number;
          discount_amount: number;
          total: number;
          customer_first_name: string;
          customer_last_name: string;
          customer_phone: string;
          customer_email: string | null;
          country: string;
          governorate: string;
          region: string;
          street_address: string;
          building: string | null;
          floor: string | null;
          apartment: string | null;
          address_notes: string | null;
          customer_confirmation_at: string | null;
          confirmed_at: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: number;
          user_id?: string | null;
          status?: string;
          payment_method: string;
          payment_status?: string;
          currency?: string;
          subtotal: number;
          shipping_fee?: number;
          discount_amount?: number;
          total: number;
          customer_first_name: string;
          customer_last_name: string;
          customer_phone: string;
          customer_email?: string | null;
          country?: string;
          governorate: string;
          region: string;
          street_address: string;
          building?: string | null;
          floor?: string | null;
          apartment?: string | null;
          address_notes?: string | null;
          customer_confirmation_at?: string | null;
          confirmed_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: number;
          user_id?: string | null;
          status?: string;
          payment_method?: string;
          payment_status?: string;
          currency?: string;
          subtotal?: number;
          shipping_fee?: number;
          discount_amount?: number;
          total?: number;
          customer_first_name?: string;
          customer_last_name?: string;
          customer_phone?: string;
          customer_email?: string | null;
          country?: string;
          governorate?: string;
          region?: string;
          street_address?: string;
          building?: string | null;
          floor?: string | null;
          apartment?: string | null;
          address_notes?: string | null;
          customer_confirmation_at?: string | null;
          confirmed_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          product_image_url: string | null;
          color: string;
          quantity: number;
          unit_price: number;
          line_total: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          product_image_url?: string | null;
          color: string;
          quantity: number;
          unit_price: number;
          line_total?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_name?: string;
          product_image_url?: string | null;
          color?: string;
          quantity?: number;
          unit_price?: number;
          line_total?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      shipping_events: {
        Row: {
          id: string;
          order_id: string;
          carrier: string | null;
          tracking_number: string | null;
          status: string;
          description: string | null;
          event_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          carrier?: string | null;
          tracking_number?: string | null;
          status: string;
          description?: string | null;
          event_time?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          carrier?: string | null;
          tracking_number?: string | null;
          status?: string;
          description?: string | null;
          event_time?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shipping_events_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          payment_method: string;
          status: string;
          amount: number;
          currency: string;
          proof_storage_path: string | null;
          transaction_reference: string | null;
          verified_by: string | null;
          verified_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          payment_method: string;
          status?: string;
          amount: number;
          currency?: string;
          proof_storage_path?: string | null;
          transaction_reference?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          payment_method?: string;
          status?: string;
          amount?: number;
          currency?: string;
          proof_storage_path?: string | null;
          transaction_reference?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "admins";
            referencedColumns: ["user_id"];
          }
        ];
      };
      custom_print_requests: {
        Row: {
          id: string;
          request_number: number;
          user_id: string;
          title: string | null;
          description: string;
          quantity: number;
          preferred_material: string | null;
          preferred_color: string | null;
          reference_url: string | null;
          customer_notes: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_number?: number;
          user_id: string;
          title?: string | null;
          description: string;
          quantity?: number;
          preferred_material?: string | null;
          preferred_color?: string | null;
          reference_url?: string | null;
          customer_notes?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_number?: number;
          user_id?: string;
          title?: string | null;
          description?: string;
          quantity?: number;
          preferred_material?: string | null;
          preferred_color?: string | null;
          reference_url?: string | null;
          customer_notes?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "custom_print_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      custom_print_files: {
        Row: {
          id: string;
          request_id: string;
          storage_path: string;
          original_filename: string;
          mime_type: string | null;
          file_size_bytes: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          storage_path: string;
          original_filename: string;
          mime_type?: string | null;
          file_size_bytes?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          storage_path?: string;
          original_filename?: string;
          mime_type?: string | null;
          file_size_bytes?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "custom_print_files_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "custom_print_requests";
            referencedColumns: ["id"];
          }
        ];
      };
      custom_print_quotes: {
        Row: {
          id: string;
          request_id: string;
          version: number;
          description: string;
          material: string | null;
          color: string | null;
          quantity: number;
          unit_price: number;
          total_price: number | null;
          estimated_days: number | null;
          status: string;
          valid_until: string | null;
          sent_at: string | null;
          responded_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          version?: number;
          description: string;
          material?: string | null;
          color?: string | null;
          quantity: number;
          unit_price: number;
          total_price?: number | null;
          estimated_days?: number | null;
          status?: string;
          valid_until?: string | null;
          sent_at?: string | null;
          responded_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          version?: number;
          description?: string;
          material?: string | null;
          color?: string | null;
          quantity?: number;
          unit_price?: number;
          total_price?: number | null;
          estimated_days?: number | null;
          status?: string;
          valid_until?: string | null;
          sent_at?: string | null;
          responded_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "custom_print_quotes_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "custom_print_requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "custom_print_quotes_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "admins";
            referencedColumns: ["user_id"];
          }
        ];
      };
      whatsapp_messages: {
        Row: {
          id: string;
          order_id: string | null;
          custom_request_id: string | null;
          phone: string;
          direction: string;
          message_type: string;
          provider_message_id: string | null;
          message_status: string;
          message_body: string | null;
          received_reply: string | null;
          processed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          custom_request_id?: string | null;
          phone: string;
          direction: string;
          message_type: string;
          provider_message_id?: string | null;
          message_status?: string;
          message_body?: string | null;
          received_reply?: string | null;
          processed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          custom_request_id?: string | null;
          phone?: string;
          direction?: string;
          message_type?: string;
          provider_message_id?: string | null;
          message_status?: string;
          message_body?: string | null;
          received_reply?: string | null;
          processed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "whatsapp_messages_custom_request_id_fkey";
            columns: ["custom_request_id"];
            isOneToOne: false;
            referencedRelation: "custom_print_requests";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      create_checkout_order: {
        Args: {
          p_customer_first_name: string;
          p_customer_last_name: string;
          p_customer_phone: string;
          p_customer_email?: string | null;
          p_governorate: string;
          p_region: string;
          p_street_address: string;
          p_building?: string | null;
          p_floor?: string | null;
          p_apartment?: string | null;
          p_address_notes?: string | null;
          p_payment_method?: string;
          p_shipping_fee?: number;
          p_discount_amount?: number;
        };
        Returns: Json;
      };
      cancel_order_and_restore_stock: {
        Args: {
          p_order_id: string;
          p_reason?: string;
        };
        Returns: Json;
      };
      get_or_create_order_payment: {
        Args: {
          p_order_id: string;
        };
        Returns: Json;
      };
      submit_payment_proof: {
        Args: {
          p_order_id: string;
          p_proof_storage_path: string;
          p_transaction_reference?: string | null;
          p_notes?: string | null;
        };
        Returns: Json;
      };
      admin_review_payment: {
        Args: {
          p_payment_id: string;
          p_action: string;
          p_notes?: string | null;
          p_transaction_reference?: string | null;
        };
        Returns: Json;
      };
      admin_create_or_send_quote: {
        Args: {
          p_request_id: string;
          p_description: string;
          p_material?: string | null;
          p_color?: string | null;
          p_quantity: number;
          p_unit_price: number;
          p_estimated_days?: number | null;
          p_valid_days?: number | null;
          p_status?: string;
        };
        Returns: Json;
      };
      accept_custom_print_quote: {
        Args: {
          p_quote_id: string;
          p_customer_first_name: string;
          p_customer_last_name: string;
          p_customer_phone: string;
          p_customer_email?: string | null;
          p_governorate: string;
          p_region: string;
          p_street_address: string;
          p_building?: string | null;
          p_floor?: string | null;
          p_apartment?: string | null;
          p_address_notes?: string | null;
          p_payment_method?: string;
          p_shipping_fee?: number;
        };
        Returns: Json;
      };
      reject_custom_print_quote: {
        Args: {
          p_quote_id: string;
          p_reason?: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];
export type CartItem = Database["public"]["Tables"]["cart_items"]["Row"];

export type CustomerAddress = Database["public"]["Tables"]["customer_addresses"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type ShippingEvent = Database["public"]["Tables"]["shipping_events"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];

export type CustomPrintRequest = Database["public"]["Tables"]["custom_print_requests"]["Row"];
export type CustomPrintFile = Database["public"]["Tables"]["custom_print_files"]["Row"];
export type CustomPrintQuote = Database["public"]["Tables"]["custom_print_quotes"]["Row"];

export type CustomPrintRequestStatus =
  | "submitted"
  | "under_review"
  | "quote_sent"
  | "accepted"
  | "rejected"
  | "in_production"
  | "completed"
  | "cancelled";

export type CustomPrintQuoteStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired";

export type CustomPrintRequestWithDetails = CustomPrintRequest & {
  files: CustomPrintFile[];
  quotes: CustomPrintQuote[];
};

export type OrderStatus =
  | "pending_customer_confirmation"
  | "confirmed"
  | "processing"
  | "ready_to_ship"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "rejected";

export type PaymentMethod = "cod" | "instapay" | "vodafone_cash" | "online";

export type PaymentStatus =
  | "pending"
  | "awaiting_verification"
  | "paid"
  | "failed"
  | "refunded";

export type OrderWithDetails = Order & {
  items: OrderItem[];
  shipping_events?: ShippingEvent[];
  payment?: Payment | null;
};

export type CartItemWithProduct = CartItem & {
  product: Product & {
    images: ProductImage[];
  };
};

export type WhatsAppMessage = Database["public"]["Tables"]["whatsapp_messages"]["Row"];
export type WhatsAppMessageDirection = "outbound" | "inbound";
export type WhatsAppMessageType =
  | "order_confirmation"
  | "payment_request"
  | "quote"
  | "customer_reply"
  | "other";
export type WhatsAppMessageStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "received";
