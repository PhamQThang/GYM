# Data Model

## Core Domain Model

### User
- `id`: string (UUID)
- `name`: string
- `current_weight`: number (kg, e.g., 65)
- `target_weight`: number (kg, e.g., 70)
- `target_calories`: number (kcal, e.g., 3000)
- `target_protein`: number (g, e.g., 200)
- `target_carbs`: number (g, e.g., 350)
- `target_fat`: number (g, e.g., 85)

### Goal
- `id`: string
- `user_id`: string
- `type`: enum ('Lean Bulk', 'Cut', 'Maintenance')
- `start_date`: date
- `target_date`: date (TODO / DECISION REQUIRED: Is there a specific target date or duration?)

### WorkoutProgram
- `id`: string
- `name`: string (e.g., 'Hypertrophy Split 5x/Week')
- `phase`: string (e.g., 'Phase II')
- `description`: string

### WorkoutDay
- `id`: string
- `program_id`: string
- `name`: string (e.g., 'Push Day A')
- `day_of_week`: number (or specific dates? TODO / DECISION REQUIRED)
- `is_active`: boolean 
- `focus`: string
- `notes`: string

### Exercise
- `id`: string
- `name`: string
- `primary_muscle`: string
- `secondary_muscles`: string[]
- `type`: string (TODO / DECISION REQUIRED: track exercise types like machine, barbell, dumbbell?)

### WorkoutExercise
- `id`: string
- `workout_day_id`: string
- `exercise_id`: string
- `order_index`: number
- `planned_sets`: number
- `rep_range_min`: number
- `rep_range_max`: number
- `rest_seconds`: number (e.g., 90)
- `notes`: string

### WorkoutSession
- `id`: string
- `user_id`: string
- `workout_day_id`: string
- `start_time`: timestamp
- `end_time`: timestamp (nullable)
- `status`: enum ('IN_PROGRESS', 'COMPLETED')
- `total_volume`: number (Derived from raw data)

### WorkoutSet
- `id`: string
- `session_id`: string
- `workout_exercise_id`: string
- `set_number`: number
- `weight`: number (kg)
- `reps`: number
- `is_pr`: boolean (Derived)
- `status`: enum ('PLANNED', 'COMPLETED', 'SKIPPED')

### Food
- `id`: string
- `name`: string
- `serving_size`: string
- `calories_per_serving`: number
- `protein_per_serving`: number
- `carbs_per_serving`: number
- `fat_per_serving`: number
- `is_quick_add`: boolean (e.g., 'Instant Hypertrophy Fuel Pills')

### Meal
- `id`: string
- `user_id`: string
- `name`: string (e.g., 'Breakfast', 'Lunch', 'Pre-workout')
- `scheduled_time`: time
- `description`: string
- `status`: enum ('PLANNED', 'CONSUMED', 'MISSED')

### MealItem
- `id`: string
- `meal_id`: string
- `food_id`: string (can be null if custom item)
- `name`: string
- `calories`: number
- `protein`: number
- `carbs`: number
- `fat`: number

### WeightLog
- `id`: string
- `user_id`: string
- `date`: date
- `weight`: number (kg)
