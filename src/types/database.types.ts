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
      app_config: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          config: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      game_events: {
        Row: {
          created_at: string
          device_id: string
          event_type: string
          game_id: string
          id: string
          payload: Json
          session_id: string | null
          session_key: string
        }
        Insert: {
          created_at?: string
          device_id: string
          event_type: string
          game_id: string
          id?: string
          payload?: Json
          session_id?: string | null
          session_key: string
        }
        Update: {
          created_at?: string
          device_id?: string
          event_type?: string
          game_id?: string
          id?: string
          payload?: Json
          session_id?: string | null
          session_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_events_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_rewards: {
        Row: {
          active: boolean
          asset_id: string | null
          config: Json
          created_at: string
          ends_at: string | null
          game_id: string
          id: string
          max_awards: number | null
          name: string
          reward_type: string
          sort_order: number
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          asset_id?: string | null
          config?: Json
          created_at?: string
          ends_at?: string | null
          game_id: string
          id?: string
          max_awards?: number | null
          name: string
          reward_type?: string
          sort_order?: number
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          asset_id?: string | null
          config?: Json
          created_at?: string
          ends_at?: string | null
          game_id?: string
          id?: string
          max_awards?: number | null
          name?: string
          reward_type?: string
          sort_order?: number
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_rewards_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rewards_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          created_at: string
          device_id: string
          finished_at: string | null
          game_id: string
          id: string
          max_score: number | null
          metadata: Json
          outcome: string | null
          score: number | null
          session_key: string
          source: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          device_id: string
          finished_at?: string | null
          game_id: string
          id?: string
          max_score?: number | null
          metadata?: Json
          outcome?: string | null
          score?: number | null
          session_key: string
          source?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          device_id?: string
          finished_at?: string | null
          game_id?: string
          id?: string
          max_score?: number | null
          metadata?: Json
          outcome?: string | null
          score?: number | null
          session_key?: string
          source?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
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
          home_background_asset_id: string | null
          home_eyebrow: string
          home_subtitle: string
          home_title: string
          id: string
          idle_timeout_seconds: number | null
          max_canvas_dpr: number
          preload_asset_keys: string[]
          reduced_motion_default: boolean
          sound_config: Json
          theme: Json
          updated_at: string
          version: string
        }
        Insert: {
          animation_config?: Json
          auto_reset_seconds?: number | null
          branding?: Json
          canvas_size?: number
          created_at?: string
          home_background_asset_id?: string | null
          home_eyebrow?: string
          home_subtitle?: string
          home_title?: string
          id?: string
          idle_timeout_seconds?: number | null
          max_canvas_dpr?: number
          preload_asset_keys?: string[]
          reduced_motion_default?: boolean
          sound_config?: Json
          theme?: Json
          updated_at?: string
          version: string
        }
        Update: {
          animation_config?: Json
          auto_reset_seconds?: number | null
          branding?: Json
          canvas_size?: number
          created_at?: string
          home_background_asset_id?: string | null
          home_eyebrow?: string
          home_subtitle?: string
          home_title?: string
          id?: string
          idle_timeout_seconds?: number | null
          max_canvas_dpr?: number
          preload_asset_keys?: string[]
          reduced_motion_default?: boolean
          sound_config?: Json
          theme?: Json
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "global_settings_home_background_asset_id_fkey"
            columns: ["home_background_asset_id"]
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
          accent_color: string
          active: boolean
          asset_id: string | null
          asset_label: string
          created_at: string
          id: string
          label: string
          level_id: string
          metadata: Json
          pair_key: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          accent_color?: string
          active?: boolean
          asset_id?: string | null
          asset_label?: string
          created_at?: string
          id?: string
          label: string
          level_id: string
          metadata?: Json
          pair_key: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          accent_color?: string
          active?: boolean
          asset_id?: string | null
          asset_label?: string
          created_at?: string
          id?: string
          label?: string
          level_id?: string
          metadata?: Json
          pair_key?: string
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
            foreignKeyName: "memory_card_faces_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "memory_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_levels: {
        Row: {
          active: boolean
          columns: number
          config: Json
          created_at: string
          difficulty: string
          game_id: string
          id: string
          instruction_text: string | null
          instruction_title: string | null
          key: string
          name: string
          reveal_delay_ms: number
          reward_id: string | null
          rows: number
          sort_order: number
          time_limit_seconds: number
          timeout_text: string | null
          timeout_title: string | null
          updated_at: string
          victory_text: string | null
          victory_title: string | null
        }
        Insert: {
          active?: boolean
          columns?: number
          config?: Json
          created_at?: string
          difficulty?: string
          game_id: string
          id?: string
          instruction_text?: string | null
          instruction_title?: string | null
          key: string
          name: string
          reveal_delay_ms?: number
          reward_id?: string | null
          rows?: number
          sort_order?: number
          time_limit_seconds?: number
          timeout_text?: string | null
          timeout_title?: string | null
          updated_at?: string
          victory_text?: string | null
          victory_title?: string | null
        }
        Update: {
          active?: boolean
          columns?: number
          config?: Json
          created_at?: string
          difficulty?: string
          game_id?: string
          id?: string
          instruction_text?: string | null
          instruction_title?: string | null
          key?: string
          name?: string
          reveal_delay_ms?: number
          reward_id?: string | null
          rows?: number
          sort_order?: number
          time_limit_seconds?: number
          timeout_text?: string | null
          timeout_title?: string | null
          updated_at?: string
          victory_text?: string | null
          victory_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memory_levels_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_levels_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "game_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_settings: {
        Row: {
          animation_config: Json
          card_faces: Json
          columns: number
          difficulty: string
          game_id: string
          instruction_text: string
          instruction_title: string
          reveal_delay_ms: number
          rows: number
          sound_config: Json
          time_limit_seconds: number
          timeout_text: string
          timeout_title: string
          updated_at: string
          victory_text: string
          victory_title: string
        }
        Insert: {
          animation_config?: Json
          card_faces?: Json
          columns?: number
          difficulty?: string
          game_id: string
          instruction_text?: string
          instruction_title?: string
          reveal_delay_ms?: number
          rows?: number
          sound_config?: Json
          time_limit_seconds?: number
          timeout_text?: string
          timeout_title?: string
          updated_at?: string
          victory_text?: string
          victory_title?: string
        }
        Update: {
          animation_config?: Json
          card_faces?: Json
          columns?: number
          difficulty?: string
          game_id?: string
          instruction_text?: string
          instruction_title?: string
          reveal_delay_ms?: number
          rows?: number
          sound_config?: Json
          time_limit_seconds?: number
          timeout_text?: string
          timeout_title?: string
          updated_at?: string
          victory_text?: string
          victory_title?: string
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
      quiz_answers: {
        Row: {
          active: boolean
          answer_value: string
          created_at: string
          id: string
          is_correct: boolean
          label: string
          metadata: Json
          question_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          answer_value: string
          created_at?: string
          id?: string
          is_correct?: boolean
          label: string
          metadata?: Json
          question_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          answer_value?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          label?: string
          metadata?: Json
          question_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_categories: {
        Row: {
          active: boolean
          config: Json
          created_at: string
          description: string
          game_id: string
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          config?: Json
          created_at?: string
          description?: string
          game_id: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          config?: Json
          created_at?: string
          description?: string
          game_id?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_categories_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          active: boolean
          category_id: string | null
          created_at: string
          difficulty: string
          feedback_correct: string | null
          feedback_incorrect: string | null
          game_id: string
          id: string
          image_alt: string
          image_asset_id: string | null
          metadata: Json
          points: number
          question: string
          sort_order: number
          time_limit_seconds: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          difficulty?: string
          feedback_correct?: string | null
          feedback_incorrect?: string | null
          game_id: string
          id?: string
          image_alt?: string
          image_asset_id?: string | null
          metadata?: Json
          points?: number
          question: string
          sort_order?: number
          time_limit_seconds?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          difficulty?: string
          feedback_correct?: string | null
          feedback_incorrect?: string | null
          game_id?: string
          id?: string
          image_alt?: string
          image_asset_id?: string | null
          metadata?: Json
          points?: number
          question?: string
          sort_order?: number
          time_limit_seconds?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "quiz_categories"
            referencedColumns: ["id"]
          },
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
      quiz_result_rules: {
        Row: {
          active: boolean
          config: Json
          created_at: string
          game_id: string
          id: string
          max_percentage: number | null
          max_score: number | null
          min_percentage: number | null
          min_score: number | null
          reward_id: string | null
          sort_order: number
          text: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          config?: Json
          created_at?: string
          game_id: string
          id?: string
          max_percentage?: number | null
          max_score?: number | null
          min_percentage?: number | null
          min_score?: number | null
          reward_id?: string | null
          sort_order?: number
          text?: string
          title?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          config?: Json
          created_at?: string
          game_id?: string
          id?: string
          max_percentage?: number | null
          max_score?: number | null
          min_percentage?: number | null
          min_score?: number | null
          reward_id?: string | null
          sort_order?: number
          text?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_result_rules_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_result_rules_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "game_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_settings: {
        Row: {
          animation_config: Json
          correct_feedback: string
          correct_label: string
          default_time_per_question_seconds: number | null
          empty_text: string
          empty_title: string
          feedback_delay_ms: number
          final_text: string
          final_title: string
          game_id: string
          incorrect_feedback: string
          incorrect_label: string
          instruction_title: string
          loading_text: string
          next_delay_ms: number
          next_question_text: string
          pass_score: number | null
          randomize_answers: boolean
          randomize_questions: boolean
          sound_config: Json
          updated_at: string
        }
        Insert: {
          animation_config?: Json
          correct_feedback?: string
          correct_label?: string
          default_time_per_question_seconds?: number | null
          empty_text?: string
          empty_title?: string
          feedback_delay_ms?: number
          final_text?: string
          final_title?: string
          game_id: string
          incorrect_feedback?: string
          incorrect_label?: string
          instruction_title?: string
          loading_text?: string
          next_delay_ms?: number
          next_question_text?: string
          pass_score?: number | null
          randomize_answers?: boolean
          randomize_questions?: boolean
          sound_config?: Json
          updated_at?: string
        }
        Update: {
          animation_config?: Json
          correct_feedback?: string
          correct_label?: string
          default_time_per_question_seconds?: number | null
          empty_text?: string
          empty_title?: string
          feedback_delay_ms?: number
          final_text?: string
          final_title?: string
          game_id?: string
          incorrect_feedback?: string
          incorrect_label?: string
          instruction_title?: string
          loading_text?: string
          next_delay_ms?: number
          next_question_text?: string
          pass_score?: number | null
          randomize_answers?: boolean
          randomize_questions?: boolean
          sound_config?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_settings_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: true
            referencedRelation: "games"
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
