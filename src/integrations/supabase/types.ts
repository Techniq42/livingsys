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
      alerts: {
        Row: {
          acknowledged: boolean | null
          alert_type: string
          created_at: string | null
          id: string
          message: string
          severity: string
        }
        Insert: {
          acknowledged?: boolean | null
          alert_type: string
          created_at?: string | null
          id?: string
          message: string
          severity?: string
        }
        Update: {
          acknowledged?: boolean | null
          alert_type?: string
          created_at?: string | null
          id?: string
          message?: string
          severity?: string
        }
        Relationships: []
      }
      approved_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          revoked_at: string | null
          role: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          revoked_at?: string | null
          role?: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          revoked_at?: string | null
          role?: string
          source?: string | null
        }
        Relationships: []
      }
      codex_conversations: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          session_id: string
          sources: Json | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          session_id: string
          sources?: Json | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          session_id?: string
          sources?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      content_pieces: {
        Row: {
          channels: Json | null
          created_at: string
          cta_text: string | null
          format_type: string
          hook: string | null
          id: string
          offer: string | null
          scheduled_at: string | null
          status: string
          story: string | null
          title: string
          user_id: string
        }
        Insert: {
          channels?: Json | null
          created_at?: string
          cta_text?: string | null
          format_type?: string
          hook?: string | null
          id?: string
          offer?: string | null
          scheduled_at?: string | null
          status?: string
          story?: string | null
          title?: string
          user_id: string
        }
        Update: {
          channels?: Json | null
          created_at?: string
          cta_text?: string | null
          format_type?: string
          hook?: string | null
          id?: string
          offer?: string | null
          scheduled_at?: string | null
          status?: string
          story?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      course_modules: {
        Row: {
          created_at: string
          description: string
          id: string
          is_locked: boolean
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_locked?: boolean
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_locked?: boolean
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          distribution_status: Json | null
          error_message: string | null
          id: string
          input_file: string | null
          input_type: string
          input_url: string | null
          outputs: Json | null
          selected_options: Json
          status: string
          template_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          distribution_status?: Json | null
          error_message?: string | null
          id?: string
          input_file?: string | null
          input_type: string
          input_url?: string | null
          outputs?: Json | null
          selected_options?: Json
          status?: string
          template_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          distribution_status?: Json | null
          error_message?: string | null
          id?: string
          input_file?: string | null
          input_type?: string
          input_url?: string | null
          outputs?: Json | null
          selected_options?: Json
          status?: string
          template_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          book_bump_clicked: boolean | null
          book_bump_timestamp: string | null
          created_at: string | null
          email: string
          first_name: string
          ghl_synced: boolean | null
          id: string
          ip_address: string | null
          last_name: string
          path: string
          phone: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          book_bump_clicked?: boolean | null
          book_bump_timestamp?: string | null
          created_at?: string | null
          email: string
          first_name: string
          ghl_synced?: boolean | null
          id?: string
          ip_address?: string | null
          last_name: string
          path: string
          phone?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          book_bump_clicked?: boolean | null
          book_bump_timestamp?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          ghl_synced?: boolean | null
          id?: string
          ip_address?: string | null
          last_name?: string
          path?: string
          phone?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      pipeline_status: {
        Row: {
          account_name: string
          contact_count: number | null
          id: string
          last_updated: string | null
          stuck_count: number | null
          track: string
        }
        Insert: {
          account_name: string
          contact_count?: number | null
          id?: string
          last_updated?: string | null
          stuck_count?: number | null
          track: string
        }
        Update: {
          account_name?: string
          contact_count?: number | null
          id?: string
          last_updated?: string | null
          stuck_count?: number | null
          track?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          resource_type: string
          sort_order: number
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_active?: boolean
          resource_type?: string
          sort_order?: number
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          resource_type?: string
          sort_order?: number
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      site_status: {
        Row: {
          domain: string
          id: string
          last_checked: string | null
          last_error: string | null
          ssl_expiry: string | null
          status: string
        }
        Insert: {
          domain: string
          id?: string
          last_checked?: string | null
          last_error?: string | null
          ssl_expiry?: string | null
          status?: string
        }
        Update: {
          domain?: string
          id?: string
          last_checked?: string | null
          last_error?: string | null
          ssl_expiry?: string | null
          status?: string
        }
        Relationships: []
      }
      user_module_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          module_id: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          module_id: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          module_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_templates: {
        Row: {
          created_at: string | null
          id: string
          input_type: string
          name: string
          selected_options: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          input_type: string
          name: string
          selected_options?: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          input_type?: string
          name?: string
          selected_options?: Json
          user_id?: string
        }
        Relationships: []
      }
      webhook_errors: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          payload: Json | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
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
      app_role: "practitioner" | "healer" | "administrator"
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
      app_role: ["practitioner", "healer", "administrator"],
    },
  },
} as const
