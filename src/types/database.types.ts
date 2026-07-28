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
      games: {
        Row: {
          accent_color: string | null
          animation_config: Json
          banner_asset_id: string | null
          config: Json
          cover_asset_id: string | null
          created_at: string
          cta_label: string
          description: string
          enabled: boolean
          id: string
          maintenance_mode: boolean
          maintenance_text: string | null
          maintenance_title: string | null
          name: string
          sort_order: number
          sound_config: Json
          theme_config: Json
          title: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          accent_color?: string | null
          animation_config?: Json
          banner_asset_id?: string | null
          config?: Json
          cover_asset_id?: string | null
          created_at?: string
          cta_label?: string
          description?: string
          enabled?: boolean
          id: string
          maintenance_mode?: boolean
          maintenance_text?: string | null
          maintenance_title?: string | null
          name: string
          sort_order?: number
          sound_config?: Json
          theme_config?: Json
          title: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          accent_color?: string | null
          animation_config?: Json
          banner_asset_id?: string | null
          config?: Json
          cover_asset_id?: string | null
          created_at?: string
          cta_label?: string
          description?: string
          enabled?: boolean
          id?: string
          maintenance_mode?: boolean
          maintenance_text?: string | null
          maintenance_title?: string | null
          name?: string
          sort_order?: number
          sound_config?: Json
          theme_config?: Json
          title?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "games_banner_asset_id_fkey"
            columns: ["banner_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_cover_asset_id_fkey"
            columns: ["cover_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      global_settings: {
        Row: {
          animation_config: Json
          auto_reset_seconds: number | null
          branding: Json
          canvas_size: number
          created_at: string
          attract_media_asset_id: string | null
          home_background_asset_id: string | null
          home_chrome: Json
          home_eyebrow: string
          home_subtitle: string
          home_title: string
          id: string
          idle_timeout_seconds: number | null
          leads_form: Json
          max_canvas_dpr: number
          preload_asset_keys: string[]
          reduced_motion_default: boolean
          sound_config: Json
          surface_config: Json
          theme: Json
          typography: Json
          updated_at: string
          version: string
        }
        Insert: {
          animation_config?: Json
          attract_media_asset_id?: string | null
          auto_reset_seconds?: number | null
          branding?: Json
          canvas_size?: number
          created_at?: string
          home_background_asset_id?: string | null
          home_chrome?: Json
          home_eyebrow?: string
          home_subtitle?: string
          home_title?: string
          id?: string
          idle_timeout_seconds?: number | null
          leads_form?: Json
          max_canvas_dpr?: number
          preload_asset_keys?: string[]
          reduced_motion_default?: boolean
          sound_config?: Json
          surface_config?: Json
          theme?: Json
          typography?: Json
          updated_at?: string
          version: string
        }
        Update: {
          animation_config?: Json
          attract_media_asset_id?: string | null
          auto_reset_seconds?: number | null
          branding?: Json
          canvas_size?: number
          created_at?: string
          home_background_asset_id?: string | null
          home_chrome?: Json
          home_eyebrow?: string
          home_subtitle?: string
          home_title?: string
          id?: string
          idle_timeout_seconds?: number | null
          leads_form?: Json
          max_canvas_dpr?: number
          preload_asset_keys?: string[]
          reduced_motion_default?: boolean
          sound_config?: Json
          surface_config?: Json
          theme?: Json
          typography?: Json
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "global_settings_attract_media_asset_id_fkey"
            columns: ["attract_media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "global_settings_home_background_asset_id_fkey"
            columns: ["home_background_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          game_id: string | null
          id: string
          legajo: string
          payload: Json
        }
        Insert: {
          created_at?: string
          game_id?: string | null
          id?: string
          legajo?: string
          payload?: Json
        }
        Update: {
          created_at?: string
          game_id?: string | null
          id?: string
          legajo?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "leads_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      match_pairs: {
        Row: {
          active: boolean
          created_at: string
          game_id: string
          id: string
          image_asset_id: string | null
          sort_order: number
          text: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          game_id: string
          id?: string
          image_asset_id?: string | null
          sort_order?: number
          text?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          game_id?: string
          id?: string
          image_asset_id?: string | null
          sort_order?: number
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_pairs_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_pairs_image_asset_id_fkey"
            columns: ["image_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          active: boolean
          alt_text: string
          bucket: string | null
          created_at: string
          duration_ms: number | null
          fallback_src: string | null
          height: number | null
          id: string
          key: string
          kind: string
          metadata: Json
          mime_type: string | null
          path: string | null
          public_url: string | null
          updated_at: string
          width: number | null
        }
        Insert: {
          active?: boolean
          alt_text?: string
          bucket?: string | null
          created_at?: string
          duration_ms?: number | null
          fallback_src?: string | null
          height?: number | null
          id?: string
          key: string
          kind: string
          metadata?: Json
          mime_type?: string | null
          path?: string | null
          public_url?: string | null
          updated_at?: string
          width?: number | null
        }
        Update: {
          active?: boolean
          alt_text?: string
          bucket?: string | null
          created_at?: string
          duration_ms?: number | null
          fallback_src?: string | null
          height?: number | null
          id?: string
          key?: string
          kind?: string
          metadata?: Json
          mime_type?: string | null
          path?: string | null
          public_url?: string | null
          updated_at?: string
          width?: number | null
        }
        Relationships: []
      }
      memory_card_faces: {
        Row: {
          active: boolean
          asset_id: string
          created_at: string
          game_id: string
          id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          asset_id: string
          created_at?: string
          game_id: string
          id?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          asset_id?: string
          created_at?: string
          game_id?: string
          id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_card_faces_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_card_faces_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_settings: {
        Row: {
          game_id: string
          player_mode: string
          time_limit_seconds: number
          updated_at: string
        }
        Insert: {
          game_id: string
          player_mode?: string
          time_limit_seconds?: number
          updated_at?: string
        }
        Update: {
          game_id?: string
          player_mode?: string
          time_limit_seconds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_settings_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: true
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      prize_inventory: {
        Row: {
          remaining_stock: number
          segment_id: string
          total_stock: number
          updated_at: string
        }
        Insert: {
          remaining_stock: number
          segment_id: string
          total_stock: number
          updated_at?: string
        }
        Update: {
          remaining_stock?: number
          segment_id?: string
          total_stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prize_inventory_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: true
            referencedRelation: "roulette_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          active: boolean
          correct_answer: boolean
          correct_option_index: number | null
          created_at: string
          game_id: string
          id: string
          image_alt: string
          image_asset_id: string | null
          options: string[] | null
          question: string
          question_type: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          correct_answer?: boolean
          correct_option_index?: number | null
          created_at?: string
          game_id: string
          id?: string
          image_alt?: string
          image_asset_id?: string | null
          options?: string[] | null
          question: string
          question_type?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          correct_answer?: boolean
          correct_option_index?: number | null
          created_at?: string
          game_id?: string
          id?: string
          image_alt?: string
          image_asset_id?: string | null
          options?: string[] | null
          question?: string
          question_type?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_questions_image_asset_id_fkey"
            columns: ["image_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      roulette_prize_inventory: {
        Row: {
          awarded_count: number
          remaining_stock: number
          reserved_stock: number
          segment_id: string
          total_stock: number
          updated_at: string
        }
        Insert: {
          awarded_count?: number
          remaining_stock: number
          reserved_stock?: number
          segment_id: string
          total_stock: number
          updated_at?: string
        }
        Update: {
          awarded_count?: number
          remaining_stock?: number
          reserved_stock?: number
          segment_id?: string
          total_stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roulette_prize_inventory_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: true
            referencedRelation: "roulette_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      roulette_segments: {
        Row: {
          asset_id: string | null
          color: string
          created_at: string
          enabled: boolean
          ends_at: string | null
          game_id: string
          id: string
          label: string
          max_winners: number | null
          metadata: Json
          prize_type: string
          probability_weight: number
          result_text: string | null
          result_title: string | null
          sort_order: number
          starts_at: string | null
          stock_managed: boolean
          text_color: string
          updated_at: string
        }
        Insert: {
          asset_id?: string | null
          color?: string
          created_at?: string
          enabled?: boolean
          ends_at?: string | null
          game_id: string
          id: string
          label: string
          max_winners?: number | null
          metadata?: Json
          prize_type: string
          probability_weight?: number
          result_text?: string | null
          result_title?: string | null
          sort_order?: number
          starts_at?: string | null
          stock_managed?: boolean
          text_color?: string
          updated_at?: string
        }
        Update: {
          asset_id?: string | null
          color?: string
          created_at?: string
          enabled?: boolean
          ends_at?: string | null
          game_id?: string
          id?: string
          label?: string
          max_winners?: number | null
          metadata?: Json
          prize_type?: string
          probability_weight?: number
          result_text?: string | null
          result_title?: string | null
          sort_order?: number
          starts_at?: string | null
          stock_managed?: boolean
          text_color?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roulette_segments_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roulette_segments_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      roulette_settings: {
        Row: {
          animation_config: Json
          duration_ms: number
          game_id: string
          instruction_text: string
          instruction_title: string
          max_spins_per_device: number | null
          min_turns: number
          offline_text: string
          offline_title: string
          sound_config: Json
          spin_label: string
          thanks_title: string
          updated_at: string
          winner_title: string
        }
        Insert: {
          animation_config?: Json
          duration_ms?: number
          game_id: string
          instruction_text?: string
          instruction_title?: string
          max_spins_per_device?: number | null
          min_turns?: number
          offline_text?: string
          offline_title?: string
          sound_config?: Json
          spin_label?: string
          thanks_title?: string
          updated_at?: string
          winner_title?: string
        }
        Update: {
          animation_config?: Json
          duration_ms?: number
          game_id?: string
          instruction_text?: string
          instruction_title?: string
          max_spins_per_device?: number | null
          min_turns?: number
          offline_text?: string
          offline_title?: string
          sound_config?: Json
          spin_label?: string
          thanks_title?: string
          updated_at?: string
          winner_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "roulette_settings_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: true
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      roulette_spin_logs: {
        Row: {
          created_at: string
          device_id: string
          game_id: string
          id: string
          is_winner: boolean
          prize_type: string
          request_meta: Json
          result_label: string
          segment_id: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          game_id: string
          id?: string
          is_winner?: boolean
          prize_type: string
          request_meta?: Json
          result_label: string
          segment_id?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          game_id?: string
          id?: string
          is_winner?: boolean
          prize_type?: string
          request_meta?: Json
          result_label?: string
          segment_id?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roulette_spin_logs_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roulette_spin_logs_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "roulette_segments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      spin_roulette: {
        Args: { p_device_id: string; p_game_id: string; p_session_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
