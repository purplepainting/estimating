export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'ADMIN' | 'ESTIMATOR' | 'VIEWER'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          role?: 'ADMIN' | 'ESTIMATOR' | 'VIEWER'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'ADMIN' | 'ESTIMATOR' | 'VIEWER'
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          first_name: string
          last_name?: string
          phone: string
          email?: string
          address1: string
          address2?: string
          city?: string
          state?: string
          postal?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name?: string
          phone: string
          email?: string
          address1: string
          address2?: string
          city?: string
          state?: string
          postal?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          phone?: string
          email?: string
          address1?: string
          address2?: string
          city?: string
          state?: string
          postal?: string
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          client_id: string
          name: string
          site_address: string
          category: 'residential' | 'commercial' | 'HOA' | 'healthcare' | 'industrial'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          site_address: string
          category: 'residential' | 'commercial' | 'HOA' | 'healthcare' | 'industrial'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          site_address?: string
          category?: 'residential' | 'commercial' | 'HOA' | 'healthcare' | 'industrial'
          created_at?: string
          updated_at?: string
        }
      }
      job_walks: {
        Row: {
          id: string
          project_id: string
          scheduled_date: string
          scheduled_time: string
          estimator_id: string
          notes?: string
          status: 'scheduled' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          scheduled_date: string
          scheduled_time: string
          estimator_id: string
          notes?: string
          status?: 'scheduled' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          scheduled_date?: string
          scheduled_time?: string
          estimator_id?: string
          notes?: string
          status?: 'scheduled' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      estimates: {
        Row: {
          id: string
          project_id: string
          job_walk_id?: string
          status: 'draft' | 'sent' | 'accepted' | 'lost'
          total_amount: number
          overhead_percent: number
          profit_percent: number
          tax_percent: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          job_walk_id?: string
          status?: 'draft' | 'sent' | 'accepted' | 'lost'
          total_amount?: number
          overhead_percent?: number
          profit_percent?: number
          tax_percent?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          job_walk_id?: string
          status?: 'draft' | 'sent' | 'accepted' | 'lost'
          total_amount?: number
          overhead_percent?: number
          profit_percent?: number
          tax_percent?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      price_items: {
        Row: {
          id: string
          section: 'interior' | 'exterior' | 'cabinets' | 'general'
          code: string
          label: string
          uom: 'sqft' | 'lnft' | 'ea'
          base_unit_cost: number
          base_unit_price: number
          formula_key: 'walls_sqft' | 'ceil_sqft' | 'base_lnft' | 'exterior_walls' | 'eaves_sqft' | 'fascia_lnft' | 'elevation_walls' | 'manual'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          section: 'interior' | 'exterior' | 'cabinets' | 'general'
          code: string
          label: string
          uom: 'sqft' | 'lnft' | 'ea'
          base_unit_cost: number
          base_unit_price: number
          formula_key: 'walls_sqft' | 'ceil_sqft' | 'base_lnft' | 'exterior_walls' | 'eaves_sqft' | 'fascia_lnft' | 'elevation_walls' | 'manual'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          section?: 'interior' | 'exterior' | 'cabinets' | 'general'
          code?: string
          label?: string
          uom?: 'sqft' | 'lnft' | 'ea'
          base_unit_cost?: number
          base_unit_price?: number
          formula_key?: 'walls_sqft' | 'ceil_sqft' | 'base_lnft' | 'exterior_walls' | 'eaves_sqft' | 'fascia_lnft' | 'elevation_walls' | 'manual'
          created_at?: string
          updated_at?: string
        }
      }
      modifiers: {
        Row: {
          id: string
          section: 'interior' | 'exterior' | 'cabinets' | 'general'
          scope: 'item' | 'area' | 'estimate'
          code: string
          label: string
          cost_adjustment: number
          price_adjustment: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          section: 'interior' | 'exterior' | 'cabinets' | 'general'
          scope: 'item' | 'area' | 'estimate'
          code: string
          label: string
          cost_adjustment: number
          price_adjustment: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          section?: 'interior' | 'exterior' | 'cabinets' | 'general'
          scope?: 'item' | 'area' | 'estimate'
          code?: string
          label?: string
          cost_adjustment?: number
          price_adjustment?: number
          created_at?: string
          updated_at?: string
        }
      }
      estimate_areas: {
        Row: {
          id: string
          estimate_id: string
          name: string
          type: 'interior' | 'exterior' | 'cabinets'
          length: number
          width: number
          height?: number
          perimeter?: number
          eaves_length?: number
          elevation?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          estimate_id: string
          name: string
          type: 'interior' | 'exterior' | 'cabinets'
          length: number
          width: number
          height?: number
          perimeter?: number
          eaves_length?: number
          elevation?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          estimate_id?: string
          name?: string
          type?: 'interior' | 'exterior' | 'cabinets'
          length?: number
          width?: number
          height?: number
          perimeter?: number
          eaves_length?: number
          elevation?: string
          created_at?: string
          updated_at?: string
        }
      }
      estimate_items: {
        Row: {
          id: string
          estimate_id: string
          area_id?: string
          price_item_id: string
          quantity: number
          unit_cost: number
          unit_price: number
          extended_cost: number
          extended_price: number
          notes?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          estimate_id: string
          area_id?: string
          price_item_id: string
          quantity: number
          unit_cost: number
          unit_price: number
          extended_cost: number
          extended_price: number
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          estimate_id?: string
          area_id?: string
          price_item_id?: string
          quantity?: number
          unit_cost?: number
          unit_price?: number
          extended_cost?: number
          extended_price?: number
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      estimate_modifiers: {
        Row: {
          id: string
          estimate_id: string
          area_id?: string
          item_id?: string
          modifier_id: string
          scope: 'item' | 'area' | 'estimate'
          created_at: string
        }
        Insert: {
          id?: string
          estimate_id: string
          area_id?: string
          item_id?: string
          modifier_id: string
          scope: 'item' | 'area' | 'estimate'
          created_at?: string
        }
        Update: {
          id?: string
          estimate_id?: string
          area_id?: string
          item_id?: string
          modifier_id?: string
          scope?: 'item' | 'area' | 'estimate'
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
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
