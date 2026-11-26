# P0-03: database security and verified invitations

The initial audit and permission tests used disposable PostgreSQL. See the
[implementation report](P0_IMPLEMENTATION_REPORT.md) for the later hosted rollout
and Supabase Auth/API verification. The P0-03 release gate remains open.
Existing migrations `001_schema.sql` and `002_migration.sql` are unchanged.

## Implemented in 003_security_hardening.sql

- Program days/exercises retain assigned-client SELECT. Mutation policies require
  the owning PT. Client DELETE no longer inherits the read predicate.
- Profile grants are reset at table **and column** level. Authenticated users can
  SELECT through RLS and UPDATE only `full_name`; they cannot write `role`, identity,
  or timestamps, or INSERT/DELETE profiles directly.
- Five identity/ownership helpers use an empty search path, qualified relations,
  and authenticated-only execution. PT ownership helpers also require the PT role.
- `handle_new_user()` creates a default-client profile, ignoring a metadata role.
  It no longer links client rows merely because their email matches. Existing
  account links remain intact. Direct API execution of the trigger function is revoked.

**Behavior change:** a newly created account remains unlinked until a secure linking
workflow exists. This is intentional; no frontend should fall back to a mock client.
Migration 004 adds the verified acceptance workflow below; migration 003 alone
does not implement invitations.

## Implemented in 004_verified_invitations.sql

- `issue_client_invitation(p_client_id uuid)` returns a one-row table containing
  `invitation_id uuid`, `token text`, `expires_at timestamptz`. Only the owning PT
  can issue for an unlinked, active, non-archived client with an email. Issuing
  replaces any pending invitation. Expiry is fixed at seven days and capped by a
  database constraint. The caller must handle delivery; this RPC sends no email.
- Tokens combine two independent UUIDv4 values (244 random bits) into 64 lowercase
  hex characters. Only SHA256 is stored. The raw token is exposed in the issue
  response once; it cannot be retrieved from the invitation table. Authenticated
  callers can read selected metadata columns only, scoped to their PT ownership.
- `revoke_client_invitation(p_invitation_id uuid)` returns void; the owning PT can
  revoke pending tokens, and repeating a revocation is harmless.
- `accept_client_invitation(p_token text)` returns the exact `client_id uuid`.
  It requires a client-role account whose `auth.users.email_confirmed_at` is set
  and normalized current email matches both the invitation and current client
  email. Expired, replaced, revoked, consumed, malformed, archived/inactive,
  wrong-role and already-linked cases are rejected.
- Acceptance locks the account, then client, then invitation. Issue/revoke use
  client → invitation ordering. Link creation and token consumption occur in the
  same transaction, so retries cannot create a second link or reuse a token.
- A trigger blocks direct API INSERT/UPDATE of `clients.user_id`. Only the table
  owner, including the security-definer acceptance RPC, may create/change links.
  Existing owner-managed/self-owned links are preserved; service-role API writes
  do not automatically bypass this guard. Apply the migration as the existing
  `clients` table owner, as for migrations 001–003.

This does not provision Auth accounts, deliver verification emails, implement
resend-email UI, or configure GoTrue providers. Those remain Auth integration work.

## Validation performed

Docker CLI exists but its Linux engine was unavailable. A separate native PostgreSQL
17 cluster was created in the OS temporary directory, listening only on 127.0.0.1
port 55439, with synthetic fixtures. It was stopped after the first slice and
restarted for invitation tests and generated types, then stopped after those checks.

The SQL tests passed on:

1. A clean database: platform shim → 001 → 002 → 003 → regression suite.
2. An upgrade database: platform shim → 001 → 002 → existing linked client/program
   fixtures and an explicit legacy `UPDATE(role)` grant → 003 → preservation checks
   → regression suite.

`supabase/tests/003_security_hardening.sql` uses a transaction and rolls its fixtures
back. It exercises PT A, PT B, Client A, Client B, and anonymous roles; own-client
read scope, forbidden inserts/updates/deletes, profile name edits vs role escalation,
metadata role handling, no email auto-link (including duplicate email across PTs),
and positive PT update/delete. It checks affected row counts and then inspects the
actual preserved rows as owner after forbidden DELETE attempts.

