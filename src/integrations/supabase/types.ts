export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      price_alerts: {
        Row: {
          id: string
          user_id: string
          card_id: string
          card_name: string
          set_name: string | null
          card_image_url: string | null
          current_price: number | null
          target_price: number
          direction: string
          is_active: boolean
          triggered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          card_id: string
          card_name: string
          set_name?: string | null
          card_image_url?: string | null
          current_price?: number | null
          target_price: number
          direction: string
          is_active?: boolean
          triggered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          card_id?: string
          card_name?: string
          set_name?: string | null
          card_image_url?: string | null
          current_price?: number | null
          target_price?: number
          direction?: string
          is_active?: boolean
          triggered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_list_items: {
        Row: {
          card_image_url: string | null
          created_at: string
          grade: string | null
          grading_company: string
          id: string
          inventory_item_id: string | null
          item_name: string
          list_id: string
          market_price: number | null
          quantity: number
          set_name: string
        }
        Insert: {
          card_image_url?: string | null
          created_at?: string
          grade?: string | null
          grading_company?: string
          id?: string
          inventory_item_id?: string | null
          item_name: string
          list_id: string
          market_price?: number | null
          quantity?: number
          set_name: string
        }
        Update: {
          card_image_url?: string | null
          created_at?: string
          grade?: string | null
          grading_company?: string
          id?: string
          inventory_item_id?: string | null
          item_name?: string
          list_id?: string
          market_price?: number | null
          quantity?: number
          set_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_list_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "client_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      client_lists: {
        Row: {
          created_at: string
          id: string
          list_name: string
          notes: string | null
          share_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          list_name: string
          notes?: string | null
          share_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          list_name?: string
          notes?: string | null
          share_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string
          feedback_type: string
          id: string
          message: string
          page_url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          feedback_type?: string
          id?: string
          message: string
          page_url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          feedback_type?: string
          id?: string
          message?: string
          page_url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      folders: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          icon: string
          is_default: boolean
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          icon?: string
          is_default?: boolean
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          icon?: string
          is_default?: boolean
          position?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      folder_items: {
        Row: {
          id: string
          folder_id: string
          inventory_item_id: string
          added_at: string
        }
        Insert: {
          id?: string
          folder_id: string
          inventory_item_id: string
          added_at?: string
        }
        Update: {
          id?: string
          folder_id?: string
          inventory_item_id?: string
          added_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "folder_items_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folder_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          }
        ]
      }
      shared_collections: {
        Row: {
          id: string
          user_id: string
          share_token: string
          title: string
          description: string | null
          share_type: string
          folder_id: string | null
          show_values: boolean
          show_purchase_prices: boolean
          expires_at: string | null
          view_count: number
          last_viewed_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          share_token: string
          title?: string
          description?: string | null
          share_type?: string
          folder_id?: string | null
          show_values?: boolean
          show_purchase_prices?: boolean
          expires_at?: string | null
          view_count?: number
          last_viewed_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          share_token?: string
          title?: string
          description?: string | null
          share_type?: string
          folder_id?: string | null
          show_values?: boolean
          show_purchase_prices?: boolean
          expires_at?: string | null
          view_count?: number
          last_viewed_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_collections_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          }
        ]
      }
      shared_collection_items: {
        Row: {
          id: string
          shared_collection_id: string
          inventory_item_id: string
          created_at: string
        }
        Insert: {
          id?: string
          shared_collection_id: string
          inventory_item_id: string
          created_at?: string
        }
        Update: {
          id?: string
          shared_collection_id?: string
          inventory_item_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_collection_items_shared_collection_id_fkey"
            columns: ["shared_collection_id"]
            isOneToOne: false
            referencedRelation: "shared_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_collection_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          }
        ]
      }
      inventory_items: {
        Row: {
          bgs_centering: number | null
          bgs_corners: number | null
          bgs_edges: number | null
          bgs_surface: number | null
          card_image_url: string | null
          card_number: string | null
          category: string | null
          condition: Database["public"]["Enums"]["card_condition"]
          created_at: string
          grade: string | null
          grading_company: Database["public"]["Enums"]["grading_company"]
          id: string
          language: string | null
          lowest_listed: number | null
          market_price: number | null
          name: string
          notes: string | null
          platform_sold: string | null
          purchase_date: string | null
          purchase_location: string | null
          purchase_price: number
          quantity: number
          raw_condition: string | null
          sale_price: number | null
          set_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bgs_centering?: number | null
          bgs_corners?: number | null
          bgs_edges?: number | null
          bgs_surface?: number | null
          card_image_url?: string | null
          card_number?: string | null
          category?: string | null
          condition?: Database["public"]["Enums"]["card_condition"]
          created_at?: string
          grade?: string | null
          grading_company?: Database["public"]["Enums"]["grading_company"]
          id?: string
          language?: string | null
          lowest_listed?: number | null
          market_price?: number | null
          name: string
          notes?: string | null
          platform_sold?: string | null
          purchase_date?: string | null
          purchase_location?: string | null
          purchase_price: number
          quantity?: number
          raw_condition?: string | null
          sale_price?: number | null
          set_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bgs_centering?: number | null
          bgs_corners?: number | null
          bgs_edges?: number | null
          bgs_surface?: number | null
          card_image_url?: string | null
          card_number?: string | null
          category?: string | null
          condition?: Database["public"]["Enums"]["card_condition"]
          created_at?: string
          grade?: string | null
          grading_company?: Database["public"]["Enums"]["grading_company"]
          id?: string
          language?: string | null
          lowest_listed?: number | null
          market_price?: number | null
          name?: string
          notes?: string | null
          platform_sold?: string | null
          purchase_date?: string | null
          purchase_location?: string | null
          purchase_price?: number
          quantity?: number
          raw_condition?: string | null
          sale_price?: number | null
          set_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      newsletter_signups: {
        Row: {
          created_at: string
          id: string
          phone_number: string
          subscribed: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          phone_number: string
          subscribed?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          phone_number?: string
          subscribed?: boolean
        }
        Relationships: []
      }
      products: {
        Row: {
          artist: string | null
          barcode: string | null
          card_number: string | null
          category: Database["public"]["Enums"]["product_category"]
          created_at: string
          id: string
          image_url: string | null
          last_price_update: string | null
          market_price: number | null
          name: string
          pokemon_tcg_id: string | null
          rarity: string | null
          set_name: string | null
          subtypes: string[] | null
          tcgplayer_id: string | null
          updated_at: string
        }
        Insert: {
          artist?: string | null
          barcode?: string | null
          card_number?: string | null
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          id?: string
          image_url?: string | null
          last_price_update?: string | null
          market_price?: number | null
          name: string
          pokemon_tcg_id?: string | null
          rarity?: string | null
          set_name?: string | null
          subtypes?: string[] | null
          tcgplayer_id?: string | null
          updated_at?: string
        }
        Update: {
          artist?: string | null
          barcode?: string | null
          card_number?: string | null
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          id?: string
          image_url?: string | null
          last_price_update?: string | null
          market_price?: number | null
          name?: string
          pokemon_tcg_id?: string | null
          rarity?: string | null
          set_name?: string | null
          subtypes?: string[] | null
          tcgplayer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchase_entries: {
        Row: {
          created_at: string
          id: string
          inventory_item_id: string | null
          item_name: string
          notes: string | null
          purchase_date: string
          purchase_price: number
          quantity: number
          set_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          item_name: string
          notes?: string | null
          purchase_date?: string
          purchase_price: number
          quantity?: number
          set_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          item_name?: string
          notes?: string | null
          purchase_date?: string
          purchase_price?: number
          quantity?: number
          set_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_entries_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          bgs_centering: number | null
          bgs_corners: number | null
          bgs_edges: number | null
          bgs_surface: number | null
          card_image_url: string | null
          client_name: string | null
          condition: string | null
          created_at: string
          event_name: string | null
          grade: string | null
          grading_company: string | null
          id: string
          inventory_item_id: string | null
          item_name: string
          notes: string | null
          platform: string | null
          profit: number | null
          purchase_price: number
          quantity_sold: number
          raw_condition: string | null
          sale_date: string
          sale_group_id: string | null
          sale_price: number
          set_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bgs_centering?: number | null
          bgs_corners?: number | null
          bgs_edges?: number | null
          bgs_surface?: number | null
          card_image_url?: string | null
          client_name?: string | null
          condition?: string | null
          created_at?: string
          event_name?: string | null
          grade?: string | null
          grading_company?: string | null
          id?: string
          inventory_item_id?: string | null
          item_name: string
          notes?: string | null
          platform?: string | null
          profit?: number | null
          purchase_price: number
          quantity_sold?: number
          raw_condition?: string | null
          sale_date?: string
          sale_group_id?: string | null
          sale_price: number
          set_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bgs_centering?: number | null
          bgs_corners?: number | null
          bgs_edges?: number | null
          bgs_surface?: number | null
          card_image_url?: string | null
          client_name?: string | null
          condition?: string | null
          created_at?: string
          event_name?: string | null
          grade?: string | null
          grading_company?: string | null
          id?: string
          inventory_item_id?: string | null
          item_name?: string
          notes?: string | null
          platform?: string | null
          profit?: number | null
          purchase_price?: number
          quantity_sold?: number
          raw_condition?: string | null
          sale_date?: string
          sale_group_id?: string | null
          sale_price?: number
          set_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_submissions: {
        Row: {
          id: string
          user_id: string
          inventory_item_id: string | null
          card_name: string
          set_name: string | null
          card_number: string | null
          card_image_url: string | null
          grading_company: string
          submission_date: string
          expected_return_date: string | null
          tracking_number: string | null
          status: Database["public"]["Enums"]["grading_status"]
          status_updated_at: string
          final_grade: string | null
          cert_number: string | null
          submission_cost: number
          shipping_cost: number
          insurance_cost: number
          service_level: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          inventory_item_id?: string | null
          card_name: string
          set_name?: string | null
          card_number?: string | null
          card_image_url?: string | null
          grading_company: string
          submission_date?: string
          expected_return_date?: string | null
          tracking_number?: string | null
          status?: Database["public"]["Enums"]["grading_status"]
          status_updated_at?: string
          final_grade?: string | null
          cert_number?: string | null
          submission_cost?: number
          shipping_cost?: number
          insurance_cost?: number
          service_level?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          inventory_item_id?: string | null
          card_name?: string
          set_name?: string | null
          card_number?: string | null
          card_image_url?: string | null
          grading_company?: string
          submission_date?: string
          expected_return_date?: string | null
          tracking_number?: string | null
          status?: Database["public"]["Enums"]["grading_status"]
          status_updated_at?: string
          final_grade?: string | null
          cert_number?: string | null
          submission_cost?: number
          shipping_cost?: number
          insurance_cost?: number
          service_level?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grading_submissions_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist: {
        Row: {
          id: string
          user_id: string
          card_id: string
          card_name: string
          set_name: string | null
          image_url: string | null
          target_price: number | null
          current_price: number | null
          notes: string | null
          tcg_type: string | null
          card_number: string | null
          rarity: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          card_id: string
          card_name: string
          set_name?: string | null
          image_url?: string | null
          target_price?: number | null
          current_price?: number | null
          notes?: string | null
          tcg_type?: string | null
          card_number?: string | null
          rarity?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          card_id?: string
          card_name?: string
          set_name?: string | null
          image_url?: string | null
          target_price?: number | null
          current_price?: number | null
          notes?: string | null
          tcg_type?: string | null
          card_number?: string | null
          rarity?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      set_progress: {
        Row: {
          id: string
          user_id: string
          set_id: string
          set_name: string
          tcg_type: string
          set_logo_url: string | null
          set_symbol_url: string | null
          release_date: string | null
          total_cards: number
          owned_cards: number
          completion_percentage: number
          owned_card_ids: string[]
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          set_id: string
          set_name: string
          tcg_type?: string
          set_logo_url?: string | null
          set_symbol_url?: string | null
          release_date?: string | null
          total_cards?: number
          owned_cards?: number
          owned_card_ids?: string[]
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          set_id?: string
          set_name?: string
          tcg_type?: string
          set_logo_url?: string | null
          set_symbol_url?: string | null
          release_date?: string | null
          total_cards?: number
          owned_cards?: number
          owned_card_ids?: string[]
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      set_cards_cache: {
        Row: {
          id: string
          set_id: string
          tcg_type: string
          set_name: string
          total_cards: number
          cards: Json
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: string
          set_id: string
          tcg_type: string
          set_name: string
          total_cards: number
          cards?: Json
          last_updated?: string
          created_at?: string
        }
        Update: {
          id?: string
          set_id?: string
          tcg_type?: string
          set_name?: string
          total_cards?: number
          cards?: Json
          last_updated?: string
          created_at?: string
        }
        Relationships: []
      }
      trade_listings: {
        Row: {
          id: string
          user_id: string
          inventory_item_id: string | null
          listing_type: string
          card_name: string
          set_name: string | null
          card_image_url: string | null
          looking_for: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          inventory_item_id?: string | null
          listing_type: string
          card_name: string
          set_name?: string | null
          card_image_url?: string | null
          looking_for?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          inventory_item_id?: string | null
          listing_type?: string
          card_name?: string
          set_name?: string | null
          card_image_url?: string | null
          looking_for?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_listings_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          }
        ]
      }
      trade_matches: {
        Row: {
          id: string
          user_a_id: string
          user_b_id: string
          user_a_listing_id: string | null
          user_b_listing_id: string | null
          status: string
          match_score: number | null
          proposed_by: string | null
          proposed_at: string | null
          responded_at: string | null
          completed_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_a_id: string
          user_b_id: string
          user_a_listing_id?: string | null
          user_b_listing_id?: string | null
          status?: string
          match_score?: number | null
          proposed_by?: string | null
          proposed_at?: string | null
          responded_at?: string | null
          completed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_a_id?: string
          user_b_id?: string
          user_a_listing_id?: string | null
          user_b_listing_id?: string | null
          status?: string
          match_score?: number | null
          proposed_by?: string | null
          proposed_at?: string | null
          responded_at?: string | null
          completed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_matches_user_a_listing_id_fkey"
            columns: ["user_a_listing_id"]
            isOneToOne: false
            referencedRelation: "trade_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_matches_user_b_listing_id_fkey"
            columns: ["user_b_listing_id"]
            isOneToOne: false
            referencedRelation: "trade_listings"
            referencedColumns: ["id"]
          }
        ]
      }
      trade_messages: {
        Row: {
          id: string
          trade_match_id: string
          sender_id: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          trade_match_id: string
          sender_id: string
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          trade_match_id?: string
          sender_id?: string
          message?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_messages_trade_match_id_fkey"
            columns: ["trade_match_id"]
            isOneToOne: false
            referencedRelation: "trade_matches"
            referencedColumns: ["id"]
          }
        ]
      }
      trade_offer_items: {
        Row: {
          id: string
          trade_match_id: string
          offered_by: string
          listing_id: string | null
          inventory_item_id: string | null
          card_name: string
          set_name: string | null
          card_image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          trade_match_id: string
          offered_by: string
          listing_id?: string | null
          inventory_item_id?: string | null
          card_name: string
          set_name?: string | null
          card_image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          trade_match_id?: string
          offered_by?: string
          listing_id?: string | null
          inventory_item_id?: string | null
          card_name?: string
          set_name?: string | null
          card_image_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_offer_items_trade_match_id_fkey"
            columns: ["trade_match_id"]
            isOneToOne: false
            referencedRelation: "trade_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_offer_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "trade_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_offer_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_products_prioritized: {
        Args: {
          exact_card_num: string
          result_limit?: number
          search_query: string
        }
        Returns: {
          artist: string
          card_number: string
          id: string
          image_url: string
          market_price: number
          name: string
          pokemon_tcg_id: string
          rarity: string
          set_name: string
          subtypes: string[]
        }[]
      }
      find_trade_matches: {
        Args: {
          p_user_id: string
        }
        Returns: {
          other_user_id: string
          match_score: number
          they_have_ids: string[]
          you_have_ids: string[]
        }[]
      }
    }
    Enums: {
      card_condition:
        | "mint"
        | "near-mint"
        | "lightly-played"
        | "moderately-played"
        | "heavily-played"
        | "damaged"
      grading_company: "raw" | "psa" | "bgs" | "cgc" | "ace" | "sgc" | "tag"
      grading_status: "submitted" | "received" | "grading" | "shipped" | "complete"
      product_category: "raw" | "graded" | "sealed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      card_condition: [
        "mint",
        "near-mint",
        "lightly-played",
        "moderately-played",
        "heavily-played",
        "damaged",
      ],
      grading_company: ["raw", "psa", "bgs", "cgc", "ace", "sgc", "tag"],
      grading_status: ["submitted", "received", "grading", "shipped", "complete"],
      product_category: ["raw", "graded", "sealed"],
    },
  },
} as const
