# Product Rules & Principles

## 1. Core Principles
- **Aesthetic**: Maintain the dark premium fitness aesthetic, PULSE / KINETIC branding, specific typography (glassmorphism/bento), and the green primary accent. Follow existing design without redesigning the core 4 screens.
- **UX Copy**: Avoid overly technical/jargon-heavy UX copy going forward. (e.g., prefer simpler terms over "Bio-Telemetry Matrix" or "Metabolic Fuel Distribution", though we do not redesign the existing screens).
- **Performance**: Workout logging must be optimized for fast gym use (minimal taps to accurately record weight/reps).
- **Data Derivation**: Metrics like PRs, total volume, weekly volume, and daily nutrition totals must preferably be calculated from raw data rather than being stored redundantly.
- **Canonical Values**:
  - Current weight: 65 kg (Never 68 kg)
  - Target weight: 70 kg
  - Daily calories: 2,340 consumed / 3,000 kcal target
  - Remaining: 660 kcal
  - Protein: 180 / 200g
  - Carbs: 260 / 350g
  - Fat: 62 / 85g

## 2. Business Rules & Logic
- **Rest Timer**: Must use *one single source of truth* (a global state that both the Sidebar and active Workout view consume).
- **Weigh-ins**: Daily target and phase progress visually driven by differences between starting weight, current weight (65.0 kg), and target (70.0 kg).

## 3. Implementation Details & Resolved Decisions

- **State Management (Context vs Zustand)**: Selected **Zustand**. Zustand avoids unnecessary re-renders in React when updating high-frequency states like the active Rest Timer. It is simpler than managing multiple separate React Contexts (User, Workout, Timer), fits the fast gym logging requirement perfectly, and remains scalable.
- **Workout Summary**: Flows from Finish Workout → Workout Summary → Save Workout → View History / Overview. Identifies metrics like PRs, Volume, Sets, and Duration.
- **Missed Meals**: Meals have a strict `planned → completed` or `planned → missed` lifecycle. An unlogged meal at day's end becomes "missed" and is never auto-logged.
- **Exercise & Food Data**: The MVP uses an internal seeded database. External APIs will not be integrated at this phase, but the data layer must be abstracted to allow future integration without domain rewriting.
- **Workout Programs**: A default "Hypertrophy 5x/Week" program is provided (Push/Pull/Legs/Upper/Lower). The application enforces user configurability; users must eventually be able to add/remove exercises, change rep ranges, change planned sets, alter rest times, and reorder items. Exercises must not be hardcoded in UI mockups.
