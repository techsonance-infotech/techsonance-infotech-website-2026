export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // ─── Existing Web Tables ────────────────────────────────────────────────
      ts_web_visitor_leads: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          phone: string | null;
          company: string | null;
          consent: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          consent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          consent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ts_web_chat_sessions: {
        Row: {
          id: string;
          visitor_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          visitor_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          visitor_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ts_web_chat_messages: {
        Row: {
          id: string;
          session_id: string;
          role: "user" | "assistant" | "system";
          text: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: "user" | "assistant" | "system";
          text: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          role?: "user" | "assistant" | "system";
          text?: string;
          metadata?: Json;
          created_at?: string;
        };
      };
      ts_web_consultation_bookings: {
        Row: {
          id: string;
          ref: string;
          name: string;
          email: string;
          phone: string | null;
          company: string | null;
          project_type: string;
          budget_range: string;
          timeline: string;
          slot_iso: string;
          visitor_timezone: string;
          message: string | null;
          status: "pending" | "confirmed" | "cancelled" | "rescheduled" | "completed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ref: string;
          name: string;
          email: string;
          phone?: string | null;
          company?: string | null;
          project_type: string;
          budget_range: string;
          timeline: string;
          slot_iso: string;
          visitor_timezone?: string;
          message?: string | null;
          status?: "pending" | "confirmed" | "cancelled" | "rescheduled" | "completed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ref?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          company?: string | null;
          project_type?: string;
          budget_range?: string;
          timeline?: string;
          slot_iso?: string;
          visitor_timezone?: string;
          message?: string | null;
          status?: "pending" | "confirmed" | "cancelled" | "rescheduled" | "completed";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ts_web_inquiries: {
        Row: {
          id: string;
          type: "contact" | "scoping";
          name: string;
          email: string;
          phone: string | null;
          company: string | null;
          service_or_interest: string | null;
          message: string;
          status: "new" | "contacted" | "closed" | "spam";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: "contact" | "scoping";
          name: string;
          email: string;
          phone?: string | null;
          company?: string | null;
          service_or_interest?: string | null;
          message: string;
          status?: "new" | "contacted" | "closed" | "spam";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: "contact" | "scoping";
          name?: string;
          email?: string;
          phone?: string | null;
          company?: string | null;
          service_or_interest?: string | null;
          message?: string;
          status?: "new" | "contacted" | "closed" | "spam";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ts_web_career_applications: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: string;
          message: string;
          resume_url: string | null;
          status: "submitted" | "reviewing" | "interviewing" | "rejected" | "hired";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          role: string;
          message: string;
          resume_url?: string | null;
          status?: "submitted" | "reviewing" | "interviewing" | "rejected" | "hired";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          role?: string;
          message?: string;
          resume_url?: string | null;
          status?: "submitted" | "reviewing" | "interviewing" | "rejected" | "hired";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ─── Agency Admin & Content Control Platform Phase 1 Tables ─────────────
      ts_admin_sites: {
        Row: {
          id: string;
          name: string;
          slug: string;
          domain: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          domain?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          domain?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      ts_admin_memberships: {
        Row: {
          id: string;
          user_id: string;
          site_id: string;
          role: "owner" | "admin" | "editor" | "author" | "viewer";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          site_id: string;
          role: "owner" | "admin" | "editor" | "author" | "viewer";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          site_id?: string;
          role?: "owner" | "admin" | "editor" | "author" | "viewer";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      ts_content_authors: {
        Row: {
          id: string;
          site_id: string;
          name: string;
          role: string | null;
          avatar: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          name: string;
          role?: string | null;
          avatar?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          name?: string;
          role?: string | null;
          avatar?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      ts_content_categories: {
        Row: {
          id: string;
          site_id: string;
          name: string;
          slug: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          name: string;
          slug: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      ts_content_posts: {
        Row: {
          id: string;
          site_id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          content: string;
          category_id: string | null;
          hero_image: string | null;
          tags: string[];
          author_ids: string[];
          read_time: string | null;
          faqs: Json;
          seo: Json;
          status: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";
          version_id: number;
          published_at: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          slug: string;
          title: string;
          excerpt?: string | null;
          content: string;
          category_id?: string | null;
          hero_image?: string | null;
          tags?: string[];
          author_ids?: string[];
          read_time?: string | null;
          faqs?: Json;
          seo?: Json;
          status?: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";
          version_id?: number;
          published_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          slug?: string;
          title?: string;
          excerpt?: string | null;
          content?: string;
          category_id?: string | null;
          hero_image?: string | null;
          tags?: string[];
          author_ids?: string[];
          read_time?: string | null;
          faqs?: Json;
          seo?: Json;
          status?: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";
          version_id?: number;
          published_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      ts_content_jobs: {
        Row: {
          id: string;
          site_id: string;
          slug: string;
          title: string;
          department: string;
          location: string;
          type: string;
          experience_level: string | null;
          description: string;
          responsibilities: string[];
          requirements: string[];
          benefits: string[];
          closes_at: string | null;
          status: "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED";
          version_id: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          slug: string;
          title: string;
          department: string;
          location: string;
          type: string;
          experience_level?: string | null;
          description: string;
          responsibilities?: string[];
          requirements?: string[];
          benefits?: string[];
          closes_at?: string | null;
          status?: "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED";
          version_id?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          slug?: string;
          title?: string;
          department?: string;
          location?: string;
          type?: string;
          experience_level?: string | null;
          description?: string;
          responsibilities?: string[];
          requirements?: string[];
          benefits?: string[];
          closes_at?: string | null;
          status?: "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED";
          version_id?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      ts_content_applications: {
        Row: {
          id: string;
          site_id: string;
          job_id: string;
          candidate_name: string;
          email: string;
          phone: string | null;
          portfolio_url: string | null;
          github_url: string | null;
          resume_url: string | null;
          cover_letter: string | null;
          status: "NEW" | "REVIEWING" | "SHORTLISTED" | "INTERVIEW" | "OFFERED" | "REJECTED";
          internal_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          job_id: string;
          candidate_name: string;
          email: string;
          phone?: string | null;
          portfolio_url?: string | null;
          github_url?: string | null;
          resume_url?: string | null;
          cover_letter?: string | null;
          status?: "NEW" | "REVIEWING" | "SHORTLISTED" | "INTERVIEW" | "OFFERED" | "REJECTED";
          internal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          job_id?: string;
          candidate_name?: string;
          email?: string;
          phone?: string | null;
          portfolio_url?: string | null;
          github_url?: string | null;
          resume_url?: string | null;
          cover_letter?: string | null;
          status?: "NEW" | "REVIEWING" | "SHORTLISTED" | "INTERVIEW" | "OFFERED" | "REJECTED";
          internal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      ts_content_versions: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          snapshot: Json;
          changed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          snapshot: Json;
          changed_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: string;
          entity_id?: string;
          snapshot?: Json;
          changed_by?: string | null;
          created_at?: string;
        };
      };

      ts_content_audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          before_state: Json;
          after_state: Json;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          before_state?: Json;
          after_state?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          before_state?: Json;
          after_state?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
