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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      availability_slots: {
        Row: {
          area: string | null
          city: string
          created_at: string
          end_time: string
          id: string
          location_note: string | null
          meeting_type: Database["public"]["Enums"]["meeting_type"]
          start_time: string
          status: Database["public"]["Enums"]["slot_status"]
          trip_id: string
        }
        Insert: {
          area?: string | null
          city: string
          created_at?: string
          end_time: string
          id?: string
          location_note?: string | null
          meeting_type?: Database["public"]["Enums"]["meeting_type"]
          start_time: string
          status?: Database["public"]["Enums"]["slot_status"]
          trip_id: string
        }
        Update: {
          area?: string | null
          city?: string
          created_at?: string
          end_time?: string
          id?: string
          location_note?: string | null
          meeting_type?: Database["public"]["Enums"]["meeting_type"]
          start_time?: string
          status?: Database["public"]["Enums"]["slot_status"]
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      event_join_questions: {
        Row: {
          correct_option: string
          created_at: string
          created_by_guest_id: string | null
          event_id: string
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
        }
        Insert: {
          correct_option: string
          created_at?: string
          created_by_guest_id?: string | null
          event_id: string
          id?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
        }
        Update: {
          correct_option?: string
          created_at?: string
          created_by_guest_id?: string | null
          event_id?: string
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_join_questions_created_by_guest_id_fkey"
            columns: ["created_by_guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_join_questions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          created_at: string
          event_id: string
          guest_id: string | null
          id: string
          role: Database["public"]["Enums"]["participant_role"]
          status: Database["public"]["Enums"]["participant_status"]
        }
        Insert: {
          created_at?: string
          event_id: string
          guest_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["participant_role"]
          status?: Database["public"]["Enums"]["participant_status"]
        }
        Update: {
          created_at?: string
          event_id?: string
          guest_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["participant_role"]
          status?: Database["public"]["Enums"]["participant_status"]
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          area: string | null
          city: string
          created_at: string
          created_by_guest_id: string | null
          description: string | null
          end_time: string
          exact_location: string | null
          id: string
          join_policy: Database["public"]["Enums"]["join_policy"]
          location_status: Database["public"]["Enums"]["location_status"]
          slot_id: string | null
          start_time: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          trip_id: string
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          area?: string | null
          city: string
          created_at?: string
          created_by_guest_id?: string | null
          description?: string | null
          end_time: string
          exact_location?: string | null
          id?: string
          join_policy?: Database["public"]["Enums"]["join_policy"]
          location_status?: Database["public"]["Enums"]["location_status"]
          slot_id?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          trip_id: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          area?: string | null
          city?: string
          created_at?: string
          created_by_guest_id?: string | null
          description?: string | null
          end_time?: string
          exact_location?: string | null
          id?: string
          join_policy?: Database["public"]["Enums"]["join_policy"]
          location_status?: Database["public"]["Enums"]["location_status"]
          slot_id?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          trip_id?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_guest_id_fkey"
            columns: ["created_by_guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "availability_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_question_attempts: {
        Row: {
          created_at: string
          guest_id: string
          host_question_id: string
          id: string
          is_correct: boolean
          selected_option: string
        }
        Insert: {
          created_at?: string
          guest_id: string
          host_question_id: string
          id?: string
          is_correct: boolean
          selected_option: string
        }
        Update: {
          created_at?: string
          guest_id?: string
          host_question_id?: string
          id?: string
          is_correct?: boolean
          selected_option?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_question_attempts_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_question_attempts_host_question_id_fkey"
            columns: ["host_question_id"]
            isOneToOne: false
            referencedRelation: "host_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          contact_type: Database["public"]["Enums"]["contact_type"]
          contact_value: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          contact_type: Database["public"]["Enums"]["contact_type"]
          contact_value: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          contact_type?: Database["public"]["Enums"]["contact_type"]
          contact_value?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      host_questions: {
        Row: {
          active: boolean
          correct_option: string
          created_at: string
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          trip_id: string
        }
        Insert: {
          active?: boolean
          correct_option: string
          created_at?: string
          id?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          trip_id: string
        }
        Update: {
          active?: boolean
          correct_option?: string
          created_at?: string
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_text?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "host_questions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      join_requests: {
        Row: {
          created_at: string
          event_id: string
          id: string
          is_correct: boolean | null
          question_id: string | null
          requesting_guest_id: string
          selected_option: string | null
          status: Database["public"]["Enums"]["join_request_status"]
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          is_correct?: boolean | null
          question_id?: string | null
          requesting_guest_id: string
          selected_option?: string | null
          status?: Database["public"]["Enums"]["join_request_status"]
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          is_correct?: boolean | null
          question_id?: string | null
          requesting_guest_id?: string
          selected_option?: string | null
          status?: Database["public"]["Enums"]["join_request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "join_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "join_requests_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "event_join_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "join_requests_requesting_guest_id_fkey"
            columns: ["requesting_guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          created_at: string
          event_id: string
          id: string
          kind: string
          recipient_email: string
          send_at: string
          sent_at: string | null
          status: Database["public"]["Enums"]["reminder_status"]
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          kind?: string
          recipient_email: string
          send_at: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["reminder_status"]
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          kind?: string
          recipient_email?: string
          send_at?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["reminder_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reminders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      todos: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          status: Database["public"]["Enums"]["todo_status"]
          title: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: Database["public"]["Enums"]["todo_status"]
          title: string
          trip_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: Database["public"]["Enums"]["todo_status"]
          title?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todos_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_locations: {
        Row: {
          area: string | null
          city: string
          created_at: string
          end_date: string
          id: string
          notes: string | null
          start_date: string
          trip_id: string
          visibility: Database["public"]["Enums"]["itinerary_visibility"]
        }
        Insert: {
          area?: string | null
          city: string
          created_at?: string
          end_date: string
          id?: string
          notes?: string | null
          start_date: string
          trip_id: string
          visibility?: Database["public"]["Enums"]["itinerary_visibility"]
        }
        Update: {
          area?: string | null
          city?: string
          created_at?: string
          end_date?: string
          id?: string
          notes?: string | null
          start_date?: string
          trip_id?: string
          visibility?: Database["public"]["Enums"]["itinerary_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "trip_locations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          created_at: string
          end_date: string
          host_display_name: string
          host_user_id: string
          id: string
          intro_text: string | null
          public_slug: string
          start_date: string
          timezone: string
          title: string
        }
        Insert: {
          created_at?: string
          end_date: string
          host_display_name?: string
          host_user_id: string
          id?: string
          intro_text?: string | null
          public_slug?: string
          start_date: string
          timezone?: string
          title: string
        }
        Update: {
          created_at?: string
          end_date?: string
          host_display_name?: string
          host_user_id?: string
          id?: string
          intro_text?: string | null
          public_slug?: string
          start_date?: string
          timezone?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_event_trip_host: { Args: { _event_id: string }; Returns: boolean }
      is_trip_host: { Args: { _trip_id: string }; Returns: boolean }
    }
    Enums: {
      contact_type:
        | "wechat"
        | "whatsapp"
        | "email"
        | "phone"
        | "instagram"
        | "other"
      event_status: "confirmed" | "cancelled"
      event_visibility:
        | "private"
        | "show_time_only"
        | "show_people"
        | "show_details"
      itinerary_visibility: "public" | "private"
      join_policy: "not_joinable" | "request_to_join"
      join_request_status: "pending" | "approved" | "rejected"
      location_status: "tbd" | "suggested" | "confirmed"
      meeting_type:
        | "coffee"
        | "meal"
        | "walk"
        | "drinks"
        | "activity"
        | "flexible"
      participant_role: "host" | "creator" | "participant"
      participant_status: "confirmed" | "pending" | "declined"
      reminder_status: "pending" | "sent" | "failed"
      slot_status: "available" | "booked" | "blocked"
      todo_status: "open" | "done"
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
      contact_type: [
        "wechat",
        "whatsapp",
        "email",
        "phone",
        "instagram",
        "other",
      ],
      event_status: ["confirmed", "cancelled"],
      event_visibility: [
        "private",
        "show_time_only",
        "show_people",
        "show_details",
      ],
      itinerary_visibility: ["public", "private"],
      join_policy: ["not_joinable", "request_to_join"],
      join_request_status: ["pending", "approved", "rejected"],
      location_status: ["tbd", "suggested", "confirmed"],
      meeting_type: [
        "coffee",
        "meal",
        "walk",
        "drinks",
        "activity",
        "flexible",
      ],
      participant_role: ["host", "creator", "participant"],
      participant_status: ["confirmed", "pending", "declined"],
      reminder_status: ["pending", "sent", "failed"],
      slot_status: ["available", "booked", "blocked"],
      todo_status: ["open", "done"],
    },
  },
} as const
