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
      calculation_history: {
        Row: {
          avg_monthly: number | null
          config: Json
          created_at: string
          department_id: string | null
          hardware_name: string | null
          id: string
          margin: number | null
          summary: string | null
          tariff_name: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          avg_monthly?: number | null
          config: Json
          created_at?: string
          department_id?: string | null
          hardware_name?: string | null
          id?: string
          margin?: number | null
          summary?: string | null
          tariff_name?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          avg_monthly?: number | null
          config?: Json
          created_at?: string
          department_id?: string | null
          hardware_name?: string | null
          id?: string
          margin?: number | null
          summary?: string | null
          tariff_name?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_datasets: {
        Row: {
          created_at: string
          created_by: string | null
          dataset_version: string
          fixed_net_products: Json
          hardware_catalog: Json
          id: string
          mobile_dependencies: Json
          mobile_features: Json
          mobile_tariffs: Json
          omo_matrix: Json
          promos: Json
          provisions: Json
          sub_variants: Json
          tenant_id: string
          updated_at: string
          valid_from: string
          verified_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dataset_version: string
          fixed_net_products?: Json
          hardware_catalog?: Json
          id?: string
          mobile_dependencies?: Json
          mobile_features?: Json
          mobile_tariffs?: Json
          omo_matrix?: Json
          promos?: Json
          provisions?: Json
          sub_variants?: Json
          tenant_id: string
          updated_at?: string
          valid_from: string
          verified_at: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dataset_version?: string
          fixed_net_products?: Json
          hardware_catalog?: Json
          id?: string
          mobile_dependencies?: Json
          mobile_features?: Json
          mobile_tariffs?: Json
          omo_matrix?: Json
          promos?: Json
          provisions?: Json
          sub_variants?: Json
          tenant_id?: string
          updated_at?: string
          valid_from?: string
          verified_at?: string
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
      departments: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          name: string
          parent_id: string | null
          policy: Json
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          name: string
          parent_id?: string | null
          policy?: Json
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          name?: string
          parent_id?: string | null
          policy?: Json
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_settings: {
        Row: {
          blocked_tariffs: string[] | null
          created_at: string
          department: string | null
          display_name: string | null
          feature_overrides: Json | null
          id: string
          provision_deduction: number | null
          provision_deduction_type: string | null
          tenant_id: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          blocked_tariffs?: string[] | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          feature_overrides?: Json | null
          id?: string
          provision_deduction?: number | null
          provision_deduction_type?: string | null
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          blocked_tariffs?: string[] | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          feature_overrides?: Json | null
          id?: string
          provision_deduction?: number | null
          provision_deduction_type?: string | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gdpr_deletion_log: {
        Row: {
          deleted_at: string
          deleted_tables: Json | null
          deletion_reason: string
          deletion_requested_by: string | null
          email_hash: string | null
          id: string
          user_id: string
        }
        Insert: {
          deleted_at?: string
          deleted_tables?: Json | null
          deletion_reason?: string
          deletion_requested_by?: string | null
          email_hash?: string | null
          id?: string
          user_id: string
        }
        Update: {
          deleted_at?: string
          deleted_tables?: Json | null
          deletion_reason?: string
          deletion_requested_by?: string | null
          email_hash?: string | null
          id?: string
          user_id?: string
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
      licenses: {
        Row: {
          activated_at: string | null
          created_at: string
          features: Json
          id: string
          plan: string
          seat_limit: number
          seats_used: number
          tenant_id: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          features?: Json
          id?: string
          plan?: string
          seat_limit?: number
          seats_used?: number
          tenant_id: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          features?: Json
          id?: string
          plan?: string
          seat_limit?: number
          seats_used?: number
          tenant_id?: string
          updated_at?: string
          valid_until?: string | null
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
      offer_drafts: {
        Row: {
          config: Json
          created_at: string
          department_id: string | null
          draft_type: string
          folder_id: string | null
          id: string
          name: string
          preview: Json | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config: Json
          created_at?: string
          department_id?: string | null
          draft_type?: string
          folder_id?: string | null
          id?: string
          name: string
          preview?: Json | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          department_id?: string | null
          draft_type?: string
          folder_id?: string | null
          id?: string
          name?: string
          preview?: Json | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_drafts_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "template_folders"
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
          last_activity_at: string | null
          updated_at: string
        }
        Insert: {
          active_team_id?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          last_activity_at?: string | null
          updated_at?: string
        }
        Update: {
          active_team_id?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          last_activity_at?: string | null
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
      push_provisions: {
        Row: {
          bonus_amount: number
          bonus_type: string | null
          contract_type: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          scope_id: string | null
          scope_type: string
          tariff_family: string | null
          tariff_id: string
          tenant_id: string
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          bonus_amount: number
          bonus_type?: string | null
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          scope_id?: string | null
          scope_type?: string
          tariff_family?: string | null
          tariff_id: string
          tenant_id: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          bonus_amount?: number
          bonus_type?: string | null
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          scope_id?: string | null
          scope_type?: string
          tariff_family?: string | null
          tariff_id?: string
          tenant_id?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
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
      seat_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          id: string
          tenant_id: string
          user_email: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          id?: string
          tenant_id: string
          user_email: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          id?: string
          tenant_id?: string
          user_email?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
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
      template_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "template_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_settings: {
        Row: {
          created_at: string
          default_blocked_tariffs: string[] | null
          default_provision_deduction: number | null
          default_provision_deduction_type: string | null
          id: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          default_blocked_tariffs?: string[] | null
          default_provision_deduction?: number | null
          default_provision_deduction_type?: string | null
          id?: string
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          default_blocked_tariffs?: string[] | null
          default_provision_deduction?: number | null
          default_provision_deduction_type?: string | null
          id?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
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
      user_department_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          department_id: string
          id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          department_id: string
          id?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          department_id?: string
          id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_meta: {
        Row: {
          created_at: string | null
          discount_tier: string | null
          feature_flags: Json | null
          id: string
          subscription_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          discount_tier?: string | null
          feature_flags?: Json | null
          id?: string
          subscription_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          discount_tier?: string | null
          feature_flags?: Json | null
          id?: string
          subscription_status?: string | null
          updated_at?: string | null
          user_id?: string
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
      update_user_meta: {
        Args: {
          _discount_tier?: string
          _feature_flags?: Json
          _subscription_status?: string
          _user_id: string
        }
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
