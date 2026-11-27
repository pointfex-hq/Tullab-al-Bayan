
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {

  "public": {
          Tables: {
            "_archived_bayan_staff_access": {
                  Row: {
                    "role": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "role": string,"user_id": string
                  }
                  Update: {
                    "role"?: string,"user_id"?: string
                  }
                  Relationships: [

                  ]
                },"_archived_bayan_student_profiles": {
                  Row: {
                    "batch": string,"full_name": string,"student_id": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "batch": string,"full_name": string,"student_id": string,"user_id"?: string | null
                  }
                  Update: {
                    "batch"?: string,"full_name"?: string,"student_id"?: string,"user_id"?: string | null
                  }
                  Relationships: [

                  ]
                },"attendance_marks": {
                  Row: {
                    "marked_at": string,"marked_by": string | null,"session_id": string,"status": string,"student_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "marked_at"?: string,"marked_by"?: string | null,"session_id": string,"status": string,"student_id": string,"updated_at"?: string
                  }
                  Update: {
                    "marked_at"?: string,"marked_by"?: string | null,"session_id"?: string,"status"?: string,"student_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "attendance_marks_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "attendance_sessions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_marks_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"attendance_sessions": {
                  Row: {
                    "batch_id": number,"class_date": string,"class_type": string,"created_at": string,"created_by": string | null,"id": string,"session_no": number
                  }
                  ComputedFields: never
                  Insert: {
                    "batch_id": number,"class_date"?: string,"class_type": string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"session_no": number
                  }
                  Update: {
                    "batch_id"?: number,"class_date"?: string,"class_type"?: string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"session_no"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "attendance_sessions_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
      referencedRelation: "batches"
      referencedColumns: ["id"]
    }
                  ]
                },"batches": {
                  Row: {
                    "class_time": string | null,"created_at": string,"day_of_week": number,"display_order": number,"id": number,"name": string,"updated_at": string,"venue": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "class_time"?: string | null,"created_at"?: string,"day_of_week": number,"display_order": number,"id": number,"name": string,"updated_at"?: string,"venue"?: string | null
                  }
                  Update: {
                    "class_time"?: string | null,"created_at"?: string,"day_of_week"?: number,"display_order"?: number,"id"?: number,"name"?: string,"updated_at"?: string,"venue"?: string | null
                  }
                  Relationships: [

                  ]
                },"homework_assignments": {
                  Row: {
                    "batch_id": number,"deadline": string | null,"id": string,"instructions": string,"published_at": string,"published_by": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "batch_id": number,"deadline"?: string | null,"id"?: string,"instructions": string,"published_at"?: string,"published_by"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "batch_id"?: number,"deadline"?: string | null,"id"?: string,"instructions"?: string,"published_at"?: string,"published_by"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "homework_assignments_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
      referencedRelation: "batches"
      referencedColumns: ["id"]
    }
                  ]
                },"monthly_tuition": {
                  Row: {
                    "amount_due": number | null,"base_fee": number | null,"batch_id": number,"billing_month": string,"created_at": string,"display_status": string | null,"id": string,"notes": string | null,"paid_at": string | null,"payment_status": string,"scholarship_percent": number,"student_id": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_due"?: never,"base_fee"?: number | null,"batch_id": number,"billing_month": string,"created_at"?: string,"display_status"?: never,"id"?: string,"notes"?: string | null,"paid_at"?: string | null,"payment_status"?: string,"scholarship_percent"?: number,"student_id": string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "amount_due"?: never,"base_fee"?: number | null,"batch_id"?: number,"billing_month"?: string,"created_at"?: string,"display_status"?: never,"id"?: string,"notes"?: string | null,"paid_at"?: string | null,"payment_status"?: string,"scholarship_percent"?: number,"student_id"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "monthly_tuition_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
      referencedRelation: "batches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "monthly_tuition_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"students": {
                  Row: {
                    "batch_assigned_at": string,"batch_id": number,"created_at": string,"deactivated_at": string | null,"default_monthly_fee": number | null,"default_scholarship_percent": number,"email": string | null,"enrolled_at": string,"full_name": string,"id": string,"is_active": boolean,"student_code": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "batch_assigned_at"?: string,"batch_id": number,"created_at"?: string,"deactivated_at"?: string | null,"default_monthly_fee"?: number | null,"default_scholarship_percent"?: number,"email"?: string | null,"enrolled_at"?: string,"full_name": string,"id"?: string,"is_active"?: boolean,"student_code": string,"updated_at"?: string
                  }
                  Update: {
                    "batch_assigned_at"?: string,"batch_id"?: number,"created_at"?: string,"deactivated_at"?: string | null,"default_monthly_fee"?: number | null,"default_scholarship_percent"?: number,"email"?: string | null,"enrolled_at"?: string,"full_name"?: string,"id"?: string,"is_active"?: boolean,"student_code"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "students_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
      referencedRelation: "batches"
      referencedColumns: ["id"]
    }
                  ]
                },"role_audit_logs": {
                  Row: {
                    "action": string,"actor_user_id": string,"created_at": string,"details": Json,"id": string,"role": string,"target_user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_user_id": string,"created_at"?: string,"details"?: Json,"id"?: string,"role": string,"target_user_id": string
                  }
                  Update: {
                    "action"?: string,"actor_user_id"?: string,"created_at"?: string,"details"?: Json,"id"?: string,"role"?: string,"target_user_id"?: string
                  }
                  Relationships: [

                  ]
                },"user_roles": {
                  Row: {
                    "created_at": string,"full_name": string | null,"role": string,"staff_code": string | null,"student_id": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"full_name"?: string | null,"role": string,"staff_code"?: string | null,"student_id"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"full_name"?: string | null,"role"?: string,"staff_code"?: string | null,"student_id"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_roles_student_id_fkey"
      columns: ["student_id"]
isOneToOne: true
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {}
          Functions: {
            "create_attendance_session":
{ Args: { "p_batch_id": number,"p_class_date": string,"p_class_type": string }; Returns: {
              "batch_id": number,
"class_date": string,
"class_type": string,
"created_at": string,
"created_by": string | null,
"id": string,
"session_no": number
            }
                          SetofOptions: {
        from: "*"
        to: "attendance_sessions"
        isOneToOne: true
        isSetofReturn: false
      } },
"current_student_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"current_user_role":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"delete_empty_attendance_session":
{ Args: { "p_session_id": string }; Returns: undefined
                           },
"generate_monthly_tuition":
{ Args: { "p_batch_id"?: number,"p_billing_month": string }; Returns: number
                           },
"get_teacher_roster":
{ Args: Record<PropertyKey, never>; Returns: {
              "batch_id": number,"full_name": string,"id": string,"student_code": string
            }[]
                           },
"import_students_csv":
{ Args: { "p_rows": Json }; Returns: Json
                           },
"is_active_student":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_student_eligible_for_session":
{ Args: { "p_session_id": string,"p_student_id": string }; Returns: boolean
                           },
"link_student_account":
{ Args: { "p_student_id": string,"p_user_id": string }; Returns: undefined
                           },
"list_pending_auth_users":
{ Args: Record<PropertyKey, never>; Returns: {
              "created_at": string,"email": string,"full_name": string,"user_id": string
            }[]
                           },
"list_teacher_accounts":
{ Args: Record<PropertyKey, never>; Returns: {
              "email": string,"full_name": string | null,"staff_code": string | null,"user_id": string
            }[]
                           },
"list_teacher_audit_logs":
{ Args: { "p_limit"?: number }; Returns: {
              "action": string,"actor_name": string,"created_at": string,"details": Json,"id": string,"target_name": string
            }[]
                           },
"link_teacher_account":
{ Args: { "p_full_name": string,"p_staff_code"?: string,"p_user_id": string }; Returns: undefined
                           },
"unlink_student_account":
{ Args: { "p_student_id": string }; Returns: undefined
                           },
"unlink_teacher_account":
{ Args: { "p_user_id": string }; Returns: undefined
                           },
"update_teacher_account":
{ Args: { "p_full_name": string,"p_staff_code"?: string,"p_user_id": string }; Returns: undefined
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {

          }
        }
} as const
