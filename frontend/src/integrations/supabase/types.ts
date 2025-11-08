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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          application_password_hash: string
          bank_info: Json | null
          business_info: Json | null
          client_name: string
          company_name: string
          created_at: string
          documents: Json | null
          financial_request: Json | null
          id: string
          link_token: string
          management_ownership: Json | null
          principals: Json | null
          salesman_id: string
          status: Database["public"]["Enums"]["application_status"]
          steps_completed: number
          updated_at: string
        }
        Insert: {
          application_password_hash: string
          bank_info?: Json | null
          business_info?: Json | null
          client_name: string
          company_name: string
          created_at?: string
          documents?: Json | null
          financial_request?: Json | null
          id?: string
          link_token: string
          management_ownership?: Json | null
          principals?: Json | null
          salesman_id: string
          status?: Database["public"]["Enums"]["application_status"]
          steps_completed?: number
          updated_at?: string
        }
        Update: {
          application_password_hash?: string
          bank_info?: Json | null
          business_info?: Json | null
          client_name?: string
          company_name?: string
          created_at?: string
          documents?: Json | null
          financial_request?: Json | null
          id?: string
          link_token?: string
          management_ownership?: Json | null
          principals?: Json | null
          salesman_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          steps_completed?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_salesman_id_fkey"
            columns: ["salesman_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      evaluations: {
        Row: {
          aml_notes: string | null
          aml_status: Database["public"]["Enums"]["evaluation_status"] | null
          application_id: string
          created_at: string
          evaluator_id: string
          id: string
          kyc_notes: string | null
          kyc_status: Database["public"]["Enums"]["evaluation_status"] | null
          overall_status:
            | Database["public"]["Enums"]["evaluation_status"]
            | null
          risk_assessment_notes: string | null
          risk_assessment_status:
            | Database["public"]["Enums"]["evaluation_status"]
            | null
          underwriting_notes: string | null
          underwriting_status:
            | Database["public"]["Enums"]["evaluation_status"]
            | null
          updated_at: string
        }
        Insert: {
          aml_notes?: string | null
          aml_status?: Database["public"]["Enums"]["evaluation_status"] | null
          application_id: string
          created_at?: string
          evaluator_id: string
          id?: string
          kyc_notes?: string | null
          kyc_status?: Database["public"]["Enums"]["evaluation_status"] | null
          overall_status?:
            | Database["public"]["Enums"]["evaluation_status"]
            | null
          risk_assessment_notes?: string | null
          risk_assessment_status?:
            | Database["public"]["Enums"]["evaluation_status"]
            | null
          underwriting_notes?: string | null
          underwriting_status?:
            | Database["public"]["Enums"]["evaluation_status"]
            | null
          updated_at?: string
        }
        Update: {
          aml_notes?: string | null
          aml_status?: Database["public"]["Enums"]["evaluation_status"] | null
          application_id?: string
          created_at?: string
          evaluator_id?: string
          id?: string
          kyc_notes?: string | null
          kyc_status?: Database["public"]["Enums"]["evaluation_status"] | null
          overall_status?:
            | Database["public"]["Enums"]["evaluation_status"]
            | null
          risk_assessment_notes?: string | null
          risk_assessment_status?:
            | Database["public"]["Enums"]["evaluation_status"]
            | null
          underwriting_notes?: string | null
          underwriting_status?:
            | Database["public"]["Enums"]["evaluation_status"]
            | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      application_status:
        | "in-progress"
        | "submitted"
        | "under-review"
        | "approved"
        | "rejected"
      evaluation_status: "pending" | "approved" | "rejected"
      user_role: "salesman" | "evaluator"
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
      application_status: [
        "in-progress",
        "submitted",
        "under-review",
        "approved",
        "rejected",
      ],
      evaluation_status: ["pending", "approved", "rejected"],
      user_role: ["salesman", "evaluator"],
    },
  },
} as const
