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
      daily_rewards_log: {
        Row: {
          claim_date: string
          created_at: string
          day_in_streak: number
          reward_kind: string
          reward_value: number
          user_id: string
        }
        Insert: {
          claim_date: string
          created_at?: string
          day_in_streak: number
          reward_kind: string
          reward_value?: number
          user_id: string
        }
        Update: {
          claim_date?: string
          created_at?: string
          day_in_streak?: number
          reward_kind?: string
          reward_value?: number
          user_id?: string
        }
        Relationships: []
      }
      learning_recommendations: {
        Row: {
          coach_note: string | null
          confidence_gain: number | null
          est_days: number | null
          generated_at: string
          id: string
          resources: Json
          topic: string
          user_id: string
        }
        Insert: {
          coach_note?: string | null
          confidence_gain?: number | null
          est_days?: number | null
          generated_at?: string
          id?: string
          resources?: Json
          topic: string
          user_id: string
        }
        Update: {
          coach_note?: string | null
          confidence_gain?: number | null
          est_days?: number | null
          generated_at?: string
          id?: string
          resources?: Json
          topic?: string
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
      match_answers: {
        Row: {
          correct_answer: string | null
          created_at: string
          difficulty: string | null
          explanation: string | null
          id: string
          is_correct: boolean
          language: string | null
          question_id: string | null
          question_text: string | null
          room_code: string | null
          subtopic: string | null
          time_ms: number | null
          topic: string
          user_answer: string | null
          user_id: string | null
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          id?: string
          is_correct?: boolean
          language?: string | null
          question_id?: string | null
          question_text?: string | null
          room_code?: string | null
          subtopic?: string | null
          time_ms?: number | null
          topic: string
          user_answer?: string | null
          user_id?: string | null
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          id?: string
          is_correct?: boolean
          language?: string | null
          question_id?: string | null
          question_text?: string | null
          room_code?: string | null
          subtopic?: string | null
          time_ms?: number | null
          topic?: string
          user_answer?: string | null
          user_id?: string | null
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
      mp_match_audit: {
        Row: {
          connection_issues: Json | null
          created_at: string
          difficulty: string | null
          id: string
          language: string | null
          players: Json
          questions_count: number | null
          room_code: string
          topics: string[]
          user_id: string | null
          winner: string | null
          xp_awarded: Json | null
        }
        Insert: {
          connection_issues?: Json | null
          created_at?: string
          difficulty?: string | null
          id?: string
          language?: string | null
          players?: Json
          questions_count?: number | null
          room_code: string
          topics?: string[]
          user_id?: string | null
          winner?: string | null
          xp_awarded?: Json | null
        }
        Update: {
          connection_issues?: Json | null
          created_at?: string
          difficulty?: string | null
          id?: string
          language?: string | null
          players?: Json
          questions_count?: number | null
          room_code?: string
          topics?: string[]
          user_id?: string | null
          winner?: string | null
          xp_awarded?: Json | null
        }
        Relationships: []
      }
      mp_room_players: {
        Row: {
          challenges_won: number
          coins: number
          correct_answers: number
          device_id: string | null
          finished: boolean
          is_host: boolean
          joined_at: string
          last_activity: string
          last_seen: string
          name: string
          ready: boolean
          room_code: string
          score: number
          session_token: string
          user_id: string
          wrong_answers: number
        }
        Insert: {
          challenges_won?: number
          coins?: number
          correct_answers?: number
          device_id?: string | null
          finished?: boolean
          is_host?: boolean
          joined_at?: string
          last_activity?: string
          last_seen?: string
          name: string
          ready?: boolean
          room_code: string
          score?: number
          session_token?: string
          user_id: string
          wrong_answers?: number
        }
        Update: {
          challenges_won?: number
          coins?: number
          correct_answers?: number
          device_id?: string | null
          finished?: boolean
          is_host?: boolean
          joined_at?: string
          last_activity?: string
          last_seen?: string
          name?: string
          ready?: boolean
          room_code?: string
          score?: number
          session_token?: string
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
          expires_at: string
          host_id: string
          language: string
          level: number
          session_token: string
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          host_id: string
          language?: string
          level?: number
          session_token?: string
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          host_id?: string
          language?: string
          level?: number
          session_token?: string
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
          best_accuracy: number
          challenges_solved: number
          fastest_time_ms: number | null
          languages_played: Json
          levels_completed: number
          longest_session_s: number
          mp_wins: number
          total_coins: number
          total_correct: number
          total_play_time_s: number
          total_wrong: number
          updated_at: string
          user_id: string
        }
        Insert: {
          best_accuracy?: number
          challenges_solved?: number
          fastest_time_ms?: number | null
          languages_played?: Json
          levels_completed?: number
          longest_session_s?: number
          mp_wins?: number
          total_coins?: number
          total_correct?: number
          total_play_time_s?: number
          total_wrong?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          best_accuracy?: number
          challenges_solved?: number
          fastest_time_ms?: number | null
          languages_played?: Json
          levels_completed?: number
          longest_session_s?: number
          mp_wins?: number
          total_coins?: number
          total_correct?: number
          total_play_time_s?: number
          total_wrong?: number
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
          last_reward_claim: string | null
          login_streak: number
          recovery_email: string | null
          share_insights: boolean
          streak_freeze_tokens: number
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          last_login?: string
          last_reward_claim?: string | null
          login_streak?: number
          recovery_email?: string | null
          share_insights?: boolean
          streak_freeze_tokens?: number
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          last_login?: string
          last_reward_claim?: string | null
          login_streak?: number
          recovery_email?: string | null
          share_insights?: boolean
          streak_freeze_tokens?: number
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      progress_events: {
        Row: {
          created_at: string
          id: string
          kind: string
          language: string | null
          level: number | null
          payload: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          language?: string | null
          level?: number | null
          payload?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          language?: string | null
          level?: number | null
          payload?: Json
          user_id?: string
        }
        Relationships: []
      }
      save_backups: {
        Row: {
          created_at: string
          id: string
          snapshot: Json
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          snapshot: Json
          source: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          snapshot?: Json
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      topic_mastery: {
        Row: {
          accuracy: number
          correct: number
          id: string
          last_played: string
          mastery_level: string
          topic: string
          updated_at: string
          user_id: string
          wrong: number
        }
        Insert: {
          accuracy?: number
          correct?: number
          id?: string
          last_played?: string
          mastery_level?: string
          topic: string
          updated_at?: string
          user_id: string
          wrong?: number
        }
        Update: {
          accuracy?: number
          correct?: number
          id?: string
          last_played?: string
          mastery_level?: string
          topic?: string
          updated_at?: string
          user_id?: string
          wrong?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_daily_reward: { Args: never; Returns: Json }
      mp_award_points: {
        Args: {
          _challenge_win: boolean
          _coin_delta: number
          _correct_delta: number
          _room: string
          _score_delta: number
          _token: string
        }
        Returns: Json
      }
      mp_is_member: {
        Args: { _room: string; _token: string }
        Returns: boolean
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
