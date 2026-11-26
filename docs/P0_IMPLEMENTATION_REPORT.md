# P0 implementation — first delivery

Date: 2026-11-25 (Asia/Ho_Chi_Minh).

## Scope and baseline

- Source: `c58e3d2ca5d4e0d909585fea60bc2d29ec032915`, branch `buoc-1-ket-noi`.
- Implementation branch: `work/p0-foundation`.
- Initial working tree: only the user-provided, untracked `docs/GYM_DEVELOPMENT_BACKLOG.md`.
- Existing Supabase SDK, client, generated types and type-generation script were retained.
- No commit, push, merge, deployment or production migration was performed.
- The user confirmed that the only available Supabase project contains real data.
  SQL work was tested on synthetic local data only; no business records were queried,
  uploaded, modified or deleted on the remote project.

## Baseline validation

`npm ci` completed successfully: 279 packages installed. An isolated detached worktree
at `D:/projects/untitled-baseline-audit` was used for clean HEAD checks while subagents
edited the main working tree. It shares the installed node_modules through a junction.

| Check | Baseline result |
| --- | --- |
| `npm ci` | Passed with the existing lockfile |
| `npm run lint` | Passed on clean HEAD |
| `npm run typecheck` | Passed on clean HEAD |
| `npm test` | 4 files, 31 tests passed on clean HEAD |
| `npm run build` | Passed on clean HEAD |

Local runtime was Node 22.17.0 / npm 10.9.2. CI previously used Node 20, outside the
installed Vitest/Supabase engine ranges. CI now reads `.nvmrc` (Node 22), and
package/lock metadata declares the supported runtime range.

`npm audit --json` reported 16 pre-existing dependency vulnerabilities (12 moderate,
4 high). Dependency upgrades were not mixed into this data-integrity change. The
advisories and affected dependency graph need a separate validated update before
release; a passing build does not clear these findings.

## Work ownership and implementation

| Owner | Delivered scope |
| --- | --- |
| Agent A | P0-02 persistence, v0–v3 migration, current user identity, reset, hydration and mutation guards |
| Agent B | P0-02 backup/export/import validation, legacy compatibility, Settings warnings and regression tests |
| Agent C | First P0-03 SQL hardening slice, local PostgreSQL tests and database audit |
| Primary agent | Baseline/runtime/CI, routing integration, review, local environment configuration and documentation |

### P0-01: verified baseline, with browser limitation

Vite preview served HTTP 200 and the SPA root at `/`, `/workout/program`,
`/workout/library`, `/nutrition` and `/settings`. The Vercel rewrite remains intact.
Code inspection and React Router matching found the two workout subroutes falling
through to `*`; both now explicitly render the existing Workout component.

Browser automation could not start because its access host was unavailable. HTTP
fallback checks do not prove rendered UI behavior or deployed Vercel routing. Direct
browser reload/mobile checks remain outstanding. Personal browser storage was not
read, reset or migrated; hydration/import tests use synthetic data only. A real-data
backup remains a prerequisite before any later personal-data migration.

### P0-02: local data integrity

- Workout creation uses the current profile ID.
- Reset clears active session/sets and all timer state.
- `foods` is persisted and exported; the persistence version is 4.
- Migration preserves explicit flags and treats missing customization metadata
  conservatively. Hydration no longer queues stale state through a deferred callback.
- Hydration and import allowlist data keys so serialized actions cannot replace methods.
- Backup validation copies allowed fields into new objects and checks collection shape,
  duplicate IDs, ownership, foreign keys, enums, finite numbers, dates, sessions and timer.
- Legacy missing-food backups recover seed food definitions, retain actual meal
  snapshots and warn about unrecoverable custom catalog entries.
- Legacy missing catalog flags are normalized with a warning; malformed explicit flags
  still fail validation. Settings refreshes its form after a successful import.
- Input validation and store guards keep new workout values consistent with the backup
  schema; invalid old data is reported rather than silently rounded or fabricated.

Limitations: old meal/water data without a date retains the earlier migration behavior
of using the migration day. No missing historical facts can be reconstructed. A recovery
screen for arbitrarily corrupted localStorage is not part of this delivery. Backups
missing other required collections are rejected instead of guessing their contents.

### P0-03: partial, not release-ready

See `P0_DATABASE_AUDIT.md`. Migration 003 separates client read access from PT writes,
restricts profile column updates, hardens helper execution and disables email-only
linking. Existing links are preserved. It does not implement verified invitations.

The SQL suite passed on native PostgreSQL 17, on both a clean schema and an upgrade
with existing fixtures and a legacy column grant. Tests cover PT A/B, Client A/B and
anonymous, including actual row state after forbidden deletes. The disposable cluster
was stopped after testing. CI is configured to run both paths against PostgreSQL 17;
the GitHub-hosted workflow itself has not been run in this session.

Auth/Storage stubs are a test limitation: no GoTrue, PostgREST, JWT verification,
invitation flow, storage API or actual Supabase platform-grant integration was verified.

## Supabase configuration

The user-supplied URL/publishable key/project ID were written to ignored `.env.local`.
The old anon-key setting was removed there to avoid overriding the chosen publishable
key; unrelated variables were preserved. `.env.example` documents the publishable key
and the legacy anon-key alternative. No actual keys are copied into these documents.

The initial read-only Auth health request failed with DNS `name does not exist`.
The user subsequently confirmed the project was paused and restarted it. A repeat
request on 2026-11-25 returned HTTP 200. Auth service reachability is verified;
database permissions, authenticated access and application cloud sync are not.

