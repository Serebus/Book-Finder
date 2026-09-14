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
      users: {
        Row: {
          user_id: number;
          email: string;
          username: string;
          password_hash: string;
          created_at: string;
          updated_at: string;
          email_verified: boolean;
          is_active: boolean;
        };
        Insert: {
          user_id?: number;
          email: string;
          username: string;
          password_hash: string;
          created_at?: string;
          updated_at?: string;
          email_verified?: boolean;
          is_active?: boolean;
        };
        Update: {
          user_id?: number;
          email?: string;
          username?: string;
          password_hash?: string;
          created_at?: string;
          updated_at?: string;
          email_verified?: boolean;
          is_active?: boolean;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          session_id: number;
          user_id: number;
          token: string;
          ip_address: string;
          user_agent: string;
          created_at: string;
          expires_at: string;
          last_activity: string;
        };
        Insert: {
          session_id?: number;
          user_id: number;
          token: string;
          ip_address: string;
          user_agent: string;
          created_at?: string;
          expires_at: string;
          last_activity?: string;
        };
        Update: {
          session_id?: number;
          user_id?: number;
          token?: string;
          ip_address?: string;
          user_agent?: string;
          created_at?: string;
          expires_at?: string;
          last_activity?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["user_id"];
          }
        ];
      };
      password_resets: {
        Row: {
          reset_id: number;
          user_id: number;
          reset_token: string;
          created_at: string;
          expires_at: string;
          is_used: boolean;
        };
        Insert: {
          reset_id?: number;
          user_id: number;
          reset_token: string;
          created_at?: string;
          expires_at: string;
          is_used?: boolean;
        };
        Update: {
          reset_id?: number;
          user_id?: number;
          reset_token?: string;
          created_at?: string;
          expires_at?: string;
          is_used?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "password_resets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["user_id"];
          }
        ];
      };
      email_verifications: {
        Row: {
          verification_id: number;
          user_id: number;
          verification_token: string;
          created_at: string;
          expires_at: string;
          is_verified: boolean;
        };
        Insert: {
          verification_id?: number;
          user_id: number;
          verification_token: string;
          created_at?: string;
          expires_at: string;
          is_verified?: boolean;
        };
        Update: {
          verification_id?: number;
          user_id?: number;
          verification_token?: string;
          created_at?: string;
          expires_at?: string;
          is_verified?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "email_verifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["user_id"];
          }
        ];
      };
      login_attempts: {
        Row: {
          attempt_id: number;
          user_id: number | null;
          email: string;
          ip_address: string;
          attempted_at: string;
          was_successful: boolean;
        };
        Insert: {
          attempt_id?: number;
          user_id?: number | null;
          email: string;
          ip_address: string;
          attempted_at?: string;
          was_successful: boolean;
        };
        Update: {
          attempt_id?: number;
          user_id?: number | null;
          email?: string;
          ip_address?: string;
          attempted_at?: string;
          was_successful?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "login_attempts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["user_id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
export type SessionInsert = Database["public"]["Tables"]["sessions"]["Insert"];

export type PasswordResetRow = Database["public"]["Tables"]["password_resets"]["Row"];
export type PasswordResetInsert = Database["public"]["Tables"]["password_resets"]["Insert"];

export type EmailVerificationRow = Database["public"]["Tables"]["email_verifications"]["Row"];
export type EmailVerificationInsert = Database["public"]["Tables"]["email_verifications"]["Insert"];

export type LoginAttemptRow = Database["public"]["Tables"]["login_attempts"]["Row"];
export type LoginAttemptInsert = Database["public"]["Tables"]["login_attempts"]["Insert"];