This is **PostgreSQL RLS/function validation**, not a claim of full Supabase integration.
`postgres_shim.sql` supplies minimal Auth/Storage tables and `auth.uid()` for SQL
tests. It does not simulate GoTrue, PostgREST, JWT validation, email verification,
storage API, or real Supabase grants. Do not run the shim against a Supabase project.

Additional migration-004 validation passed on both clean and populated upgrade
databases, including all negative cases above, PT ownership, unreadable token
hashes, direct-link write bypass attempts and preservation of existing links.
`004_concurrent_accept.ps1` starts two real SQL sessions with a controlled lock
overlap: exactly one acceptance succeeds, the other is rejected, and database
inspection finds one linked client and one consumed invitation. Its synthetic
committed fixtures are removed in `finally`.

`src/lib/database.types.ts` was generated, not hand-edited, using Supabase CLI
against the clean localhost database with migrations 001–004 applied:

```powershell
npx --no-install supabase gen types typescript --db-url 'postgresql://gym_test@127.0.0.1:55439/gym_invites_clean?sslmode=disable' --schema public
```

This CLI path succeeded without Docker. Types describe the repository's migrated
schema; they do not prove that any remote database already has these migrations.

## Reproduce on disposable databases

Use an empty local database and owner connection. Keep connection credentials outside
repository files. Commands below assume libpq connection variables already identify
the intended **disposable local** database.

```powershell
# Plain PostgreSQL only; skip the shim on an actual disposable Supabase environment.
psql -v ON_ERROR_STOP=1 -f supabase/tests/postgres_shim.sql

# Clean schema path:
psql -v ON_ERROR_STOP=1 -f supabase/001_schema.sql -f supabase/002_migration.sql -f supabase/003_security_hardening.sql -f supabase/004_verified_invitations.sql -f supabase/tests/003_security_hardening.sql -f supabase/tests/004_verified_invitations.sql

# Alternatively, on a DIFFERENT empty database with platform schemas already prepared:
psql -v ON_ERROR_STOP=1 -f supabase/tests/004_upgrade.sql

# Regression only, after all migrations are applied on a disposable Supabase dev DB:
psql -v ON_ERROR_STOP=1 -f supabase/tests/003_security_hardening.sql -f supabase/tests/004_verified_invitations.sql

# Committed synthetic fixtures; loopback only, never a production database:
./supabase/tests/004_concurrent_accept.ps1 -Database gym_invites_clean -Port 55439 -DatabaseUser gym_test
```

`003_upgrade.sql` creates and retains synthetic pre-upgrade fixtures; use only a
disposable database. Migration 003 is a one-time sequential migration, not an
idempotent provisioning script. Failures stop under `ON_ERROR_STOP`.

## Remaining work before P0-03 / production

- Inspect actual dev migration history and platform grants, apply/test on Supabase
  dev, and exercise the same authorization cases through its API.
- Verify invitation email delivery and complete the Google sign-in flow using a
  real invited account. The Supabase Auth/API invitation flow has been tested with
  disposable accounts. Keep account linking tied to invitation acceptance.
- Enforce cross-reference ownership for session/package/program/log/set/meal links;
  and add an attendance RPC, capacity locks and schedule overlap rules. Migration
  005 handles atomic, idempotent saves for the learner workout form. Other write
  paths still rely on existing single-column foreign keys.
- Audit remaining policies and function grants, package extensions, storage MIME/size
  constraints, views, indexes and authenticated disabled/archive behavior.
- Define PT-private notes as a separate protected table. `clients.health_notes` is
  currently readable by its client; it must not be presented as private PT notes.
  No ambiguous existing notes were moved or reclassified in this slice.
- Add program assignment versions/history snapshots, effective-dated nutrition
  targets, and explicit online-duration package rules before dependent features.
- Reconcile generated types with a verified Supabase dev schema before deployment.
  Current types include the RPC contracts from local migrations 001–005.

## Rollback / deployment notes

All migration statements are in one transaction. On an application failure during
deployment, stop and inspect; do not automatically restore insecure policies or
email linking. In dev, restore the disposable pre-migration database/snapshot to
reproduce issues. A production change requires its own reviewed forward fix or
restoration procedure. Existing client links and business rows are not rewritten.
