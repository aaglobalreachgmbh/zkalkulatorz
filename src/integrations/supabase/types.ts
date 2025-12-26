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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          ip_hash: string | null
          new_values: Json | null
          old_values: Json | null
          target_id: string | null
          target_table: string | null
          user_agent_hash: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          ip_hash?: string | null
          new_values?: Json | null
          old_values?: Json | null
          target_id?: string | null
          target_table?: string | null
          user_agent_hash?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          ip_hash?: string | null
          new_values?: Json | null
          old_values?: Json | null
          target_id?: string | null
          target_table?: string | null
          user_agent_hash?: string | null
        }
        Relationships: []
      }
      blocked_ips: {
        Row: {
          block_count: number | null
          blocked_until: string | null
          created_at: string
          id: string
          ip_hash: string
          reason: string
          updated_at: string
        }
        Insert: {
          block_count?: number | null
          blocked_until?: string | null
          created_at?: string
          id?: string
          ip_hash: string
          reason: string
          updated_at?: string
        }
        Update: {
          block_count?: number | null
          blocked_until?: string | null
          created_at?: string
          id?: string
          ip_hash?: string
          reason?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          company_name: string
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          industry: string | null
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_security_reports: {
        Row: {
          blocked_ips: number | null
          created_at: string
          critical_events: number | null
          email_sent: boolean | null
          id: string
          report_data: Json | null
          report_date: string
          security_score: number | null
          top_attackers: Json | null
          top_threats: Json | null
          total_events: number | null
        }
        Insert: {
          blocked_ips?: number | null
          created_at?: string
          critical_events?: number | null
          email_sent?: boolean | null
          id?: string
          report_data?: Json | null
          report_date: string
          security_score?: number | null
          top_attackers?: Json | null
          top_threats?: Json | null
          total_events?: number | null
        }
        Update: {
          blocked_ips?: number | null
          created_at?: string
          critical_events?: number | null
          email_sent?: boolean | null
          id?: string
          report_data?: Json | null
          report_date?: string
          security_score?: number | null
          top_attackers?: Json | null
          top_threats?: Json | null
          total_events?: number | null
        }
        Relationships: []
      }
      honeypot_submissions: {
        Row: {
          created_at: string
          field_name: string
          field_value: string | null
          form_id: string | null
          id: string
          ip_hash: string
          user_agent_hash: string | null
        }
        Insert: {
          created_at?: string
          field_name: string
          field_value?: string | null
          form_id?: string | null
          id?: string
          ip_hash: string
          user_agent_hash?: string | null
        }
        Update: {
          created_at?: string
          field_name?: string
          field_value?: string | null
          form_id?: string | null
          id?: string
          ip_hash?: string
          user_agent_hash?: string | null
        }
        Relationships: []
      }
      login_anomalies: {
        Row: {
          anomaly_type: string
          created_at: string
          details: Json | null
          id: string
          ip_hash: string
          resolved: boolean | null
          severity: string
          user_id: string | null
        }
        Insert: {
          anomaly_type: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_hash: string
          resolved?: boolean | null
          severity?: string
          user_id?: string | null
        }
        Update: {
          anomaly_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_hash?: string
          resolved?: boolean | null
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      mfa_backup_codes: {
        Row: {
          code_hash: string
          created_at: string
          id: string
          used: boolean | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          id?: string
          used?: boolean | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          id?: string
          used?: boolean | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      offer_activities: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          metadata: Json | null
          offer_id: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          offer_id?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          offer_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_activities_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "saved_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_team_id: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          active_team_id?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          active_team_id?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_team_id_fkey"
            columns: ["active_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_offers: {
        Row: {
          config: Json
          created_at: string
          customer_id: string | null
          id: string
          is_draft: boolean | null
          name: string
          preview: Json | null
          team_id: string | null
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          config: Json
          created_at?: string
          customer_id?: string | null
          id?: string
          is_draft?: boolean | null
          name: string
          preview?: Json | null
          team_id?: string | null
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          config?: Json
          created_at?: string
          customer_id?: string | null
          id?: string
          is_draft?: boolean | null
          name?: string
          preview?: Json | null
          team_id?: string | null
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_offers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_offers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string
          details: Json | null
          email_sent: boolean | null
          event_type: string
          id: string
          ip_hash: string | null
          is_bot: boolean | null
          is_phishing: boolean | null
          risk_level: string
          user_agent_hash: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          email_sent?: boolean | null
          event_type: string
          id?: string
          ip_hash?: string | null
          is_bot?: boolean | null
          is_phishing?: boolean | null
          risk_level: string
          user_agent_hash?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          email_sent?: boolean | null
          event_type?: string
          id?: string
          ip_hash?: string | null
          is_bot?: boolean | null
          is_phishing?: boolean | null
          risk_level?: string
          user_agent_hash?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      threat_feed_entries: {
        Row: {
          auto_blocked: boolean | null
          confidence_score: number | null
          feed_id: string
          first_seen_at: string
          id: string
          ip_hash: string
          last_seen_at: string
          metadata: Json | null
          threat_type: string | null
        }
        Insert: {
          auto_blocked?: boolean | null
          confidence_score?: number | null
          feed_id: string
          first_seen_at?: string
          id?: string
          ip_hash: string
          last_seen_at?: string
          metadata?: Json | null
          threat_type?: string | null
        }
        Update: {
          auto_blocked?: boolean | null
          confidence_score?: number | null
          feed_id?: string
          first_seen_at?: string
          id?: string
          ip_hash?: string
          last_seen_at?: string
          metadata?: Json | null
          threat_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "threat_feed_entries_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "threat_feeds"
            referencedColumns: ["id"]
          },
        ]
      }
      threat_feeds: {
        Row: {
          created_at: string
          enabled: boolean | null
          feed_name: string
          feed_url: string
          id: string
          last_sync_at: string | null
          sync_status: string
          total_entries: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          feed_name: string
          feed_url: string
          id?: string
          last_sync_at?: string | null
          sync_status?: string
          total_entries?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          feed_name?: string
          feed_url?: string
          id?: string
          last_sync_at?: string | null
          sync_status?: string
          total_entries?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      get_team_role: {
        Args: { _team_id: string; _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
