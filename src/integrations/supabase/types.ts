export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      notifications: {
        Row: {
          created_at: string;
          id: string;
          message: string;
          product_id: string | null;
          read_at: string | null;
          scheduled_for: string | null;
          sent_at: string | null;
          title: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message: string;
          product_id?: string | null;
          read_at?: string | null;
          scheduled_for?: string | null;
          sent_at?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string;
          product_id?: string | null;
          read_at?: string | null;
          scheduled_for?: string | null;
          sent_at?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          barcode: string | null;
          brand: string | null;
          category: string;
          created_at: string;
          expiry_date: string | null;
          id: string;
          identification_confidence: number | null;
          image_url: string | null;
          ingredients: Json;
          manufacturing_date: string | null;
          name: string;
          notes: string | null;
          purchase_date: string | null;
          quantity: string | null;
          reminder_days: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          barcode?: string | null;
          brand?: string | null;
          category?: string;
          created_at?: string;
          expiry_date?: string | null;
          id?: string;
          identification_confidence?: number | null;
          image_url?: string | null;
          ingredients?: Json;
          manufacturing_date?: string | null;
          name: string;
          notes?: string | null;
          purchase_date?: string | null;
          quantity?: string | null;
          reminder_days?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          barcode?: string | null;
          brand?: string | null;
          category?: string;
          created_at?: string;
          expiry_date?: string | null;
          id?: string;
          identification_confidence?: number | null;
          image_url?: string | null;
          ingredients?: Json;
          manufacturing_date?: string | null;
          name?: string;
          notes?: string | null;
          purchase_date?: string | null;
          quantity?: string | null;
          reminder_days?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      scans: {
        Row: {
          confidence: number | null;
          confirmed: boolean;
          created_at: string;
          extracted_data: Json;
          id: string;
          product_id: string | null;
          scan_type: string;
          user_id: string;
        };
        Insert: {
          confidence?: number | null;
          confirmed?: boolean;
          created_at?: string;
          extracted_data?: Json;
          id?: string;
          product_id?: string | null;
          scan_type?: string;
          user_id: string;
        };
        Update: {
          confidence?: number | null;
          confirmed?: boolean;
          created_at?: string;
          extracted_data?: Json;
          id?: string;
          product_id?: string | null;
          scan_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scans_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      user_preferences: {
        Row: {
          avoided_ingredients: string[];
          created_at: string;
          fragrance_free: boolean;
          gluten_avoidance: boolean;
          id: string;
          sensitive_skin: boolean;
          updated_at: string;
          user_id: string;
          vegan: boolean;
          vegetarian: boolean;
        };
        Insert: {
          avoided_ingredients?: string[];
          created_at?: string;
          fragrance_free?: boolean;
          gluten_avoidance?: boolean;
          id?: string;
          sensitive_skin?: boolean;
          updated_at?: string;
          user_id: string;
          vegan?: boolean;
          vegetarian?: boolean;
        };
        Update: {
          avoided_ingredients?: string[];
          created_at?: string;
          fragrance_free?: boolean;
          gluten_avoidance?: boolean;
          id?: string;
          sensitive_skin?: boolean;
          updated_at?: string;
          user_id?: string;
          vegan?: boolean;
          vegetarian?: boolean;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
