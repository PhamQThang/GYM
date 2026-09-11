# User Flows

## 1. App Entry → Overview
- User opens the app and lands on the Overview dashboard.
- Active Phase, Current Goal Progress, Daily Calories Status, and Today's Session are immediately visible.
- User can trigger Quick Actions: "Log Weigh-in", "Quick Add Food", or "Start Workout".

## 2. Workout Execution Flow
- **Overview → Start Workout**
- Enters **Workout Session** (live mode). Active rest timer globally available.
- **Log Sets**:
  - Automatically loads planned sets for the first exercise.
  - User can quickly adjust weight/reps via macro steppers (e.g., -2.5 kg, +1 rep).
  - Marks set as completed.
- **Rest**: Rest timer automatically triggers and is globally synced (visible in App Header/Sidebar and Workout Screen).
- **Finish Workout**: Records session end time.
- **Workout Summary**: Displays a summary of Duration, Total volume, Exercises completed, Sets completed, PRs, and an Exercise breakdown.
- **Save Workout**: Persists data to history.
- **View History or Return to Overview**.

## 3. Nutrition Logging
- **Nutrition Screen** shows daily macros, metabolic fuel distribution, and scheduled intake.
- **Add Meal**: User clicks "Log Meal" or "Add Food" in a specific meal window. (Meals transition from 'planned' to 'completed').
- If a planned meal remains unlogged at the end of the day, it is marked as 'missed'. A planned meal is NEVER auto-logged.
- **Search Food**: Looks up from standard database or quick access "Fuel Pills" (e.g., Whey Protein Shake).
- **Select Food → Quantity → Add Food**.
- **Update**: Daily nutrition totals (consumed, deficit) are instantly updated.

## 4. Weigh-in Flow
- **Overview → Log Weigh-in**
- Input daily fasted weight (e.g., 65.0 kg).
- **WeightLog** entry created.
- **Progress update**: The 7-day rolling arithmetic mean re-calculates automatically in Progress tab.

## 5. Analytics & Progress
- **Progress Screen** entered from Sidebar.
- User reviews long-term analytics: Weight/Caloric totals, Workout Volume (Tonnage), and PR analytics.
- Values are derived across the available history.
