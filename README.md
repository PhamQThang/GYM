# PULSE / KINETIC — Gym Tracker
[![CI](https://github.com/PhamQThang/GYM/actions/workflows/ci.yml/badge.svg)](https://github.com/PhamQThang/GYM/actions/workflows/ci.yml)

A personal gym, workout, nutrition, and progress tracking dashboard designed for swift, distraction-free logging with a premium dark glassmorphism aesthetic.

## Live Demo

[Open the live demo](https://untitled-gules-theta.vercel.app)

*(Note: Screenshot assets are currently missing from the repository.)*

## Key Features

- **Workout Execution**: Optimized live-recording interface with global rest-timer synchronization across views. Rapidly log sets, track reps, and manage weight seamlessly during intense sessions.
- **Workout Programs & Customization**: Comprehensive exercise library allowing completely customizable programs. Defaults to a Hypertrophy 5x/Week structure (Push, Pull, Legs, Upper, Lower) that users can tweak to fit specific goals.
- **Nutrition Tracking**: Date-aware logging system with targeted macro monitoring. Track calories, protein, carbs, and fat alongside metabolic energy limits. Unlogged meals are gracefully handled to ensure realistic analytics.
- **Progress Analytics**: Real-time trend visualization using Recharts. Monitor weekly volume shifts, caloric surplus/deficit history, and trajectory of 1-Rep Max (e1RM) and personal records.
- **Biometric Logging**: Input daily fasted weight updates to drive automatic insights and 7-day rolling performance means.

## Tech Stack

- **React** (Component Architecture)
- **TypeScript** (Strict Type Safety)
- **Vite** (Build Tooling & Dev Server)
- **Tailwind CSS** (Utility-first Styling & Theming)
- **Zustand** (Predictable Global Global State)
- **React Router** (URL-driven Navigation)
- **Recharts** (Data Visualization)

## Implementation Details & Resolved Decisions

- **State Management (Zustand)**: We actively opted for Zustand over multiple React Contexts (User, Workout, Timer). High-frequency state layers (like the active Rest Timer) mandate minimal re-renders, making Zustand critical for performance and fast in-gym interactions.
- **Data Derivation**: PRs, volume analytics, and weekly progress are dynamically derived from raw interaction metrics rather than being stored as redundant, brittle flags (`is_pr`). This ensures historical datasets can safely adapt to future algorithm upgrades.
- **Soft Deletion & Idempotency**: Data structures support soft-deletion (e.g. for routines or food items) to perfectly preserve deeply nested historical timeline records (Workout Sets or Consumed Meals) safely without orphaned references.
- **Routing & Chart Performance**: Incorporating robust code-splitting capabilities via React's `lazy` APIs and `Suspense`; large visualization architectures (Recharts) are isolated on load, vastly improving initially-painted interactive latency.

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run the Development Server**
   ```bash
   npm run dev
   ```

3. **Validation Commands**
   ```bash
   npm run lint  # Type Checking
   npm run build # Build the production application
   ```

## Known Limitations

- The application is currently completely client-side. Local data storage holds the operational state, so there is currently no backend database, cloud persistence, nor authentication. Data cannot sync across separate devices securely right now.
- Features like social progress sharing or server-managed routine discovering are out-of-scope for the early phase MVP.

## Roadmap

- Deployed Demonstration Application.
- Database & Backend Integration.
- Comprehensive Authentication Workflow.
- Progressive Web App (PWA) Offline Functionality.
