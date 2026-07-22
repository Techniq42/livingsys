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
      alert_templates: {
        Row: {
          body_template: string
          channel: string
          created_at: string | null
          id: string
          name: string
          subject_template: string | null
        }
        Insert: {
          body_template: string
          channel?: string
          created_at?: string | null
          id?: string
          name: string
          subject_template?: string | null
        }
        Update: {
          body_template?: string
          channel?: string
          created_at?: string | null
          id?: string
          name?: string
          subject_template?: string | null
        }
        Relationships: []
      }
      alerts: {
        Row: {
          acknowledged: boolean | null
          context: Json | null
          created_at: string | null
          id: string
          message: string
          severity: string
          template_id: string | null
        }
        Insert: {
          acknowledged?: boolean | null
          context?: Json | null
          created_at?: string | null
          id?: string
          message: string
          severity?: string
          template_id?: string | null
        }
        Update: {
          acknowledged?: boolean | null
          context?: Json | null
          created_at?: string | null
          id?: string
          message?: string
          severity?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "alert_templates"
            referencedColumns: ["id"]
          },
        ]
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
      attestation_grants: {
        Row: {
          granted_at: string
          grantee_scope: string
          granter_op: string
          id: string
          predicate: Json
          revoked_at: string | null
          surface: string
        }
        Insert: {
          granted_at?: string
          grantee_scope: string
          granter_op: string
          id?: string
          predicate?: Json
          revoked_at?: string | null
          surface: string
        }
        Update: {
          granted_at?: string
          grantee_scope?: string
          granter_op?: string
          id?: string
          predicate?: Json
          revoked_at?: string | null
          surface?: string
        }
        Relationships: []
      }
      bad_faith_patterns: {
        Row: {
          canonical_md: string
          context_tier: string
          created_at: string
          detection_hints: Json
          display_name: string
          pattern_kind: string
          slug: string
        }
        Insert: {
          canonical_md: string
          context_tier?: string
          created_at?: string
          detection_hints?: Json
          display_name: string
          pattern_kind: string
          slug: string
        }
        Update: {
          canonical_md?: string
          context_tier?: string
          created_at?: string
          detection_hints?: Json
          display_name?: string
          pattern_kind?: string
          slug?: string
        }
        Relationships: []
      }
      codex_documents: {
        Row: {
          body_md: string
          created_at: string | null
          doc_type: string
          hwr_axes: Database["public"]["Enums"]["hwr_axis"][] | null
          id: string
          metadata: Json | null
          pedigree: string[] | null
          slug: string
          source_path: string | null
          source_repo: string | null
          title: string
          updated_at: string | null
          version: number | null
          visibility: string
        }
        Insert: {
          body_md: string
          created_at?: string | null
          doc_type: string
          hwr_axes?: Database["public"]["Enums"]["hwr_axis"][] | null
          id?: string
          metadata?: Json | null
          pedigree?: string[] | null
          slug: string
          source_path?: string | null
          source_repo?: string | null
          title: string
          updated_at?: string | null
          version?: number | null
          visibility?: string
        }
        Update: {
          body_md?: string
          created_at?: string | null
          doc_type?: string
          hwr_axes?: Database["public"]["Enums"]["hwr_axis"][] | null
          id?: string
          metadata?: Json | null
          pedigree?: string[] | null
          slug?: string
          source_path?: string | null
          source_repo?: string | null
          title?: string
          updated_at?: string | null
          version?: number | null
          visibility?: string
        }
        Relationships: []
      }
      community_threads: {
        Row: {
          author: string | null
          created_at: string
          id: string
          matched_keywords: string[] | null
          notes: string | null
          platform: Database["public"]["Enums"]["radar_platform"]
          post_id: string
          post_title: string
          post_url: string
          relevance_score: number | null
          replied_at: string | null
          snippet: string | null
          status: Database["public"]["Enums"]["thread_status"]
          subreddit: string | null
          updated_at: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          id?: string
          matched_keywords?: string[] | null
          notes?: string | null
          platform?: Database["public"]["Enums"]["radar_platform"]
          post_id: string
          post_title: string
          post_url: string
          relevance_score?: number | null
          replied_at?: string | null
          snippet?: string | null
          status?: Database["public"]["Enums"]["thread_status"]
          subreddit?: string | null
          updated_at?: string
        }
        Update: {
          author?: string | null
          created_at?: string
          id?: string
          matched_keywords?: string[] | null
          notes?: string | null
          platform?: Database["public"]["Enums"]["radar_platform"]
          post_id?: string
          post_title?: string
          post_url?: string
          relevance_score?: number | null
          replied_at?: string | null
          snippet?: string | null
          status?: Database["public"]["Enums"]["thread_status"]
          subreddit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      constructive_patterns: {
        Row: {
          canonical_md: string
          context_tier: string
          created_at: string
          display_name: string
          slug: string
        }
        Insert: {
          canonical_md: string
          context_tier?: string
          created_at?: string
          display_name: string
          slug: string
        }
        Update: {
          canonical_md?: string
          context_tier?: string
          created_at?: string
          display_name?: string
          slug?: string
        }
        Relationships: []
      }
      content_hooks: {
        Row: {
          body_md: string
          context_tier: Database["public"]["Enums"]["context_tier"]
          created_at: string
          format: string
          hook_slug: string
          hwr_lean: Database["public"]["Enums"]["hwr_axis"][]
          id: string
          intended_outcome: string | null
          source_chunk_id: string | null
          source_document_id: string | null
          status: string
          surface: string
          updated_at: string
        }
        Insert: {
          body_md: string
          context_tier?: Database["public"]["Enums"]["context_tier"]
          created_at?: string
          format: string
          hook_slug: string
          hwr_lean?: Database["public"]["Enums"]["hwr_axis"][]
          id?: string
          intended_outcome?: string | null
          source_chunk_id?: string | null
          source_document_id?: string | null
          status?: string
          surface: string
          updated_at?: string
        }
        Update: {
          body_md?: string
          context_tier?: Database["public"]["Enums"]["context_tier"]
          created_at?: string
          format?: string
          hook_slug?: string
          hwr_lean?: Database["public"]["Enums"]["hwr_axis"][]
          id?: string
          intended_outcome?: string | null
          source_chunk_id?: string | null
          source_document_id?: string | null
          status?: string
          surface?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_hooks_source_chunk_id_fkey"
            columns: ["source_chunk_id"]
            isOneToOne: false
            referencedRelation: "library_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_hooks_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "context_envelope"
            referencedColumns: ["document_id"]
          },
          {
            foreignKeyName: "content_hooks_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "library_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      danny_calibration: {
        Row: {
          created_at: string | null
          draft_id: string | null
          feedback: string
          id: string
        }
        Insert: {
          created_at?: string | null
          draft_id?: string | null
          feedback: string
          id?: string
        }
        Update: {
          created_at?: string | null
          draft_id?: string | null
          feedback?: string
          id?: string
        }
        Relationships: []
      }
      danny_chat_log: {
        Row: {
          chat_id: string
          content: string
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
      danny_conversations: {
        Row: {
          channel: string
          chat_id: string
          content: string
          created_at: string
          id: string
          mode_slug: string | null
          role: string
        }
        Insert: {
          channel?: string
          chat_id: string
          content: string
          created_at?: string
          id?: string
          mode_slug?: string | null
          role: string
        }
        Update: {
          channel?: string
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          mode_slug?: string | null
          role?: string
        }
        Relationships: []
      }
      danny_durable_facts: {
        Row: {
          approved_at: string | null
          created_at: string
          fact: string
          id: string
          scope: string | null
          source: string | null
          source_chat: string | null
          status: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          fact: string
          id?: string
          scope?: string | null
          source?: string | null
          source_chat?: string | null
          status?: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          fact?: string
          id?: string
          scope?: string | null
          source?: string | null
          source_chat?: string | null
          status?: string
        }
        Relationships: []
      }
      distribution_queue: {
        Row: {
          confirmed_at: string | null
          content_piece_id: string | null
          content_url: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          job_id: string | null
          narrative_track: string | null
          platform: string
          retry_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["distribution_status"]
          title: string | null
          updated_at: string
        }
        Insert: {
          confirmed_at?: string | null
          content_piece_id?: string | null
          content_url?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          job_id?: string | null
          narrative_track?: string | null
          platform: string
          retry_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["distribution_status"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          confirmed_at?: string | null
          content_piece_id?: string | null
          content_url?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          job_id?: string | null
          narrative_track?: string | null
          platform?: string
          retry_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["distribution_status"]
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      escalation_log: {
        Row: {
          caller: string
          context_tier: Database["public"]["Enums"]["context_tier"]
          cost_usd: number | null
          created_at: string
          decision: string | null
          decision_meta: Json | null
          document_id: string | null
          document_slug: string | null
          envelope: Json
          error: string | null
          id: string
          latency_ms: number | null
          prompt: string | null
          reason_code: string
          response: string | null
          response_tokens: number | null
          target_model: string
        }
        Insert: {
          caller: string
          context_tier: Database["public"]["Enums"]["context_tier"]
          cost_usd?: number | null
          created_at?: string
          decision?: string | null
          decision_meta?: Json | null
          document_id?: string | null
          document_slug?: string | null
          envelope: Json
          error?: string | null
          id?: string
          latency_ms?: number | null
          prompt?: string | null
          reason_code: string
          response?: string | null
          response_tokens?: number | null
          target_model: string
        }
        Update: {
          caller?: string
          context_tier?: Database["public"]["Enums"]["context_tier"]
          cost_usd?: number | null
          created_at?: string
          decision?: string | null
          decision_meta?: Json | null
          document_id?: string | null
          document_slug?: string | null
          envelope?: Json
          error?: string | null
          id?: string
          latency_ms?: number | null
          prompt?: string | null
          reason_code?: string
          response?: string | null
          response_tokens?: number | null
          target_model?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalation_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "context_envelope"
            referencedColumns: ["document_id"]
          },
          {
            foreignKeyName: "escalation_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "library_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      fulfillment_rules: {
        Row: {
          bundle_id: string | null
          context_tier: Database["public"]["Enums"]["context_tier"]
          created_at: string
          document_id: string | null
          id: string
          match_axis: string
          match_value: string
          notes_md: string | null
          posture: string
          priority: number
          rule_slug: string
        }
        Insert: {
          bundle_id?: string | null
          context_tier?: Database["public"]["Enums"]["context_tier"]
          created_at?: string
          document_id?: string | null
          id?: string
          match_axis: string
          match_value: string
          notes_md?: string | null
          posture: string
          priority?: number
          rule_slug: string
        }
        Update: {
          bundle_id?: string | null
          context_tier?: Database["public"]["Enums"]["context_tier"]
          created_at?: string
          document_id?: string | null
          id?: string
          match_axis?: string
          match_value?: string
          notes_md?: string | null
          posture?: string
          priority?: number
          rule_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "fulfillment_rules_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "notebook_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillment_rules_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "context_envelope"
            referencedColumns: ["document_id"]
          },
          {
            foreignKeyName: "fulfillment_rules_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "library_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      hwr_classifications: {
        Row: {
          axis: Database["public"]["Enums"]["hwr_axis"]
          created_at: string | null
          description: string | null
          id: string
          inference_signals: Json | null
          sub_label: string
        }
        Insert: {
          axis: Database["public"]["Enums"]["hwr_axis"]
          created_at?: string | null
          description?: string | null
          id?: string
          inference_signals?: Json | null
          sub_label: string
        }
        Update: {
          axis?: Database["public"]["Enums"]["hwr_axis"]
          created_at?: string | null
          description?: string | null
          id?: string
          inference_signals?: Json | null
          sub_label?: string
        }
        Relationships: []
      }
      incident_events: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          affected_surfaces: Json | null
          auto_resolved: boolean | null
          auto_retry_safe: boolean | null
          classification: string | null
          confidence: number | null
          constellation_state: Json | null
          constellation_state_notes: string | null
          context_payload: Json | null
          created_at: string | null
          diagnosed_by: string | null
          diagnosis: string | null
          error_message: string | null
          error_name: string | null
          error_stack: string | null
          execution_id: string | null
          handler_version: string | null
          id: string
          inserted_at: string | null
          likely_root_cause: string | null
          node_name: string | null
          node_type: string | null
          occurred_at: string | null
          raw_diagnosis: Json | null
          raw_execution: Json | null
          raw_response: string | null
          recommended_action: string | null
          resolution_action: string | null
          resolved_at: string | null
          severity: string | null
          suggested_fix: string | null
          summary: string | null
          trust_level: string | null
          workflow_id: string
          workflow_name: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          affected_surfaces?: Json | null
          auto_resolved?: boolean | null
          auto_retry_safe?: boolean | null
          classification?: string | null
          confidence?: number | null
          constellation_state?: Json | null
          constellation_state_notes?: string | null
          context_payload?: Json | null
          created_at?: string | null
          diagnosed_by?: string | null
          diagnosis?: string | null
          error_message?: string | null
          error_name?: string | null
          error_stack?: string | null
          execution_id?: string | null
          handler_version?: string | null
          id?: string
          inserted_at?: string | null
          likely_root_cause?: string | null
          node_name?: string | null
          node_type?: string | null
          occurred_at?: string | null
          raw_diagnosis?: Json | null
          raw_execution?: Json | null
          raw_response?: string | null
          recommended_action?: string | null
          resolution_action?: string | null
          resolved_at?: string | null
          severity?: string | null
          suggested_fix?: string | null
          summary?: string | null
          trust_level?: string | null
          workflow_id: string
          workflow_name?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          affected_surfaces?: Json | null
          auto_resolved?: boolean | null
          auto_retry_safe?: boolean | null
          classification?: string | null
          confidence?: number | null
          constellation_state?: Json | null
          constellation_state_notes?: string | null
          context_payload?: Json | null
          created_at?: string | null
          diagnosed_by?: string | null
          diagnosis?: string | null
          error_message?: string | null
          error_name?: string | null
          error_stack?: string | null
          execution_id?: string | null
          handler_version?: string | null
          id?: string
          inserted_at?: string | null
          likely_root_cause?: string | null
          node_name?: string | null
          node_type?: string | null
          occurred_at?: string | null
          raw_diagnosis?: Json | null
          raw_execution?: Json | null
          raw_response?: string | null
          recommended_action?: string | null
          resolution_action?: string | null
          resolved_at?: string | null
          severity?: string | null
          suggested_fix?: string | null
          summary?: string | null
          trust_level?: string | null
          workflow_id?: string
          workflow_name?: string | null
        }
        Relationships: []
      }
      job_queue: {
        Row: {
          attempts: number | null
          created_at: string | null
          id: string
          job_type: string
          last_error: string | null
          max_attempts: number | null
          payload: Json
          status: string
          updated_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          id?: string
          job_type: string
          last_error?: string | null
          max_attempts?: number | null
          payload?: Json
          status?: string
          updated_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          id?: string
          job_type?: string
          last_error?: string | null
          max_attempts?: number | null
          payload?: Json
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      l2_autofix_rules: {
        Row: {
          action: string
          affected_surface: string | null
          auto_retry_safe: boolean
          backoff_seconds: number
          classification: string
          created_at: string
          enabled: boolean
          match_pattern: string | null
          max_attempts: number
          notes: string | null
          requires_human: boolean
          rule_id: string
        }
        Insert: {
          action: string
          affected_surface?: string | null
          auto_retry_safe?: boolean
          backoff_seconds?: number
          classification: string
          created_at?: string
          enabled?: boolean
          match_pattern?: string | null
          max_attempts?: number
          notes?: string | null
          requires_human?: boolean
          rule_id: string
        }
        Update: {
          action?: string
          affected_surface?: string | null
          auto_retry_safe?: boolean
          backoff_seconds?: number
          classification?: string
          created_at?: string
          enabled?: boolean
          match_pattern?: string | null
          max_attempts?: number
          notes?: string | null
          requires_human?: boolean
          rule_id?: string
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
          source: string | null
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
          source?: string | null
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
          source?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      library_chunks: {
        Row: {
          body_md: string
          chunk_index: number
          context_tier: Database["public"]["Enums"]["context_tier"]
          created_at: string
          document_id: string
          heading_path: string | null
          hwr_lean: Database["public"]["Enums"]["hwr_axis"][]
          id: string
          tags: string[]
          token_estimate: number | null
        }
        Insert: {
          body_md: string
          chunk_index: number
          context_tier?: Database["public"]["Enums"]["context_tier"]
          created_at?: string
          document_id: string
          heading_path?: string | null
          hwr_lean?: Database["public"]["Enums"]["hwr_axis"][]
          id?: string
          tags?: string[]
          token_estimate?: number | null
        }
        Update: {
          body_md?: string
          chunk_index?: number
          context_tier?: Database["public"]["Enums"]["context_tier"]
          created_at?: string
          document_id?: string
          heading_path?: string | null
          hwr_lean?: Database["public"]["Enums"]["hwr_axis"][]
          id?: string
          tags?: string[]
          token_estimate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "library_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "context_envelope"
            referencedColumns: ["document_id"]
          },
          {
            foreignKeyName: "library_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "library_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      library_classifications: {
        Row: {
          axis: string
          context_tier: Database["public"]["Enums"]["context_tier"]
          created_at: string
          document_id: string
          id: string
          rationale: string | null
          value: string
          weight: number
        }
        Insert: {
          axis: string
          context_tier?: Database["public"]["Enums"]["context_tier"]
          created_at?: string
          document_id: string
          id?: string
          rationale?: string | null
          value: string
          weight?: number
        }
        Update: {
          axis?: string
          context_tier?: Database["public"]["Enums"]["context_tier"]
          created_at?: string
          document_id?: string
          id?: string
          rationale?: string | null
          value?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "library_classifications_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "context_envelope"
            referencedColumns: ["document_id"]
          },
          {
            foreignKeyName: "library_classifications_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "library_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      library_documents: {
        Row: {
          attribution_text: string | null
          audience: string[]
          body_md: string
          canonical_url: string | null
          coke_vault: boolean | null
          companion_role: string | null
          context_tier: Database["public"]["Enums"]["context_tier"]
          contributor_op: string | null
          created_at: string
          cta_mode: string
          doc_type: string
          fulfillment_posture: string
          hwr_lean: Database["public"]["Enums"]["hwr_axis"][]
          id: string
          interests: string[]
          jurisdiction: string | null
          notes_md: string | null
          pains: string[]
          publication_year: number | null
          sectors: string[]
          slug: string
          source_format: string | null
          source_slug: string | null
          status: string
          substrate_category: number | null
          summary_md: string | null
          title: string
          updated_at: string
          visibility: string
          withdrawn_at: string | null
        }
        Insert: {
          attribution_text?: string | null
          audience?: string[]
          body_md: string
          canonical_url?: string | null
          coke_vault?: boolean | null
          companion_role?: string | null
          context_tier?: Database["public"]["Enums"]["context_tier"]
          contributor_op?: string | null
          created_at?: string
          cta_mode: string
          doc_type: string
          fulfillment_posture: string
          hwr_lean?: Database["public"]["Enums"]["hwr_axis"][]
          id?: string
          interests?: string[]
          jurisdiction?: string | null
          notes_md?: string | null
          pains?: string[]
          publication_year?: number | null
          sectors?: string[]
          slug: string
          source_format?: string | null
          source_slug?: string | null
          status?: string
          substrate_category?: number | null
          summary_md?: string | null
          title: string
          updated_at?: string
          visibility?: string
          withdrawn_at?: string | null
        }
        Update: {
          attribution_text?: string | null
          audience?: string[]
          body_md?: string
          canonical_url?: string | null
          coke_vault?: boolean | null
          companion_role?: string | null
          context_tier?: Database["public"]["Enums"]["context_tier"]
          contributor_op?: string | null
          created_at?: string
          cta_mode?: string
          doc_type?: string
          fulfillment_posture?: string
          hwr_lean?: Database["public"]["Enums"]["hwr_axis"][]
          id?: string
          interests?: string[]
          jurisdiction?: string | null
          notes_md?: string | null
          pains?: string[]
          publication_year?: number | null
          sectors?: string[]
          slug?: string
          source_format?: string | null
          source_slug?: string | null
          status?: string
          substrate_category?: number | null
          summary_md?: string | null
          title?: string
          updated_at?: string
          visibility?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "library_documents_source_slug_fkey"
            columns: ["source_slug"]
            isOneToOne: false
            referencedRelation: "substrate_sources"
            referencedColumns: ["source_slug"]
          },
        ]
      }
      local_cache_manifest: {
        Row: {
          context_tier: string
          created_at: string
          device_label: string | null
          domain_tags: string[]
          id: string
          included_doc_ids: string[]
          last_synced_at: string | null
          operator_op: string
        }
        Insert: {
          context_tier?: string
          created_at?: string
          device_label?: string | null
          domain_tags?: string[]
          id?: string
          included_doc_ids?: string[]
          last_synced_at?: string | null
          operator_op: string
        }
        Update: {
          context_tier?: string
          created_at?: string
          device_label?: string | null
          domain_tags?: string[]
          id?: string
          included_doc_ids?: string[]
          last_synced_at?: string | null
          operator_op?: string
        }
        Relationships: []
      }
      membership_assignments: {
        Row: {
          email: string
          granted_at: string | null
          id: string
          notes: string | null
          status: string | null
          tier_slug: string | null
        }
        Insert: {
          email: string
          granted_at?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          tier_slug?: string | null
        }
        Update: {
          email?: string
          granted_at?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          tier_slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_assignments_tier_slug_fkey"
            columns: ["tier_slug"]
            isOneToOne: false
            referencedRelation: "value_ladder_tiers"
            referencedColumns: ["tier_slug"]
          },
        ]
      }
      metrics_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          item_count: number | null
          payload: Json | null
          time_saved_minutes_est: number | null
          user_context: string | null
          workflow_id: string | null
          workflow_name: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          item_count?: number | null
          payload?: Json | null
          time_saved_minutes_est?: number | null
          user_context?: string | null
          workflow_id?: string | null
          workflow_name?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          item_count?: number | null
          payload?: Json | null
          time_saved_minutes_est?: number | null
          user_context?: string | null
          workflow_id?: string | null
          workflow_name?: string | null
        }
        Relationships: []
      }
      notebook_bundle_documents: {
        Row: {
          bundle_id: string
          context_tier: Database["public"]["Enums"]["context_tier"]
          document_id: string
          position: number
          role: string | null
        }
        Insert: {
          bundle_id: string
          context_tier?: Database["public"]["Enums"]["context_tier"]
          document_id: string
          position?: number
          role?: string | null
        }
        Update: {
          bundle_id?: string
          context_tier?: Database["public"]["Enums"]["context_tier"]
          document_id?: string
          position?: number
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notebook_bundle_documents_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "notebook_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notebook_bundle_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "context_envelope"
            referencedColumns: ["document_id"]
          },
          {
            foreignKeyName: "notebook_bundle_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "library_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      notebook_bundles: {
        Row: {
          audience: string[]
          created_at: string
          display_name: string
          external_url: string | null
          id: string
          notes_md: string | null
          purpose: string
          slug: string
          updated_at: string
          visibility: string
        }
        Insert: {
          audience?: string[]
          created_at?: string
          display_name: string
          external_url?: string | null
          id?: string
          notes_md?: string | null
          purpose: string
          slug: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          audience?: string[]
          created_at?: string
          display_name?: string
          external_url?: string | null
          id?: string
          notes_md?: string | null
          purpose?: string
          slug?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      operator_config: {
        Row: {
          created_at: string
          id: string
          key: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          value?: Json
        }
        Relationships: []
      }
      pattern_observations: {
        Row: {
          context_tier: string
          evidence_md: string | null
          id: string
          observed_at: string
          observer_op: string
          pattern_slug: string
          revoked_at: string | null
          stance: number
          subject_ref: string
        }
        Insert: {
          context_tier?: string
          evidence_md?: string | null
          id?: string
          observed_at?: string
          observer_op: string
          pattern_slug: string
          revoked_at?: string | null
          stance: number
          subject_ref: string
        }
        Update: {
          context_tier?: string
          evidence_md?: string | null
          id?: string
          observed_at?: string
          observer_op?: string
          pattern_slug?: string
          revoked_at?: string | null
          stance?: number
          subject_ref?: string
        }
        Relationships: [
          {
            foreignKeyName: "pattern_observations_pattern_slug_fkey"
            columns: ["pattern_slug"]
            isOneToOne: false
            referencedRelation: "bad_faith_patterns"
            referencedColumns: ["slug"]
          },
        ]
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
      reply_templates: {
        Row: {
          category: string
          created_at: string
          funnel_url: string | null
          id: string
          is_active: boolean
          keywords: string[] | null
          scaffold: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          funnel_url?: string | null
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          scaffold: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          funnel_url?: string | null
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          scaffold?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      resource_matches: {
        Row: {
          context_tier: string
          contribution_obs: string | null
          created_at: string
          fulfilled_at: string | null
          id: string
          offer_id: string
          request_id: string
          state: string
        }
        Insert: {
          context_tier?: string
          contribution_obs?: string | null
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          offer_id: string
          request_id: string
          state?: string
        }
        Update: {
          context_tier?: string
          contribution_obs?: string | null
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          offer_id?: string
          request_id?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_matches_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "mesh_public_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_matches_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "resource_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_matches_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "resource_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_offers: {
        Row: {
          body_md: string | null
          context_tier: string
          created_at: string
          geo_tag: string | null
          id: string
          kind: string
          offerer_op: string
          qty: number | null
          title: string
          unit: string | null
          window_end: string | null
          window_start: string | null
          withdrawn_at: string | null
        }
        Insert: {
          body_md?: string | null
          context_tier?: string
          created_at?: string
          geo_tag?: string | null
          id?: string
          kind: string
          offerer_op: string
          qty?: number | null
          title: string
          unit?: string | null
          window_end?: string | null
          window_start?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          body_md?: string | null
          context_tier?: string
          created_at?: string
          geo_tag?: string | null
          id?: string
          kind?: string
          offerer_op?: string
          qty?: number | null
          title?: string
          unit?: string | null
          window_end?: string | null
          window_start?: string | null
          withdrawn_at?: string | null
        }
        Relationships: []
      }
      resource_requests: {
        Row: {
          body_md: string | null
          closed_at: string | null
          context_tier: string
          created_at: string
          geo_tag: string | null
          id: string
          kind: string
          needed_by: string | null
          qty: number | null
          requester_op: string
          title: string
          unit: string | null
        }
        Insert: {
          body_md?: string | null
          closed_at?: string | null
          context_tier?: string
          created_at?: string
          geo_tag?: string | null
          id?: string
          kind: string
          needed_by?: string | null
          qty?: number | null
          requester_op: string
          title: string
          unit?: string | null
        }
        Update: {
          body_md?: string | null
          closed_at?: string | null
          context_tier?: string
          created_at?: string
          geo_tag?: string | null
          id?: string
          kind?: string
          needed_by?: string | null
          qty?: number | null
          requester_op?: string
          title?: string
          unit?: string | null
        }
        Relationships: []
      }
      response_drafts: {
        Row: {
          auto_posted: boolean | null
          classifier_reasoning: string | null
          classifier_tier: number | null
          created_at: string
          created_by: string | null
          draft_text: string | null
          id: string
          narrative_track: string | null
          post_title: string | null
          reddit_id: string | null
          reply_to_author: string | null
          reply_to_text: string | null
          response_mode: string | null
          safety_flags: string | null
          shannon_notes: string | null
          shannon_prior_comment: string | null
          status: string | null
          subreddit: string | null
          target_door: string | null
          target_path: string | null
          template_id: string | null
          thread_id: string | null
          thread_url: string | null
          tone: string | null
          updated_at: string
          used_at: string | null
          voice_key: string | null
          word_count: number | null
        }
        Insert: {
          auto_posted?: boolean | null
          classifier_reasoning?: string | null
          classifier_tier?: number | null
          created_at?: string
          created_by?: string | null
          draft_text?: string | null
          id?: string
          narrative_track?: string | null
          post_title?: string | null
          reddit_id?: string | null
          reply_to_author?: string | null
          reply_to_text?: string | null
          response_mode?: string | null
          safety_flags?: string | null
          shannon_notes?: string | null
          shannon_prior_comment?: string | null
          status?: string | null
          subreddit?: string | null
          target_door?: string | null
          target_path?: string | null
          template_id?: string | null
          thread_id?: string | null
          thread_url?: string | null
          tone?: string | null
          updated_at?: string
          used_at?: string | null
          voice_key?: string | null
          word_count?: number | null
        }
        Update: {
          auto_posted?: boolean | null
          classifier_reasoning?: string | null
          classifier_tier?: number | null
          created_at?: string
          created_by?: string | null
          draft_text?: string | null
          id?: string
          narrative_track?: string | null
          post_title?: string | null
          reddit_id?: string | null
          reply_to_author?: string | null
          reply_to_text?: string | null
          response_mode?: string | null
          safety_flags?: string | null
          shannon_notes?: string | null
          shannon_prior_comment?: string | null
          status?: string | null
          subreddit?: string | null
          target_door?: string | null
          target_path?: string | null
          template_id?: string | null
          thread_id?: string | null
          thread_url?: string | null
          tone?: string | null
          updated_at?: string
          used_at?: string | null
          voice_key?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "response_drafts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "reply_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_drafts_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "community_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      room_intelligence: {
        Row: {
          connection_pattern_md: string | null
          created_at: string | null
          default_response_level: string | null
          display_name: string
          hwr_lean: Database["public"]["Enums"]["hwr_axis"][] | null
          id: string
          metadata: Json | null
          platform: string | null
          room_slug: string
          rules_md: string | null
          story_md: string | null
          updated_at: string | null
        }
        Insert: {
          connection_pattern_md?: string | null
          created_at?: string | null
          default_response_level?: string | null
          display_name: string
          hwr_lean?: Database["public"]["Enums"]["hwr_axis"][] | null
          id?: string
          metadata?: Json | null
          platform?: string | null
          room_slug: string
          rules_md?: string | null
          story_md?: string | null
          updated_at?: string | null
        }
        Update: {
          connection_pattern_md?: string | null
          created_at?: string | null
          default_response_level?: string | null
          display_name?: string
          hwr_lean?: Database["public"]["Enums"]["hwr_axis"][] | null
          id?: string
          metadata?: Json | null
          platform?: string | null
          room_slug?: string
          rules_md?: string | null
          story_md?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      routing_logic: {
        Row: {
          created_at: string | null
          feedback_notes: string | null
          hwr_match: Database["public"]["Enums"]["hwr_axis"][] | null
          id: string
          prompt_template_md: string
          response_level: string
          room_slug: string | null
          situation_key: string
          toolkit_slugs: string[] | null
        }
        Insert: {
          created_at?: string | null
          feedback_notes?: string | null
          hwr_match?: Database["public"]["Enums"]["hwr_axis"][] | null
          id?: string
          prompt_template_md: string
          response_level: string
          room_slug?: string | null
          situation_key: string
          toolkit_slugs?: string[] | null
        }
        Update: {
          created_at?: string | null
          feedback_notes?: string | null
          hwr_match?: Database["public"]["Enums"]["hwr_axis"][] | null
          id?: string
          prompt_template_md?: string
          response_level?: string
          room_slug?: string | null
          situation_key?: string
          toolkit_slugs?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "routing_logic_room_slug_fkey"
            columns: ["room_slug"]
            isOneToOne: false
            referencedRelation: "room_intelligence"
            referencedColumns: ["room_slug"]
          },
        ]
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
      social_handles: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string | null
          handle: string
          hwr_lean: Database["public"]["Enums"]["hwr_axis"][] | null
          id: string
          is_whitelisted: boolean | null
          metadata: Json | null
          notes: string | null
          platform: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          handle: string
          hwr_lean?: Database["public"]["Enums"]["hwr_axis"][] | null
          id?: string
          is_whitelisted?: boolean | null
          metadata?: Json | null
          notes?: string | null
          platform: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          handle?: string
          hwr_lean?: Database["public"]["Enums"]["hwr_axis"][] | null
          id?: string
          is_whitelisted?: boolean | null
          metadata?: Json | null
          notes?: string | null
          platform?: string
        }
        Relationships: []
      }
      stance_vectors: {
        Row: {
          context_tier: string
          sample_n: number
          subject_ref: string
          updated_at: string
          vector: Json
        }
        Insert: {
          context_tier?: string
          sample_n?: number
          subject_ref: string
          updated_at?: string
          vector: Json
        }
        Update: {
          context_tier?: string
          sample_n?: number
          subject_ref?: string
          updated_at?: string
          vector?: Json
        }
        Relationships: []
      }
      substrate_sources: {
        Row: {
          category: number
          context_tier: string
          created_at: string
          display_name: string
          institution: string | null
          license: string
          notes_md: string | null
          redundant_mirrors: Json
          refresh_cadence: string | null
          source_slug: string
          stability_rating: string
          url_root: string | null
        }
        Insert: {
          category: number
          context_tier?: string
          created_at?: string
          display_name: string
          institution?: string | null
          license: string
          notes_md?: string | null
          redundant_mirrors?: Json
          refresh_cadence?: string | null
          source_slug: string
          stability_rating: string
          url_root?: string | null
        }
        Update: {
          category?: number
          context_tier?: string
          created_at?: string
          display_name?: string
          institution?: string | null
          license?: string
          notes_md?: string | null
          redundant_mirrors?: Json
          refresh_cadence?: string | null
          source_slug?: string
          stability_rating?: string
          url_root?: string | null
        }
        Relationships: []
      }
      toolkit_registry: {
        Row: {
          category: string | null
          created_at: string | null
          hwr_axes: Database["public"]["Enums"]["hwr_axis"][] | null
          id: string
          metadata: Json | null
          name: string
          short_pitch: string | null
          short_story_md: string | null
          tool_slug: string
          url: string | null
          visibility: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          hwr_axes?: Database["public"]["Enums"]["hwr_axis"][] | null
          id?: string
          metadata?: Json | null
          name: string
          short_pitch?: string | null
          short_story_md?: string | null
          tool_slug: string
          url?: string | null
          visibility?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          hwr_axes?: Database["public"]["Enums"]["hwr_axis"][] | null
          id?: string
          metadata?: Json | null
          name?: string
          short_pitch?: string | null
          short_story_md?: string | null
          tool_slug?: string
          url?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      value_ladder_tiers: {
        Row: {
          cadence: string | null
          created_at: string | null
          description_md: string | null
          display_name: string
          entitlements: Json | null
          id: string
          price_cents: number | null
          rung: number
          tier_slug: string
          visibility: string | null
        }
        Insert: {
          cadence?: string | null
          created_at?: string | null
          description_md?: string | null
          display_name: string
          entitlements?: Json | null
          id?: string
          price_cents?: number | null
          rung: number
          tier_slug: string
          visibility?: string | null
        }
        Update: {
          cadence?: string | null
          created_at?: string | null
          description_md?: string | null
          display_name?: string
          entitlements?: Json | null
          id?: string
          price_cents?: number | null
          rung?: number
          tier_slug?: string
          visibility?: string | null
        }
        Relationships: []
      }
      webhook_errors: {
        Row: {
          created_at: string
          error_message: string
          event_type: string
          id: string
          payload: Json | null
        }
        Insert: {
          created_at?: string
          error_message: string
          event_type: string
          id?: string
          payload?: Json | null
        }
        Update: {
          created_at?: string
          error_message?: string
          event_type?: string
          id?: string
          payload?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      context_envelope: {
        Row: {
          bundle_count: number | null
          chunk_count: number | null
          classifications: Json | null
          coke_vault: boolean | null
          context_tier: Database["public"]["Enums"]["context_tier"] | null
          created_at: string | null
          document_id: string | null
          document_slug: string | null
          document_title: string | null
          document_type: string | null
          hook_count: number | null
          rule_count: number | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          bundle_count?: never
          chunk_count?: never
          classifications?: never
          coke_vault?: boolean | null
          context_tier?: Database["public"]["Enums"]["context_tier"] | null
          created_at?: string | null
          document_id?: string | null
          document_slug?: string | null
          document_title?: string | null
          document_type?: string | null
          hook_count?: never
          rule_count?: never
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          bundle_count?: never
          chunk_count?: never
          classifications?: never
          coke_vault?: boolean | null
          context_tier?: Database["public"]["Enums"]["context_tier"] | null
          created_at?: string | null
          document_id?: string | null
          document_slug?: string | null
          document_title?: string | null
          document_type?: string | null
          hook_count?: never
          rule_count?: never
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      mesh_public_offers: {
        Row: {
          body_md: string | null
          created_at: string | null
          geo_tag: string | null
          id: string | null
          kind: string | null
          qty: number | null
          title: string | null
          unit: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          body_md?: string | null
          created_at?: string | null
          geo_tag?: string | null
          id?: string | null
          kind?: string | null
          qty?: number | null
          title?: string | null
          unit?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          body_md?: string | null
          created_at?: string | null
          geo_tag?: string | null
          id?: string | null
          kind?: string | null
          qty?: number | null
          title?: string | null
          unit?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      allowed_context_tiers: {
        Args: never
        Returns: Database["public"]["Enums"]["context_tier"][]
      }
      current_tier_ceiling: {
        Args: never
        Returns: Database["public"]["Enums"]["context_tier"]
      }
      danny_status: { Args: never; Returns: Json }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      library_explain_rpc: {
        Args: {
          p_archetype?: string
          p_hwr?: string
          p_limit?: number
          p_query: string
          p_sector?: string
        }
        Returns: Json
      }
      library_match: {
        Args: {
          archetype?: string
          hwr?: string
          limit_n?: number
          pain?: string
          query_text?: string
          sector?: string
        }
        Returns: {
          companion_role: string
          cta_mode: string
          doc_type: string
          document_id: string
          fulfillment_posture: string
          matched_axes: string[]
          rule_posture: string
          rule_slug: string
          score: number
          slug: string
          title: string
        }[]
      }
      library_match_rpc: {
        Args: {
          p_archetype?: string
          p_hwr?: string
          p_limit?: number
          p_query: string
          p_sector?: string
        }
        Returns: Json
      }
      log_escalation: {
        Args: {
          p_caller: string
          p_cost_usd?: number
          p_decision?: string
          p_decision_meta?: Json
          p_document_id: string
          p_error?: string
          p_latency_ms?: number
          p_prompt: string
          p_reason_code: string
          p_response?: string
          p_response_tokens?: number
          p_target_model: string
        }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "practitioner" | "healer" | "administrator" | "architect"
      context_tier: "public" | "internal" | "vault" | "substrate" | "governance"
      distribution_status:
        | "queued"
        | "sent"
        | "confirmed"
        | "failed"
        | "skipped"
      hwr_axis: "health" | "wealth" | "relationship"
      radar_platform: "reddit" | "discord" | "forum" | "other" | "bluesky"
      thread_status: "new" | "reviewed" | "replied" | "archived" | "flagged"
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
      app_role: ["practitioner", "healer", "administrator", "architect"],
      context_tier: ["public", "internal", "vault", "substrate", "governance"],
      distribution_status: ["queued", "sent", "confirmed", "failed", "skipped"],
      hwr_axis: ["health", "wealth", "relationship"],
      radar_platform: ["reddit", "discord", "forum", "other", "bluesky"],
      thread_status: ["new", "reviewed", "replied", "archived", "flagged"],
    },
  },
} as const
