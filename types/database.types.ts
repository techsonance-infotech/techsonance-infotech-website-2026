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
      };
    };
  };
}
