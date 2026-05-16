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
      auto_post_config: {
        Row: {
          config: Json
          id: string
          subreddit: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config?: Json
          id?: string
          subreddit?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json
          id?: string
          subreddit?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      canon_pages: {
        Row: {
          audience: string | null
          created_at: string
          id: string
          methodology_tags: string[] | null
          navigation_notes: string | null
          slug: string
          sort_order: number
          status: string
          substrate_topics: string[] | null
          summary: string | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          audience?: string | null
          created_at?: string
          id?: string
          methodology_tags?: string[] | null
          navigation_notes?: string | null
          slug: string
          sort_order?: number
          status?: string
          substrate_topics?: string[] | null
          summary?: string | null
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          audience?: string | null
          created_at?: string
          id?: string
          methodology_tags?: string[] | null
          navigation_notes?: string | null
          slug?: string
          sort_order?: number
          status?: string
          substrate_topics?: string[] | null
          summary?: string | null
          title?: string
          updated_at?: string
          url?: string
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
      community_threads: {
        Row: {
          author: string | null
          card_type: string
          created_at: string
          id: string
          ingested_at: string | null
          match_reason: Json | null
          matched_keywords: Json
          narrative_tracks: string[] | null
          notes: string | null
          platform: string
          post_id: string
          post_title: string
          post_url: string
          reddit_id: string | null
          relevance_score: number
          replied_at: string | null
          response_count: number | null
          shannon_engaged: boolean | null
          snippet: string | null
          source_feed_id: string | null
          source_handle: string | null
          source_platform: string | null
          source_url: string | null
          status: string
          subreddit: string | null
          substrate_filter_active: boolean | null
          updated_at: string
        }
        Insert: {
          author?: string | null
          card_type?: string
          created_at?: string
          id?: string
          ingested_at?: string | null
          match_reason?: Json | null
          matched_keywords?: Json
          narrative_tracks?: string[] | null
          notes?: string | null
          platform?: string
          post_id?: string
          post_title?: string
          post_url?: string
          reddit_id?: string | null
          relevance_score?: number
          replied_at?: string | null
          response_count?: number | null
          shannon_engaged?: boolean | null
          snippet?: string | null
          source_feed_id?: string | null
          source_handle?: string | null
          source_platform?: string | null
          source_url?: string | null
          status?: string
          subreddit?: string | null
          substrate_filter_active?: boolean | null
          updated_at?: string
        }
        Update: {
          author?: string | null
          card_type?: string
          created_at?: string
          id?: string
          ingested_at?: string | null
          match_reason?: Json | null
          matched_keywords?: Json
          narrative_tracks?: string[] | null
          notes?: string | null
          platform?: string
          post_id?: string
          post_title?: string
          post_url?: string
          reddit_id?: string | null
          relevance_score?: number
          replied_at?: string | null
          response_count?: number | null
          shannon_engaged?: boolean | null
          snippet?: string | null
          source_feed_id?: string | null
          source_handle?: string | null
          source_platform?: string | null
          source_url?: string | null
          status?: string
          subreddit?: string | null
          substrate_filter_active?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      compliance_evidence: {
        Row: {
          audit_trail: Json | null
          badge_state: string
          evidence_url: string | null
          id: string
          recorded_at: string
          scope: string
        }
        Insert: {
          audit_trail?: Json | null
          badge_state: string
          evidence_url?: string | null
          id?: string
          recorded_at?: string
          scope: string
        }
        Update: {
          audit_trail?: Json | null
          badge_state?: string
          evidence_url?: string | null
          id?: string
          recorded_at?: string
          scope?: string
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
      conversations: {
        Row: {
          created_at: string
          external_id: string | null
          id: string
          metadata: Json
          participant_handle: string | null
          platform: string
          source_draft_id: string | null
          status: string
          thread_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          id?: string
          metadata?: Json
          participant_handle?: string | null
          platform: string
          source_draft_id?: string | null
          status?: string
          thread_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          external_id?: string | null
          id?: string
          metadata?: Json
          participant_handle?: string | null
          platform?: string
          source_draft_id?: string | null
          status?: string
          thread_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_source_draft_id_fkey"
            columns: ["source_draft_id"]
            isOneToOne: false
            referencedRelation: "response_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_source_draft_id_fkey"
            columns: ["source_draft_id"]
            isOneToOne: false
            referencedRelation: "shadow_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "community_threads"
            referencedColumns: ["id"]
          },
        ]
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
      email_triage_items: {
        Row: {
          draft_body: string | null
          id: string
          processed_at: string | null
          received_at: string
          sender: string
          snippet: string | null
          status: string
          subject: string | null
          suggested_action: string | null
          tier: number
        }
        Insert: {
          draft_body?: string | null
          id?: string
          processed_at?: string | null
          received_at?: string
          sender: string
          snippet?: string | null
          status?: string
          subject?: string | null
          suggested_action?: string | null
          tier?: number
        }
        Update: {
          draft_body?: string | null
          id?: string
          processed_at?: string | null
          received_at?: string
          sender?: string
          snippet?: string | null
          status?: string
          subject?: string | null
          suggested_action?: string | null
          tier?: number
        }
        Relationships: []
      }
      email_triage_whitelist: {
        Row: {
          added_at: string
          added_by: string | null
          contact_name: string | null
          email: string
          notes: string | null
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          contact_name?: string | null
          email: string
          notes?: string | null
        }
        Update: {
          added_at?: string
          added_by?: string | null
          contact_name?: string | null
          email?: string
          notes?: string | null
        }
        Relationships: []
      }
      federation_operators: {
        Row: {
          created_at: string
          display_name: string
          email: string | null
          id: string
          location: string | null
          notes: string | null
          recognition_token: string | null
          role: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          email?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          recognition_token?: string | null
          role?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          recognition_token?: string | null
          role?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      feedback_signals: {
        Row: {
          created_at: string
          id: string
          note: string | null
          operator_id: string
          signal_type: string
          substrate_topic: string | null
          thread_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          operator_id: string
          signal_type: string
          substrate_topic?: string | null
          thread_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          operator_id?: string
          signal_type?: string
          substrate_topic?: string | null
          thread_id?: string
        }
        Relationships: []
      }
      guild_members: {
        Row: {
          id: string
          joined_at: string
          status: string
          tier_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          status?: string
          tier_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          status?: string
          tier_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guild_members_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "guild_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_tiers: {
        Row: {
          benefits: Json
          created_at: string
          id: string
          label: string
          obligations: Json
          slug: string
          sort_order: number
        }
        Insert: {
          benefits?: Json
          created_at?: string
          id?: string
          label: string
          obligations?: Json
          slug: string
          sort_order?: number
        }
        Update: {
          benefits?: Json
          created_at?: string
          id?: string
          label?: string
          obligations?: Json
          slug?: string
          sort_order?: number
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
      member_contributions: {
        Row: {
          contribution_type: string
          created_at: string
          id: string
          member_id: string
          payload: Json | null
        }
        Insert: {
          contribution_type: string
          created_at?: string
          id?: string
          member_id: string
          payload?: Json | null
        }
        Update: {
          contribution_type?: string
          created_at?: string
          id?: string
          member_id?: string
          payload?: Json | null
        }
        Relationships: []
      }
      module_access: {
        Row: {
          created_at: string | null
          display_name: string
          id: string
          is_enabled: boolean | null
          is_public: boolean | null
          module_key: string
          requires_role: string | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          id?: string
          is_enabled?: boolean | null
          is_public?: boolean | null
          module_key: string
          requires_role?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          id?: string
          is_enabled?: boolean | null
          is_public?: boolean | null
          module_key?: string
          requires_role?: string | null
        }
        Relationships: []
      }
      nexus_lanes: {
        Row: {
          id: string
          label: string
          min_privilege: string
          skin_token: string
          slug: string
          sort_order: number
          status: string
        }
        Insert: {
          id?: string
          label: string
          min_privilege?: string
          skin_token?: string
          slug: string
          sort_order?: number
          status?: string
        }
        Update: {
          id?: string
          label?: string
          min_privilege?: string
          skin_token?: string
          slug?: string
          sort_order?: number
          status?: string
        }
        Relationships: []
      }
      nexus_modes: {
        Row: {
          id: string
          label: string
          min_privilege: string
          slug: string
          sort_order: number
          status: string
        }
        Insert: {
          id?: string
          label: string
          min_privilege?: string
          slug: string
          sort_order?: number
          status?: string
        }
        Update: {
          id?: string
          label?: string
          min_privilege?: string
          slug?: string
          sort_order?: number
          status?: string
        }
        Relationships: []
      }
      operator_config: {
        Row: {
          auto_post_enabled: boolean | null
          created_at: string
          id: string
          key: string
          last_killed_at: string | null
          last_killed_by: string | null
          last_killed_reason: string | null
          responder_enabled: boolean | null
          scanner_enabled: boolean | null
          value: Json
        }
        Insert: {
          auto_post_enabled?: boolean | null
          created_at?: string
          id?: string
          key: string
          last_killed_at?: string | null
          last_killed_by?: string | null
          last_killed_reason?: string | null
          responder_enabled?: boolean | null
          scanner_enabled?: boolean | null
          value?: Json
        }
        Update: {
          auto_post_enabled?: boolean | null
          created_at?: string
          id?: string
          key?: string
          last_killed_at?: string | null
          last_killed_by?: string | null
          last_killed_reason?: string | null
          responder_enabled?: boolean | null
          scanner_enabled?: boolean | null
          value?: Json
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
      predator_pattern_observations: {
        Row: {
          connector_diligence_score: number | null
          created_at: string
          id: string
          lure_language_pattern: string | null
          payload_mechanism: string | null
          red_flags_caught: string[] | null
          typology: string
          vector_type: string | null
          where_caught: string | null
        }
        Insert: {
          connector_diligence_score?: number | null
          created_at?: string
          id?: string
          lure_language_pattern?: string | null
          payload_mechanism?: string | null
          red_flags_caught?: string[] | null
          typology: string
          vector_type?: string | null
          where_caught?: string | null
        }
        Update: {
          connector_diligence_score?: number | null
          created_at?: string
          id?: string
          lure_language_pattern?: string | null
          payload_mechanism?: string | null
          red_flags_caught?: string[] | null
          typology?: string
          vector_type?: string | null
          where_caught?: string | null
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
      redirect_clicks: {
        Row: {
          clicked_at: string
          draft_id: string | null
          frame_key: string | null
          id: string
          ip_hash: string | null
          redirect_target_id: string
          referrer: string | null
          ua: string | null
        }
        Insert: {
          clicked_at?: string
          draft_id?: string | null
          frame_key?: string | null
          id?: string
          ip_hash?: string | null
          redirect_target_id: string
          referrer?: string | null
          ua?: string | null
        }
        Update: {
          clicked_at?: string
          draft_id?: string | null
          frame_key?: string | null
          id?: string
          ip_hash?: string | null
          redirect_target_id?: string
          referrer?: string | null
          ua?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "redirect_clicks_redirect_target_id_fkey"
            columns: ["redirect_target_id"]
            isOneToOne: false
            referencedRelation: "redirect_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      redirect_targets: {
        Row: {
          audience_frames: Json
          click_count: number
          conversion_count: number
          created_at: string
          destination_url: string
          id: string
          is_active: boolean
          min_privilege: string
          slug: string
          topic_slug: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          audience_frames?: Json
          click_count?: number
          conversion_count?: number
          created_at?: string
          destination_url: string
          id?: string
          is_active?: boolean
          min_privilege?: string
          slug: string
          topic_slug?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          audience_frames?: Json
          click_count?: number
          conversion_count?: number
          created_at?: string
          destination_url?: string
          id?: string
          is_active?: boolean
          min_privilege?: string
          slug?: string
          topic_slug?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "redirect_targets_topic_slug_fkey"
            columns: ["topic_slug"]
            isOneToOne: false
            referencedRelation: "topic_verticals"
            referencedColumns: ["slug"]
          },
        ]
      }
      reply_templates: {
        Row: {
          category: string
          created_at: string
          funnel_url: string | null
          id: string
          is_active: boolean
          keywords: Json
          scaffold: string
          sort_order: number
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          funnel_url?: string | null
          id?: string
          is_active?: boolean
          keywords?: Json
          scaffold?: string
          sort_order?: number
          title?: string
        }
        Update: {
          category?: string
          created_at?: string
          funnel_url?: string | null
          id?: string
          is_active?: boolean
          keywords?: Json
          scaffold?: string
          sort_order?: number
          title?: string
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
      response_drafts: {
        Row: {
          auto_posted: boolean
          auto_posted_at: string | null
          classifier_reasoning: string | null
          classifier_tier: number
          created_at: string
          cta_eligible: boolean | null
          draft_body: string
          draft_text: string | null
          id: string
          narrative_track: string | null
          post_title: string | null
          post_url: string | null
          posted_at: string | null
          reddit_comment_id: string | null
          reddit_comment_url: string | null
          reddit_id: string | null
          reply_to_comments: Json | null
          response_mode: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          safety_flags: Json | null
          selected_frame_key: string | null
          selected_redirect_id: string | null
          shannon_edits: string | null
          status: string
          subreddit: string | null
          target_door: string | null
          target_path: string | null
          thread_id: string | null
          updated_at: string
          voice_key: string | null
          word_count: number | null
        }
        Insert: {
          auto_posted?: boolean
          auto_posted_at?: string | null
          classifier_reasoning?: string | null
          classifier_tier?: number
          created_at?: string
          cta_eligible?: boolean | null
          draft_body?: string
          draft_text?: string | null
          id?: string
          narrative_track?: string | null
          post_title?: string | null
          post_url?: string | null
          posted_at?: string | null
          reddit_comment_id?: string | null
          reddit_comment_url?: string | null
          reddit_id?: string | null
          reply_to_comments?: Json | null
          response_mode?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          safety_flags?: Json | null
          selected_frame_key?: string | null
          selected_redirect_id?: string | null
          shannon_edits?: string | null
          status?: string
          subreddit?: string | null
          target_door?: string | null
          target_path?: string | null
          thread_id?: string | null
          updated_at?: string
          voice_key?: string | null
          word_count?: number | null
        }
        Update: {
          auto_posted?: boolean
          auto_posted_at?: string | null
          classifier_reasoning?: string | null
          classifier_tier?: number
          created_at?: string
          cta_eligible?: boolean | null
          draft_body?: string
          draft_text?: string | null
          id?: string
          narrative_track?: string | null
          post_title?: string | null
          post_url?: string | null
          posted_at?: string | null
          reddit_comment_id?: string | null
          reddit_comment_url?: string | null
          reddit_id?: string | null
          reply_to_comments?: Json | null
          response_mode?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          safety_flags?: Json | null
          selected_frame_key?: string | null
          selected_redirect_id?: string | null
          shannon_edits?: string | null
          status?: string
          subreddit?: string | null
          target_door?: string | null
          target_path?: string | null
          thread_id?: string | null
          updated_at?: string
          voice_key?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "response_drafts_selected_redirect_id_fkey"
            columns: ["selected_redirect_id"]
            isOneToOne: false
            referencedRelation: "redirect_targets"
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
      sender_patterns: {
        Row: {
          created_at: string
          id: string
          pattern_type: string
          pattern_value: string
          signal: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          pattern_type: string
          pattern_value: string
          signal?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          pattern_type?: string
          pattern_value?: string
          signal?: Json | null
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
      skills: {
        Row: {
          always_loaded: boolean
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          min_privilege: string
          name: string
          prompt_fragment: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          always_loaded?: boolean
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          min_privilege?: string
          name: string
          prompt_fragment?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          always_loaded?: boolean
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          min_privilege?: string
          name?: string
          prompt_fragment?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      source_kill_switches: {
        Row: {
          disabled_at: string | null
          disabled_by: string | null
          enabled: boolean
          reason: string | null
          source_platform: string
          updated_at: string
        }
        Insert: {
          disabled_at?: string | null
          disabled_by?: string | null
          enabled?: boolean
          reason?: string | null
          source_platform: string
          updated_at?: string
        }
        Update: {
          disabled_at?: string | null
          disabled_by?: string | null
          enabled?: boolean
          reason?: string | null
          source_platform?: string
          updated_at?: string
        }
        Relationships: []
      }
      telegram_channels: {
        Row: {
          created_at: string
          host_display_name: string | null
          host_user_id: string | null
          id: string
          is_active: boolean
          label: string
          scope_config: Json
          slug: string
        }
        Insert: {
          created_at?: string
          host_display_name?: string | null
          host_user_id?: string | null
          id?: string
          is_active?: boolean
          label: string
          scope_config?: Json
          slug: string
        }
        Update: {
          created_at?: string
          host_display_name?: string | null
          host_user_id?: string | null
          id?: string
          is_active?: boolean
          label?: string
          scope_config?: Json
          slug?: string
        }
        Relationships: []
      }
      tool_library: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          slug: string
          tier_required: string | null
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          slug: string
          tier_required?: string | null
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          slug?: string
          tier_required?: string | null
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      topic_verticals: {
        Row: {
          created_at: string
          id: string
          min_privilege: string
          name: string
          slug: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          min_privilege?: string
          name: string
          slug: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          min_privilege?: string
          name?: string
          slug?: string
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
      voice_memos: {
        Row: {
          audio_url: string | null
          captured_at: string
          id: string
          operator_id: string
          processed_at: string | null
          routing_decision: Json | null
          source_channel: string | null
          status: string
          transcript: string | null
        }
        Insert: {
          audio_url?: string | null
          captured_at?: string
          id?: string
          operator_id: string
          processed_at?: string | null
          routing_decision?: Json | null
          source_channel?: string | null
          status?: string
          transcript?: string | null
        }
        Update: {
          audio_url?: string | null
          captured_at?: string
          id?: string
          operator_id?: string
          processed_at?: string | null
          routing_decision?: Json | null
          source_channel?: string | null
          status?: string
          transcript?: string | null
        }
        Relationships: []
      }
      voice_templates: {
        Row: {
          created_at: string
          drift_guardrails: Json
          id: string
          min_privilege: string
          register_notes: string | null
          slug: string
          system_prompt_fragment: string
          topic_slug: string | null
          updated_at: string
          venue: string
        }
        Insert: {
          created_at?: string
          drift_guardrails?: Json
          id?: string
          min_privilege?: string
          register_notes?: string | null
          slug: string
          system_prompt_fragment: string
          topic_slug?: string | null
          updated_at?: string
          venue: string
        }
        Update: {
          created_at?: string
          drift_guardrails?: Json
          id?: string
          min_privilege?: string
          register_notes?: string | null
          slug?: string
          system_prompt_fragment?: string
          topic_slug?: string | null
          updated_at?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_templates_topic_slug_fkey"
            columns: ["topic_slug"]
            isOneToOne: false
            referencedRelation: "topic_verticals"
            referencedColumns: ["slug"]
          },
        ]
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
      shadow_log: {
        Row: {
          author: string | null
          auto_posted: boolean | null
          auto_posted_at: string | null
          classifier_reasoning: string | null
          classifier_tier: number | null
          created_at: string | null
          draft_body: string | null
          id: string | null
          log_category: string | null
          post_title: string | null
          post_url: string | null
          reddit_comment_id: string | null
          reddit_comment_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          safety_flags: Json | null
          status: string | null
          subreddit: string | null
          thread_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "response_drafts_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "community_threads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_auto_post_eligible: { Args: { _draft_id: string }; Returns: Json }
      has_min_privilege: {
        Args: { _min: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      select_redirect_for_draft: {
        Args: { _topic_slug: string; _venue: string }
        Returns: {
          audience_frames: Json
          destination_url: string
          id: string
          slug: string
          video_url: string
        }[]
      }
    }
    Enums: {
      app_role: "practitioner" | "healer" | "administrator" | "architect"
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
    },
  },
} as const
