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
      access_audit_log: {
        Row: {
          client_fingerprint: string | null
          created_at: string
          details: Json | null
          id: string
          operation: string
          row_count: number | null
          success: boolean | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          client_fingerprint?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          operation: string
          row_count?: number | null
          success?: boolean | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          client_fingerprint?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          operation?: string
          row_count?: number | null
          success?: boolean | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
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
      corporate_bundles: {
        Row: {
          config: Json
          created_at: string
          created_by: string | null
          description: string | null
          featured: boolean | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          sector: string
          sort_order: number | null
          tags: string[] | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          config: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          sector: string
          sort_order?: number | null
          tags?: string[] | null
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          sector?: string
          sort_order?: number | null
          tags?: string[] | null
          tenant_id?: string
          updated_at?: string
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
      customer_contracts: {
        Row: {
          created_at: string
          customer_id: string
          ek_preis: number | null
          handy_nr: string | null
          hardware_name: string | null
          id: string
          monatspreis: number | null
          netz: string
          notes: string | null
          provision_erhalten: number | null
          status: string
          tarif_name: string | null
          updated_at: string
          user_id: string
          vertragsbeginn: string | null
          vertragsende: string | null
          vvl_datum: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          ek_preis?: number | null
          handy_nr?: string | null
          hardware_name?: string | null
          id?: string
          monatspreis?: number | null
          netz?: string
          notes?: string | null
          provision_erhalten?: number | null
          status?: string
          tarif_name?: string | null
          updated_at?: string
          user_id: string
          vertragsbeginn?: string | null
          vertragsende?: string | null
          vvl_datum?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          ek_preis?: number | null
          handy_nr?: string | null
          hardware_name?: string | null
          id?: string
          monatspreis?: number | null
          netz?: string
          notes?: string | null
          provision_erhalten?: number | null
          status?: string
          tarif_name?: string | null
          updated_at?: string
          user_id?: string
          vertragsbeginn?: string | null
          vertragsende?: string | null
          vvl_datum?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_import_mappings: {
        Row: {
          column_mapping: Json
          created_at: string
          field_transformations: Json | null
          id: string
          is_default: boolean | null
          mapping_name: string
          source_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          column_mapping?: Json
          created_at?: string
          field_transformations?: Json | null
          id?: string
          is_default?: boolean | null
          mapping_name: string
          source_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          column_mapping?: Json
          created_at?: string
          field_transformations?: Json | null
          id?: string
          is_default?: boolean | null
          mapping_name?: string
          source_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_notes: {
        Row: {
          content: string
          created_at: string
          customer_id: string
          id: string
          note_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          customer_id: string
          id?: string
          note_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          customer_id?: string
          id?: string
          note_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          anrede: string | null
          company_name: string
          contact_name: string | null
          created_at: string
          customer_status: string | null
          email: string | null
          external_id: string | null
          external_refs: Json | null
          festnetz: string | null
          geburtstag: string | null
          handy_nr: string | null
          hausnummer: string | null
          id: string
          industry: string | null
          marketing_brief: boolean | null
          marketing_email: boolean | null
          marketing_sms: boolean | null
          mocca_customer_number: string | null
          nachname: string | null
          notes: string | null
          ort: string | null
          phone: string | null
          plz: string | null
          strasse: string | null
          tenant_id: string
          updated_at: string
          user_id: string
          vip_kunde: boolean | null
          vorname: string | null
        }
        Insert: {
          anrede?: string | null
          company_name: string
          contact_name?: string | null
          created_at?: string
          customer_status?: string | null
          email?: string | null
          external_id?: string | null
          external_refs?: Json | null
          festnetz?: string | null
          geburtstag?: string | null
          handy_nr?: string | null
          hausnummer?: string | null
          id?: string
          industry?: string | null
          marketing_brief?: boolean | null
          marketing_email?: boolean | null
          marketing_sms?: boolean | null
          mocca_customer_number?: string | null
          nachname?: string | null
          notes?: string | null
          ort?: string | null
          phone?: string | null
          plz?: string | null
          strasse?: string | null
          tenant_id?: string
          updated_at?: string
          user_id: string
          vip_kunde?: boolean | null
          vorname?: string | null
        }
        Update: {
          anrede?: string | null
          company_name?: string
          contact_name?: string | null
          created_at?: string
          customer_status?: string | null
          email?: string | null
          external_id?: string | null
          external_refs?: Json | null
          festnetz?: string | null
          geburtstag?: string | null
          handy_nr?: string | null
          hausnummer?: string | null
          id?: string
          industry?: string | null
          marketing_brief?: boolean | null
          marketing_email?: boolean | null
          marketing_sms?: boolean | null
          mocca_customer_number?: string | null
          nachname?: string | null
          notes?: string | null
          ort?: string | null
          phone?: string | null
          plz?: string | null
          strasse?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
          vip_kunde?: boolean | null
          vorname?: string | null
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
      dataset_versions: {
        Row: {
          created_at: string
          created_by: string | null
          hardware_catalog: Json
          id: string
          is_active: boolean
          mobile_tariffs: Json
          omo_matrix: Json
          provisions: Json
          source_file: string | null
          sub_variants: Json
          tenant_id: string
          updated_at: string
          valid_from: string
          valid_until: string | null
          version_name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          hardware_catalog?: Json
          id?: string
          is_active?: boolean
          mobile_tariffs?: Json
          omo_matrix?: Json
          provisions?: Json
          source_file?: string | null
          sub_variants?: Json
          tenant_id: string
          updated_at?: string
          valid_from: string
          valid_until?: string | null
          version_name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          hardware_catalog?: Json
          id?: string
          is_active?: boolean
          mobile_tariffs?: Json
          omo_matrix?: Json
          provisions?: Json
          source_file?: string | null
          sub_variants?: Json
          tenant_id?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
          version_name?: string
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
      distribution_partners: {
        Row: {
          branding_override: Json | null
          created_at: string
          distribution_id: string
          id: string
          invite_expires_at: string | null
          invite_token: string | null
          invited_by: string | null
          invited_email: string | null
          max_seats: number | null
          max_users: number | null
          onboarded_at: string | null
          onboarded_by: string | null
          provision_split_pct: number | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          branding_override?: Json | null
          created_at?: string
          distribution_id: string
          id?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          invited_by?: string | null
          invited_email?: string | null
          max_seats?: number | null
          max_users?: number | null
          onboarded_at?: string | null
          onboarded_by?: string | null
          provision_split_pct?: number | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          branding_override?: Json | null
          created_at?: string
          distribution_id?: string
          id?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          invited_by?: string | null
          invited_email?: string | null
          max_seats?: number | null
          max_users?: number | null
          onboarded_at?: string | null
          onboarded_by?: string | null
          provision_split_pct?: number | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "distribution_partners_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "distributions"
            referencedColumns: ["id"]
          },
        ]
      }
      distributions: {
        Row: {
          address: Json | null
          branding: Json | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          default_provision_split: number | null
          features: Json | null
          id: string
          max_partners: number | null
          name: string
          slug: string
          status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          address?: Json | null
          branding?: Json | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          default_provision_split?: number | null
          features?: Json | null
          id?: string
          max_partners?: number | null
          name: string
          slug: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: Json | null
          branding?: Json | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          default_provision_split?: number | null
          features?: Json | null
          id?: string
          max_partners?: number | null
          name?: string
          slug?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      employee_settings: {
        Row: {
          blocked_tariffs: string[] | null
          can_export_pdf: boolean | null
          can_manage_customers: boolean | null
          can_view_margins: boolean | null
          created_at: string
          department: string | null
          display_name: string | null
          feature_overrides: Json | null
          id: string
          is_subuser: boolean | null
          provision_deduction: number | null
          provision_deduction_type: string | null
          tenant_id: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          blocked_tariffs?: string[] | null
          can_export_pdf?: boolean | null
          can_manage_customers?: boolean | null
          can_view_margins?: boolean | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          feature_overrides?: Json | null
          id?: string
          is_subuser?: boolean | null
          provision_deduction?: number | null
          provision_deduction_type?: string | null
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          blocked_tariffs?: string[] | null
          can_export_pdf?: boolean | null
          can_manage_customers?: boolean | null
          can_view_margins?: boolean | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          feature_overrides?: Json | null
          id?: string
          is_subuser?: boolean | null
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
      hardware_images: {
        Row: {
          created_at: string
          hardware_id: string
          id: string
          image_url: string
          tenant_id: string
          thumbnail_url: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          hardware_id: string
          id?: string
          image_url: string
          tenant_id?: string
          thumbnail_url?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          hardware_id?: string
          id?: string
          image_url?: string
          tenant_id?: string
          thumbnail_url?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      hardware_imports: {
        Row: {
          added_count: number
          changed_count: number
          created_at: string
          error_count: number
          file_name: string
          file_type: string
          id: string
          removed_count: number
          status: string
          tenant_id: string
          total_rows: number
          user_id: string
          warnings: Json | null
        }
        Insert: {
          added_count?: number
          changed_count?: number
          created_at?: string
          error_count?: number
          file_name: string
          file_type?: string
          id?: string
          removed_count?: number
          status?: string
          tenant_id: string
          total_rows?: number
          user_id: string
          warnings?: Json | null
        }
        Update: {
          added_count?: number
          changed_count?: number
          created_at?: string
          error_count?: number
          file_name?: string
          file_type?: string
          id?: string
          removed_count?: number
          status?: string
          tenant_id?: string
          total_rows?: number
          user_id?: string
          warnings?: Json | null
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
      offer_emails: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          message: string | null
          offer_data: Json | null
          recipient_email: string
          recipient_name: string | null
          resend_message_id: string | null
          status: string
          subject: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          message?: string | null
          offer_data?: Json | null
          recipient_email: string
          recipient_name?: string | null
          resend_message_id?: string | null
          status?: string
          subject: string
          tenant_id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          message?: string | null
          offer_data?: Json | null
          recipient_email?: string
          recipient_name?: string | null
          resend_message_id?: string | null
          status?: string
          subject?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_emails_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_team_id: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_approved: boolean | null
          last_activity_at: string | null
          updated_at: string
        }
        Insert: {
          active_team_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          is_approved?: boolean | null
          last_activity_at?: string | null
          updated_at?: string
        }
        Update: {
          active_team_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_approved?: boolean | null
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
          conditions: Json
          contract_type: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          scope_id: string | null
          scope_type: string
          target_type: string
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
          conditions?: Json
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          scope_id?: string | null
          scope_type?: string
          target_type?: string
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
          conditions?: Json
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          scope_id?: string | null
          scope_type?: string
          target_type?: string
          tariff_family?: string | null
          tariff_id?: string
          tenant_id?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      push_tariff_groups: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          match_pattern: string | null
          name: string
          tariff_ids: string[] | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          match_pattern?: string | null
          name: string
          tariff_ids?: string[] | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          match_pattern?: string | null
          name?: string
          tariff_ids?: string[] | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limit_entries: {
        Row: {
          category: string
          created_at: string
          id: string
          key_hash: string
          request_count: number
          window_start: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          key_hash: string
          request_count?: number
          window_start?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          key_hash?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      saved_offers: {
        Row: {
          config: Json
          created_at: string
          customer_id: string | null
          dataset_version_id: string | null
          id: string
          is_draft: boolean | null
          name: string
          preview: Json | null
          team_id: string | null
          tenant_id: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          config: Json
          created_at?: string
          customer_id?: string | null
          dataset_version_id?: string | null
          id?: string
          is_draft?: boolean | null
          name: string
          preview?: Json | null
          team_id?: string | null
          tenant_id?: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          config?: Json
          created_at?: string
          customer_id?: string | null
          dataset_version_id?: string | null
          id?: string
          is_draft?: boolean | null
          name?: string
          preview?: Json | null
          team_id?: string | null
          tenant_id?: string
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
            foreignKeyName: "saved_offers_dataset_version_id_fkey"
            columns: ["dataset_version_id"]
            isOneToOne: false
            referencedRelation: "dataset_versions"
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
      tenant_distribution_map: {
        Row: {
          distribution_id: string
          is_active: boolean | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          distribution_id: string
          is_active?: boolean | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          distribution_id?: string
          is_active?: boolean | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tenant_hardware: {
        Row: {
          brand: string
          category: string | null
          created_at: string | null
          created_by: string | null
          ek_net: number
          hardware_id: string
          id: string
          is_active: boolean | null
          model: string
          sort_order: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          brand: string
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          ek_net: number
          hardware_id: string
          id?: string
          is_active?: boolean | null
          model: string
          sort_order?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          brand?: string
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          ek_net?: number
          hardware_id?: string
          id?: string
          is_active?: boolean | null
          model?: string
          sort_order?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tenant_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invite_token: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invite_token: string
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invite_token?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
        }
        Relationships: []
      }
      tenant_provisions: {
        Row: {
          contract_type: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          provision_amount: number
          sub_variant_id: string | null
          tariff_family: string | null
          tariff_id: string
          tariff_name: string
          tenant_id: string
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          contract_type?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          provision_amount: number
          sub_variant_id?: string | null
          tariff_family?: string | null
          tariff_id: string
          tariff_name: string
          tenant_id: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          contract_type?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          provision_amount?: number
          sub_variant_id?: string | null
          tariff_family?: string | null
          tariff_id?: string
          tariff_name?: string
          tenant_id?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      tenant_settings: {
        Row: {
          branding: Json | null
          created_at: string
          default_blocked_tariffs: string[] | null
          default_provision_deduction: number | null
          default_provision_deduction_type: string | null
          distribution_id: string | null
          features_override: Json | null
          hide_margin_for_subusers: boolean | null
          id: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          branding?: Json | null
          created_at?: string
          default_blocked_tariffs?: string[] | null
          default_provision_deduction?: number | null
          default_provision_deduction_type?: string | null
          distribution_id?: string | null
          features_override?: Json | null
          hide_margin_for_subusers?: boolean | null
          id?: string
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          branding?: Json | null
          created_at?: string
          default_blocked_tariffs?: string[] | null
          default_provision_deduction?: number | null
          default_provision_deduction_type?: string | null
          distribution_id?: string | null
          features_override?: Json | null
          hide_margin_for_subusers?: boolean | null
          id?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_settings_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "distributions"
            referencedColumns: ["id"]
          },
        ]
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
      user_activity_log: {
        Row: {
          action: string
          created_at: string
          department_id: string | null
          id: string
          ip_hash: string | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_name: string | null
          resource_type: string
          summary: string | null
          tenant_id: string
          user_agent_hash: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          department_id?: string | null
          id?: string
          ip_hash?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_name?: string | null
          resource_type: string
          summary?: string | null
          tenant_id: string
          user_agent_hash?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          department_id?: string | null
          id?: string
          ip_hash?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_name?: string | null
          resource_type?: string
          summary?: string | null
          tenant_id?: string
          user_agent_hash?: string | null
          user_id?: string
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
      audit_rls_security: {
        Args: never
        Returns: {
          has_select_policy: boolean
          risk_level: string
          rls_enabled: boolean
          select_requires_auth: boolean
          table_name: string
        }[]
      }
      check_rate_limit: {
        Args: {
          _category: string
          _key_hash: string
          _max_requests?: number
          _window_seconds?: number
        }
        Returns: number
      }
      cleanup_old_activities: {
        Args: { retention_days?: number }
        Returns: number
      }
      cleanup_rate_limits: { Args: never; Returns: number }
      get_effective_provision_split: { Args: never; Returns: number }
      get_my_department_id: { Args: never; Returns: string }
      get_my_distribution_id: { Args: never; Returns: string }
      get_my_distribution_ids: { Args: never; Returns: string[] }
      get_my_tenant_id: { Args: never; Returns: string }
      get_rate_limit_status: {
        Args: { _category: string; _key_hash: string; _window_seconds?: number }
        Returns: {
          current_count: number
          window_end: string
          window_start: string
        }[]
      }
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
      is_distribution_member: {
        Args: { _distribution_id: string }
        Returns: boolean
      }
      is_same_tenant: { Args: { _tenant_id: string }; Returns: boolean }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_tenant_admin: { Args: { _user_id: string }; Returns: boolean }
      is_tenant_manager: { Args: { _user_id: string }; Returns: boolean }
      is_user_approved: { Args: { _user_id: string }; Returns: boolean }
      log_cross_tenant_attempt: {
        Args: {
          _action: string
          _actual_tenant_id: string
          _attempted_tenant_id: string
          _user_id: string
        }
        Returns: undefined
      }
      log_user_activity: {
        Args: {
          _action: string
          _metadata?: Json
          _new_values?: Json
          _old_values?: Json
          _resource_id?: string
          _resource_name?: string
          _resource_type: string
          _summary?: string
          _user_id: string
        }
        Returns: string
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
      app_role: "admin" | "moderator" | "tenant_admin" | "user"
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
      app_role: ["admin", "moderator", "tenant_admin", "user"],
    },
  },
} as const
