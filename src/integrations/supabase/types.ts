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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          doc_type: string
          file_path: string
          id: string
          name: string
          owner_id: string
          visibility: Database["public"]["Enums"]["doc_visibility"]
        }
        Insert: {
          created_at?: string
          doc_type?: string
          file_path: string
          id?: string
          name: string
          owner_id: string
          visibility?: Database["public"]["Enums"]["doc_visibility"]
        }
        Update: {
          created_at?: string
          doc_type?: string
          file_path?: string
          id?: string
          name?: string
          owner_id?: string
          visibility?: Database["public"]["Enums"]["doc_visibility"]
        }
        Relationships: []
      }
      founder_profiles: {
        Row: {
          amount_raising: number | null
          business_model: string | null
          company_name: string
          created_at: string
          description: string | null
          fundraising_status:
            | Database["public"]["Enums"]["fundraising_status"]
            | null
          interests: string[] | null
          looking_for: string[] | null
          sector: Database["public"]["Enums"]["startup_sector"] | null
          stage: Database["public"]["Enums"]["startup_stage"] | null
          subsector: string | null
          target_customer: string | null
          team_size: number | null
          traction: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          amount_raising?: number | null
          business_model?: string | null
          company_name?: string
          created_at?: string
          description?: string | null
          fundraising_status?:
            | Database["public"]["Enums"]["fundraising_status"]
            | null
          interests?: string[] | null
          looking_for?: string[] | null
          sector?: Database["public"]["Enums"]["startup_sector"] | null
          stage?: Database["public"]["Enums"]["startup_stage"] | null
          subsector?: string | null
          target_customer?: string | null
          team_size?: number | null
          traction?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          amount_raising?: number | null
          business_model?: string | null
          company_name?: string
          created_at?: string
          description?: string | null
          fundraising_status?:
            | Database["public"]["Enums"]["fundraising_status"]
            | null
          interests?: string[] | null
          looking_for?: string[] | null
          sector?: Database["public"]["Enums"]["startup_sector"] | null
          stage?: Database["public"]["Enums"]["startup_stage"] | null
          subsector?: string | null
          target_customer?: string | null
          team_size?: number | null
          traction?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      investor_profiles: {
        Row: {
          availability: string[] | null
          check_max: number | null
          check_min: number | null
          created_at: string
          fund_name: string
          interests: string[] | null
          investor_type: Database["public"]["Enums"]["investor_type"] | null
          looking_for_founders: string | null
          role: string | null
          sectors: Database["public"]["Enums"]["startup_sector"][] | null
          stages: Database["public"]["Enums"]["startup_stage"][] | null
          thesis: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          availability?: string[] | null
          check_max?: number | null
          check_min?: number | null
          created_at?: string
          fund_name?: string
          interests?: string[] | null
          investor_type?: Database["public"]["Enums"]["investor_type"] | null
          looking_for_founders?: string | null
          role?: string | null
          sectors?: Database["public"]["Enums"]["startup_sector"][] | null
          stages?: Database["public"]["Enums"]["startup_stage"][] | null
          thesis?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          availability?: string[] | null
          check_max?: number | null
          check_min?: number | null
          created_at?: string
          fund_name?: string
          interests?: string[] | null
          investor_type?: Database["public"]["Enums"]["investor_type"] | null
          looking_for_founders?: string | null
          role?: string | null
          sectors?: Database["public"]["Enums"]["startup_sector"][] | null
          stages?: Database["public"]["Enums"]["startup_stage"][] | null
          thesis?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          document_id: string | null
          id: string
          sender_id: string
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          document_id?: string | null
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          document_id?: string | null
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          featured: boolean
          full_name: string
          id: string
          linkedin: string | null
          location: string | null
          onboarded: boolean
          referral_code: string
          referred_by: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          featured?: boolean
          full_name?: string
          id: string
          linkedin?: string | null
          location?: string | null
          onboarded?: boolean
          referral_code?: string
          referred_by?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          featured?: boolean
          full_name?: string
          id?: string
          linkedin?: string | null
          location?: string | null
          onboarded?: boolean
          referral_code?: string
          referred_by?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "founder" | "investor" | "admin"
      doc_visibility: "private" | "matches" | "everyone" | "send_only"
      fundraising_status: "not_raising" | "raising_soon" | "actively_raising"
      investor_type:
        | "angel"
        | "vc"
        | "family_office"
        | "operator"
        | "scout"
        | "syndicate"
        | "other"
      startup_sector:
        | "saas"
        | "fintech"
        | "health_tech"
        | "ai"
        | "consumer"
        | "climate"
        | "real_estate"
        | "marketplace"
        | "education"
        | "ecommerce"
        | "other"
      startup_stage:
        | "idea"
        | "mvp"
        | "pre_seed"
        | "seed"
        | "series_a"
        | "series_b_plus"
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
      app_role: ["founder", "investor", "admin"],
      doc_visibility: ["private", "matches", "everyone", "send_only"],
      fundraising_status: ["not_raising", "raising_soon", "actively_raising"],
      investor_type: [
        "angel",
        "vc",
        "family_office",
        "operator",
        "scout",
        "syndicate",
        "other",
      ],
      startup_sector: [
        "saas",
        "fintech",
        "health_tech",
        "ai",
        "consumer",
        "climate",
        "real_estate",
        "marketplace",
        "education",
        "ecommerce",
        "other",
      ],
      startup_stage: [
        "idea",
        "mvp",
        "pre_seed",
        "seed",
        "series_a",
        "series_b_plus",
      ],
    },
  },
} as const
