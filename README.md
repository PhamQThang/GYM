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

Use Node.js 22.13 or newer in the 22.x line (`.nvmrc`), matching CI.
The supported runtime range is declared in `package.json`; npm and
`package-lock.json` are the dependency source of truth.

1. **Install Dependencies**
   ```bash
   npm ci
   ```

2. **Run the Development Server**
   ```bash
   npm run dev
   ```

3. **Validation Commands**
   ```bash
   npm run lint  # ESLint
   npm run typecheck
   npm test
   npm run build # Build the production application
   ```

## Known Limitations

- The web app uses Supabase for PT/client sign-in, verified invitations, assigned-program views and workout history. Learners can start a workout from an assigned day or log one without a program.
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the Vercel environment for the deployment. A legacy Supabase project can use `VITE_SUPABASE_ANON_KEY` in place of the publishable key. The Vercel build stops if either required setting is absent.
- Learners can view their assigned program, exercise catalog and nutrition records. Workout and weight logging write to Supabase. Editing programs and logging meals in the learner portal are pending.
- Features like social progress sharing or server-managed routine discovering are out-of-scope for the early phase MVP.

## Local data and P0 development

- Persistence is version 4. Hydration migrates versions 0–3 while preserving existing
  catalog customization flags. Reset clears the active workout and rest timer.
- JSON backups include foods, workout drafts and timer state. Imports validate
  references, ownership, dates and numeric values and cannot replace store actions.
  Legacy v1 backups missing foods recover the seed catalog and retain meal snapshots;
  custom food definitions absent from the original export cannot be reconstructed.
  Missing legacy catalog metadata is recovered conservatively with a warning.
- Migration 003 hardens profile and program permissions. Migration 004 adds verified invitations and keeps existing account links.
- Apply migration 005 after 004 on any Supabase project serving cloud workout logging. It adds the RPC that saves a workout and its sets in one transaction.
- CI includes PostgreSQL permission regression tests using minimal Auth/Storage
  stubs. These do not replace Supabase Auth, API and storage integration tests.

To test the online app against a disposable Supabase stack on Windows, start Docker and run:

```powershell
powershell -NoProfile -File scripts/start-local-auth.ps1
```

Add `-SmokeTest` to verify invitation acceptance, account isolation and workout persistence across sessions with disposable accounts.
The script uses a loopback API and applies the repository migrations to its local stack.
The account overview reads the assigned program, workout history summary, nutrition
targets, latest weight, active package and upcoming PT session from Supabase.

For Google sign-in on hosted Supabase, create a Google OAuth Web client. Add the
hosted Supabase `/auth/v1/callback` URL as a Google authorized redirect URI.
Enable Google in Supabase Auth and enter the OAuth client ID and secret there.
Add `http://127.0.0.1:3002/auth/callback` to the Supabase redirect allowlist for
the local web app connected to the hosted database. Add the equivalent URL for
any deployed app. The **Tiếp tục với Google** button opens Google's account
chooser. When started from the invitation page, Google sign-in returns learners
to that invitation in the same tab to confirm acceptance.

See [P0 implementation report](docs/P0_IMPLEMENTATION_REPORT.md) and
[database audit](docs/P0_DATABASE_AUDIT.md) for validation and remaining work.

## Roadmap

- Deployed Demonstration Application.
- Database & Backend Integration.
- Comprehensive Authentication Workflow.
- Progressive Web App (PWA) Offline Functionality.
