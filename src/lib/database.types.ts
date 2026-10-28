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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      body_metrics: {
        Row: {
          arm_cm: number | null
          body_fat_pct: number | null
          chest_cm: number | null
          client_id: string
          created_at: string
          created_by: string | null
          hip_cm: number | null
          id: string
          measured_on: string
          note: string | null
          photo_paths: string[]
          thigh_cm: number | null
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          arm_cm?: number | null
          body_fat_pct?: number | null
          chest_cm?: number | null
          client_id: string
          created_at?: string
          created_by?: string | null
          hip_cm?: number | null
          id?: string
          measured_on?: string
          note?: string | null
          photo_paths?: string[]
          thigh_cm?: number | null
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          arm_cm?: number | null
          body_fat_pct?: number | null
          chest_cm?: number | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          hip_cm?: number | null
          id?: string
          measured_on?: string
          note?: string | null
          photo_paths?: string[]
          thigh_cm?: number | null
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "body_metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_packages: {
        Row: {
          client_id: string
          created_at: string
          end_date: string
          id: string
          mode: Database["public"]["Enums"]["package_mode"]
          name: string
          note: string | null
          price_vnd: number
          sessions_total: number
          start_date: string
          status: Database["public"]["Enums"]["package_status"]
          template_id: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          end_date: string
          id?: string
          mode?: Database["public"]["Enums"]["package_mode"]
          name: string
          note?: string | null
          price_vnd: number
          sessions_total: number
          start_date?: string
          status?: Database["public"]["Enums"]["package_status"]
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          end_date?: string
          id?: string
          mode?: Database["public"]["Enums"]["package_mode"]
          name?: string
          note?: string | null
          price_vnd?: number
          sessions_total?: number
          start_date?: string
          status?: Database["public"]["Enums"]["package_status"]
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_packages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_packages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "package_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          archived_at: string | null
          birth_year: number | null
          created_at: string
          email: string | null
          full_name: string
          gender: string | null
          goal: string | null
          health_notes: string | null
          height_cm: number | null
          id: string
          phone: string | null
          pt_id: string
          start_date: string
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          archived_at?: string | null
          birth_year?: number | null
          created_at?: string
          email?: string | null
          full_name: string
          gender?: string | null
          goal?: string | null
          health_notes?: string | null
          height_cm?: number | null
          id?: string
          phone?: string | null
          pt_id: string
          start_date?: string
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          archived_at?: string | null
          birth_year?: number | null
          created_at?: string
          email?: string | null
          full_name?: string
          gender?: string | null
          goal?: string | null
          health_notes?: string | null
          height_cm?: number | null
          id?: string
          phone?: string | null
          pt_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_pt_id_fkey"
            columns: ["pt_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dish_ingredients: {
        Row: {
          dish_id: string
          food_id: string
          grams: number
        }
        Insert: {
          dish_id: string
          food_id: string
          grams: number
        }
        Update: {
          dish_id?: string
          food_id?: string
          grams?: number
        }
        Relationships: [
          {
            foreignKeyName: "dish_ingredients_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dish_ingredients_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      dishes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          pt_id: string | null
          servings: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          pt_id?: string | null
          servings?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          pt_id?: string | null
          servings?: number
        }
        Relationships: [
          {
            foreignKeyName: "dishes_pt_id_fkey"
            columns: ["pt_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          equipment: string | null
          id: string
          instructions: string | null
          is_active: boolean
          name: string
          primary_muscle: string
          pt_id: string | null
          secondary_muscles: string[]
          video_url: string | null
        }
        Insert: {
          created_at?: string
          equipment?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          name: string
          primary_muscle: string
          pt_id?: string | null
          secondary_muscles?: string[]
          video_url?: string | null
        }
        Update: {
          created_at?: string
          equipment?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          name?: string
          primary_muscle?: string
          pt_id?: string | null
          secondary_muscles?: string[]
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_pt_id_fkey"
            columns: ["pt_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          carbs_per_100g: number
          created_at: string
          fat_per_100g: number
          id: string
          is_active: boolean
          is_eating_out: boolean
          kcal_per_100g: number
          name: string
          protein_per_100g: number
          pt_id: string | null
          unit: string
          unit_grams: number
        }
        Insert: {
          carbs_per_100g?: number
          created_at?: string
          fat_per_100g?: number
          id?: string
          is_active?: boolean
          is_eating_out?: boolean
          kcal_per_100g: number
          name: string
          protein_per_100g?: number
          pt_id?: string | null
          unit?: string
          unit_grams?: number
        }
        Update: {
          carbs_per_100g?: number
          created_at?: string
          fat_per_100g?: number
          id?: string
          is_active?: boolean
          is_eating_out?: boolean
          kcal_per_100g?: number
          name?: string
          protein_per_100g?: number
          pt_id?: string | null
          unit?: string
          unit_grams?: number
        }
        Relationships: [
          {
            foreignKeyName: "foods_pt_id_fkey"
            columns: ["pt_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_logs: {
        Row: {
          carbs_g: number
          client_id: string
          created_at: string
          created_by: string | null
          description: string | null
          dish_id: string | null
          fat_g: number
          food_id: string | null
          id: string
          kcal: number
          log_date: string
          meal_name: string
          meal_plan_item_id: string | null
          photo_path: string | null
          protein_g: number
          status: Database["public"]["Enums"]["meal_log_status"]
        }
        Insert: {
          carbs_g?: number
          client_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          dish_id?: string | null
          fat_g?: number
          food_id?: string | null
          id?: string
          kcal?: number
          log_date?: string
          meal_name: string
          meal_plan_item_id?: string | null
          photo_path?: string | null
          protein_g?: number
          status: Database["public"]["Enums"]["meal_log_status"]
        }
        Update: {
          carbs_g?: number
          client_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          dish_id?: string | null
          fat_g?: number
          food_id?: string | null
          id?: string
          kcal?: number
          log_date?: string
          meal_name?: string
          meal_plan_item_id?: string | null
          photo_path?: string | null
          protein_g?: number
          status?: Database["public"]["Enums"]["meal_log_status"]
        }
        Relationships: [
          {
            foreignKeyName: "meal_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_logs_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_logs_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_logs_meal_plan_item_id_fkey"
            columns: ["meal_plan_item_id"]
            isOneToOne: false
            referencedRelation: "meal_plan_items"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plan_items: {
        Row: {
          day_index: number
          dish_id: string | null
          food_id: string | null
          grams: number | null
          id: string
          meal_name: string
          meal_plan_id: string
          order_index: number
          servings: number | null
        }
        Insert: {
          day_index?: number
          dish_id?: string | null
          food_id?: string | null
          grams?: number | null
          id?: string
          meal_name: string
          meal_plan_id: string
          order_index?: number
          servings?: number | null
        }
        Update: {
          day_index?: number
          dish_id?: string | null
          food_id?: string | null
          grams?: number | null
          id?: string
          meal_name?: string
          meal_plan_id?: string
          order_index?: number
          servings?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_items_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_items_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          pt_id: string
          target_kcal: number | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          pt_id: string
          target_kcal?: number | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          pt_id?: string
          target_kcal?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plans_pt_id_fkey"
            columns: ["pt_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_profiles: {
        Row: {
          activity_factor: number
          allergies: string | null
          carbs_g: number | null
          client_id: string
          dislikes: string | null
          fat_g: number | null
          is_pregnant: boolean
          meals_per_day: number
          medical_conditions: string | null
          protein_g: number | null
          target_kcal: number | null
          updated_at: string
        }
        Insert: {
          activity_factor?: number
          allergies?: string | null
          carbs_g?: number | null
          client_id: string
          dislikes?: string | null
          fat_g?: number | null
          is_pregnant?: boolean
          meals_per_day?: number
          medical_conditions?: string | null
          protein_g?: number | null
          target_kcal?: number | null
          updated_at?: string
        }
        Update: {
          activity_factor?: number
          allergies?: string | null
          carbs_g?: number | null
          client_id?: string
          dislikes?: string | null
          fat_g?: number | null
          is_pregnant?: boolean
          meals_per_day?: number
          medical_conditions?: string | null
          protein_g?: number | null
          target_kcal?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      package_extensions: {
        Row: {
          created_at: string
          id: string
          new_end_date: string
          old_end_date: string
          package_id: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          new_end_date: string
          old_end_date: string
          package_id: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          new_end_date?: string
          old_end_date?: string
          package_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_extensions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "client_package_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_extensions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "client_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      package_templates: {
        Row: {
          created_at: string
          duration_days: number
          id: string
          is_active: boolean
          mode: Database["public"]["Enums"]["package_mode"]
          name: string
          price_vnd: number
          pt_id: string
          sessions: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_days: number
          id?: string
          is_active?: boolean
          mode?: Database["public"]["Enums"]["package_mode"]
          name: string
          price_vnd: number
          pt_id: string
          sessions: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_days?: number
          id?: string
          is_active?: boolean
          mode?: Database["public"]["Enums"]["package_mode"]
          name?: string
          price_vnd?: number
          pt_id?: string
          sessions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_templates_pt_id_fkey"
            columns: ["pt_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_vnd: number
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          note: string | null
          package_id: string
          paid_on: string
        }
        Insert: {
          amount_vnd: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          package_id: string
          paid_on?: string
        }
        Update: {
          amount_vnd?: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          package_id?: string
          paid_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "client_package_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "client_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      program_days: {
        Row: {
          day_index: number
          focus: string | null
          id: string
          name: string
          notes: string | null
          program_id: string
        }
        Insert: {
          day_index?: number
          focus?: string | null
          id?: string
          name: string
          notes?: string | null
          program_id: string
        }
        Update: {
          day_index?: number
          focus?: string | null
          id?: string
          name?: string
          notes?: string | null
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_days_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_exercises: {
        Row: {
          exercise_id: string
          id: string
          notes: string | null
          order_index: number
          planned_sets: number
          program_day_id: string
          rep_max: number
          rep_min: number
          rest_seconds: number
          target_weight_kg: number | null
        }
        Insert: {
          exercise_id: string
          id?: string
          notes?: string | null
          order_index?: number
          planned_sets?: number
          program_day_id: string
          rep_max?: number
          rep_min?: number
          rest_seconds?: number
          target_weight_kg?: number | null
        }
        Update: {
          exercise_id?: string
          id?: string
          notes?: string | null
          order_index?: number
          planned_sets?: number
          program_day_id?: string
          rep_max?: number
          rep_min?: number
          rest_seconds?: number
          target_weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "program_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_exercises_program_day_id_fkey"
            columns: ["program_day_id"]
            isOneToOne: false
            referencedRelation: "program_days"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          client_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          pt_id: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          pt_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          pt_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_pt_id_fkey"
            columns: ["pt_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          client_id: string
          created_at: string
          duration_min: number
          id: string
          mode: Database["public"]["Enums"]["training_mode"]
          note: string | null
          online_link: string | null
          package_id: string | null
          program_day_id: string | null
          starts_at: string
          status: Database["public"]["Enums"]["session_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          duration_min?: number
          id?: string
          mode?: Database["public"]["Enums"]["training_mode"]
          note?: string | null
          online_link?: string | null
          package_id?: string | null
          program_day_id?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["session_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          duration_min?: number
          id?: string
          mode?: Database["public"]["Enums"]["training_mode"]
          note?: string | null
          online_link?: string | null
          package_id?: string | null
          program_day_id?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "client_package_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "client_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_program_day_fk"
            columns: ["program_day_id"]
            isOneToOne: false
            referencedRelation: "program_days"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          ended_at: string | null
          id: string
          note: string | null
          program_day_id: string | null
          started_at: string
          training_session_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          note?: string | null
          program_day_id?: string | null
          started_at?: string
          training_session_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          note?: string | null
          program_day_id?: string | null
          started_at?: string
          training_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_program_day_id_fkey"
            columns: ["program_day_id"]
            isOneToOne: false
            referencedRelation: "program_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_training_session_id_fkey"
            columns: ["training_session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sets: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          program_exercise_id: string | null
          reps: number
          set_number: number
          status: Database["public"]["Enums"]["set_status"]
          weight_kg: number
          workout_log_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          program_exercise_id?: string | null
          reps?: number
          set_number: number
          status?: Database["public"]["Enums"]["set_status"]
          weight_kg?: number
          workout_log_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          program_exercise_id?: string | null
          reps?: number
          set_number?: number
          status?: Database["public"]["Enums"]["set_status"]
          weight_kg?: number
          workout_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sets_program_exercise_id_fkey"
            columns: ["program_exercise_id"]
            isOneToOne: false
            referencedRelation: "program_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sets_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      client_package_summary: {
        Row: {
          client_id: string | null
          created_at: string | null
          days_left: number | null
          debt_vnd: number | null
          end_date: string | null
          id: string | null
          mode: Database["public"]["Enums"]["package_mode"] | null
          name: string | null
          note: string | null
          paid_vnd: number | null
          price_vnd: number | null
          sessions_left: number | null
          sessions_total: number | null
          sessions_used: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["package_status"] | null
          template_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_packages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_packages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "package_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_nutrition: {
        Row: {
          carbs_g: number | null
          client_id: string | null
          fat_g: number | null
          kcal: number | null
          log_date: string | null
          meals_as_planned: number | null
          meals_logged: number | null
          protein_g: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_access_client: { Args: { p_client_id: string }; Returns: boolean }
      is_pt: { Args: never; Returns: boolean }
      is_pt_of: { Args: { p_client_id: string }; Returns: boolean }
      my_client_id: { Args: never; Returns: string }
      my_pt_id: { Args: never; Returns: string }
    }
    Enums: {
      client_status: "active" | "paused" | "inactive"
      meal_log_status: "as_planned" | "adjusted" | "skipped" | "off_plan"
      package_mode: "offline" | "online" | "hybrid"
      package_status:
        | "active"
        | "paused"
        | "expired"
        | "completed"
        | "cancelled"
      payment_method: "cash" | "bank_transfer" | "other"
      session_status:
        | "scheduled"
        | "attended"
        | "excused"
        | "no_show"
        | "rescheduled"
        | "cancelled"
      set_status: "planned" | "completed" | "skipped"
      training_mode: "offline" | "online"
      user_role: "pt" | "client"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      client_status: ["active", "paused", "inactive"],
      meal_log_status: ["as_planned", "adjusted", "skipped", "off_plan"],
      package_mode: ["offline", "online", "hybrid"],
      package_status: ["active", "paused", "expired", "completed", "cancelled"],
      payment_method: ["cash", "bank_transfer", "other"],
      session_status: [
        "scheduled",
        "attended",
        "excused",
        "no_show",
        "rescheduled",
        "cancelled",
      ],
      set_status: ["planned", "completed", "skipped"],
      training_mode: ["offline", "online"],
      user_role: ["pt", "client"],
    },
  },
} as const
