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
      achievements_unlocked: {
        Row: {
          achievement_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      level_results: {
        Row: {
          accuracy: number
          attempts: number
          best_score: number
          best_time_ms: number | null
          language: string
          level: number
          stars: number
          updated_at: string
          user_id: string
          wins: number
        }
        Insert: {
          accuracy?: number
          attempts?: number
          best_score?: number
          best_time_ms?: number | null
          language: string
          level: number
          stars?: number
          updated_at?: string
          user_id: string
          wins?: number
        }
        Update: {
          accuracy?: number
          attempts?: number
          best_score?: number
          best_time_ms?: number | null
          language?: string
          level?: number
          stars?: number
          updated_at?: string
          user_id?: string
          wins?: number
        }
        Relationships: []
      }
      mp_challenge_locks: {
        Row: {
          challenge_id: number
          created_at: string
          id: number
          level: number
          owner_id: string
          owner_name: string
          room_code: string
          solved_correctly: boolean | null
          status: string
          topic: string | null
        }
        Insert: {
          challenge_id: number
          created_at?: string
          id?: number
          level: number
          owner_id: string
          owner_name: string
          room_code: string
          solved_correctly?: boolean | null
          status?: string
          topic?: string | null
        }
        Update: {
          challenge_id?: number
          created_at?: string
          id?: number
          level?: number
          owner_id?: string
          owner_name?: string
          room_code?: string
          solved_correctly?: boolean | null
          status?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mp_challenge_locks_room_code_fkey"
            columns: ["room_code"]
            isOneToOne: false
            referencedRelation: "mp_rooms"
            referencedColumns: ["code"]
          },
        ]
      }
      mp_room_players: {
        Row: {
          challenges_won: number
          coins: number
          correct_answers: number
          finished: boolean
          is_host: boolean
          joined_at: string
          last_seen: string
          name: string
          ready: boolean
          room_code: string
          score: number
          user_id: string
          wrong_answers: number
        }
        Insert: {
          challenges_won?: number
          coins?: number
          correct_answers?: number
          finished?: boolean
          is_host?: boolean
          joined_at?: string
          last_seen?: string
          name: string
          ready?: boolean
          room_code: string
          score?: number
          user_id: string
          wrong_answers?: number
        }
        Update: {
          challenges_won?: number
          coins?: number
          correct_answers?: number
          finished?: boolean
          is_host?: boolean
          joined_at?: string
          last_seen?: string
          name?: string
          ready?: boolean
          room_code?: string
          score?: number
          user_id?: string
          wrong_answers?: number
        }
        Relationships: [
          {
            foreignKeyName: "mp_room_players_room_code_fkey"
            columns: ["room_code"]
            isOneToOne: false
            referencedRelation: "mp_rooms"
            referencedColumns: ["code"]
          },
        ]
      }
      mp_rooms: {
        Row: {
          code: string
          created_at: string
          host_id: string
          language: string
          level: number
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          host_id: string
          language?: string
          level?: number
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          host_id?: string
          language?: string
          level?: number
          status?: string
        }
        Relationships: []
      }
      player_progress: {
        Row: {
          coins: number
          current_level: number
          language: string
          total_stars: number
          unlocked_level: number
          updated_at: string
          user_id: string
        }
        Insert: {
          coins?: number
          current_level?: number
          language: string
          total_stars?: number
          unlocked_level?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          coins?: number
          current_level?: number
          language?: string
          total_stars?: number
          unlocked_level?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      player_stats: {
        Row: {
          challenges_solved: number
          fastest_time_ms: number | null
          languages_played: Json
          levels_completed: number
          mp_wins: number
          total_play_time_s: number
          updated_at: string
          user_id: string
        }
        Insert: {
          challenges_solved?: number
          fastest_time_ms?: number | null
          languages_played?: Json
          levels_completed?: number
          mp_wins?: number
          total_play_time_s?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          challenges_solved?: number
          fastest_time_ms?: number | null
          languages_played?: Json
          levels_completed?: number
          mp_wins?: number
          total_play_time_s?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          last_login: string
          login_streak: number
          recovery_email: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          last_login?: string
          login_streak?: number
          recovery_email?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          last_login?: string
          login_streak?: number
          recovery_email?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
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