The user supplied a local database backup. Its presence and size (417,144 bytes)
were confirmed without reading or restoring its contents. `*.backup` is ignored by
Git. The backup filename is dated 2026-11-19; its completeness, actual snapshot time
and restorability have not been verified. It is not evidence of a tested rollback.

## Final integration checks

After all code changes and cross-review fixes:

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm test` | 5 files, 112 tests passed (baseline: 31) |
| `npm run build` | Passed; 2,307 modules transformed |
| `git diff --check` | Passed |
| CI YAML parse | Passed; two jobs configured |
| Runtime metadata | package.json and package-lock.json engines match |
| React Router matching | Both workout subroutes match explicit routes, not fallback |
| SQL clean / upgrade suites | Passed on disposable PostgreSQL 17; see database audit |

No browser-rendered UI test or GitHub-hosted CI run is included in these results.
The temporary baseline preview server and disposable PostgreSQL cluster were stopped.

## Next work and release gate

1. Provision/select an isolated dev environment before remote mutation testing.
   Live Auth health is confirmed, but the current live project remains excluded
   from mutation tests. Verify backup restoration only in an isolated environment.
2. Complete P0-03 verified invitations, ownership constraints, private notes separation,
   mutation RPCs and full Supabase API tests.
3. P0-04 auth/guards → P0-05 repositories and account-scoped cache → P0-06 explicit
   previewed local-to-cloud import with reconciliation.
4. Complete browser/mobile smoke tests and the dependency-security update.

Do not mark the whole P0 gate complete or onboard real learners from this delivery.
No automatic upload happens on login, and authentication is not yet wired into the app.

## Rollback notes

All source changes remain uncommitted for review. Keep a validated backup before
testing migration against personal local data. Older app versions may not accept
persisted v4 data; use a retained pre-migration copy when testing an older build.
Do not downgrade the persistence version against migrated data as a rollback shortcut.
SQL 003 runs transactionally; do not restore insecure policies or email-only linking
as an automatic rollback. Use disposable DB snapshots or a reviewed forward fix.


## 2026-11-26 follow-up

Migration 004 implements client-specific invitations with expiration, revocation,
verified email and atomic one-time acceptance. Database types were regenerated from
the applied local schema. SQL checks passed on fresh and upgraded PostgreSQL 17
databases, including concurrent acceptance. The local Supabase Auth and PostgREST
smoke test passed with synthetic users, including issuing, revoking and accepting
an invitation and rejecting reuse. Email delivery and browser interaction remain
unverified.

Auth screens now cover sign-in, sign-out, recovery and client invitation acceptance.
Cloud mode remains opt-in while account and database rollout are reviewed. The
local startup script uses a separate Supabase stack with email confirmation enabled.

P0-05 has a first read-only slice. The signed-in overview verifies the account-to-client
link, limits all related reads to that client, and shows empty states for missing data.
The component is keyed by account and client. Its requests are cancelled on unmount,
and its results are kept in memory. Legacy tracker data is separate. The new overview
has repository tests for ID validation, scoping and empty values. Cross-device write
sync, idempotent mutations, offline drafts and P0-06 import remain pending.

## Hosted Supabase rollout

After the owner approved the hosted change, migrations 002–004 were executed
in one transaction through the Supabase CLI SQL query command. The preflight
found the original policies and no rows at the exercise seed IDs. The same
transaction promoted the owner's existing verified Auth account to PT.
This was a direct SQL rollout. The CLI migration ledger was not changed.

A subsequent read confirmed the new tables, invitation RPC, separate program
read/write policies and removal of authenticated role updates. Cloud mode is
enabled in ignored `.env.local`. The dev server at `http://127.0.0.1:3002/login`
returns HTTP 200 and is configured for the hosted API. Sign-in with the owner's
credentials and hosted email flows still need interactive verification.

Google OAuth is enabled on the hosted project. The Supabase redirect allowlist
contains `http://127.0.0.1:3002/auth/callback`. HTTP checks confirmed that the
app serves the login route and the Supabase authorization endpoint redirects
to Google's sign-in flow. Completing sign-in and confirming the existing PT
profile requires an interactive Google session.

## 2026-11-26 onboarding and workout follow-up

- The account page links to distinct PT and learner areas. Browser tests with
  disposable accounts covered navigation in both directions, reload and redirects
  when a user opens the other role's URL.
- A PT can create an unlinked profile with a name and email and immediately
  generate its verified invitation. The browser flow rejected a mismatched email.
  The local Auth/API smoke test confirmed profile isolation and rejected reuse.
- A linked learner can record a workout with exercises, sets, weight, reps and a
  note. Migration 005 saves the workout and sets in one transaction. The local
  smoke test covered rollback of invalid sets and concurrent retries. On the
  hosted project, a fresh browser session read back the note and both saved sets.
- Migration 005 was applied to the same hosted project through the CLI SQL query
  command after local verification. Test data was removed after validation.
- The Google authorization redirect and the app's return to the invitation were
  verified separately. Completing the Google flow with a real invited account
  and verifying the workout on a second physical device remain open. The
  loopback URL is limited to the development machine.

P1-03 and P1-05 cover additional work. Next, finish acceptance testing with a
real Google learner and a second device using an HTTPS test URL. Then continue
P1-03 with viewing, editing, searching and archiving learner profiles. Build
workout logging from assigned programs as P1-04 and the rest of P1-05 progress.
