# Live Supabase & Google OAuth Setup (`frontend/`)

Live authentication uses **Supabase Auth (Google OAuth PKCE)** backed by `public.user_roles`, `public.batches`, and `public.students` (see [../docs/DATABASE_DESIGN.md](../docs/DATABASE_DESIGN.md)). Demo accounts and `sessionStorage` role switching have been removed from `src/app/App.jsx`.

---

## 1. Local Development Environment

1. Install frontend dependencies from `frontend/`:
   ```powershell
   npm ci
   ```
   *(On Windows machines with limited `C:\` disk space, optionally pass `--cache D:\npm-cache`.)*
2. Start local Supabase (requires WSL2 + Docker Desktop) and apply migrations + local dev seed:
   ```powershell
   npx --yes supabase@3.2.0 start
   npx --yes supabase@3.2.0 db reset
   ```
3. Copy [`.env.example`](./.env.example) to `.env.local` (gitignored) and set the local or Staging values:
   - `VITE_SUPABASE_URL` — e.g. `http://127.0.0.1:54321` locally, or your hosted project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` — publishable / anon key only

---

## 2. Public vs. Secret Credentials Boundary

| Credential / Variable | Where Allowed | Visibility | Rules |
|---|---|---|---|
| `VITE_SUPABASE_URL` | `frontend/.env.local`, Vercel Preview/Production | Public (browser bundle) | Safe to expose; uniquely identifies the Supabase API endpoint. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `frontend/.env.local`, Vercel Preview/Production | Public (browser bundle) | Safe to expose only because RLS is enabled on all tables and client privileges are least-privilege. |
| `service_role` / secret API key | Never in `frontend/` | **SECRET** | Never put in any `VITE_*` variable, `.env*` committed file, client code, or documentation. |
| PostgreSQL DB password / URL | Local CLI / hosting secrets only | **SECRET** | Never put in frontend code or `VITE_*` variables. |
| Google OAuth Client ID & Secret | Supabase Dashboard (`Authentication → Providers → Google`) | **Client Secret is SECRET** | Client ID & Client Secret live inside Supabase Auth server config only; never expose the Client Secret in `frontend/`. |

---

## 3. Google OAuth Configuration (Hosted / Staging / Production)

1. Create a Google OAuth **Web application** client in Google Cloud Console and register the Supabase Auth callback URL (`https://<project-ref>.supabase.co/auth/v1/callback`).
2. In Supabase **Authentication → Sign In / Providers → Google**, enable Google and configure its Client ID and Client Secret.
3. In Supabase **Authentication → URL Configuration**, set the Site URL and add exact `/sign-in` redirect URLs for every environment (for example `http://localhost:5173/sign-in` and your Vercel Preview/Production `/sign-in` URLs). Avoid broad wildcard redirects.
4. Ensure Vercel deployments set **Root Directory** to `frontend` so [vercel.json](./vercel.json) rewrites `/sign-in` and deep portal routes to `/index.html`.
5. Note for local Docker (`http://127.0.0.1:54321`): interactive Google OAuth requires enabling the Google provider and valid OAuth credentials in local Supabase auth configuration; without them, Google redirect sign-in cannot complete against Google locally.

---

## 4. Safe Use of Supabase SQL Editor (Provisioning Staff Roles)

Staff roles (`admin`, `teacher`) cannot be requested or assigned by regular users—all client `INSERT`/`UPDATE`/`DELETE` privileges on `public.user_roles` are revoked, so users cannot promote themselves. Teachers are provisioned by an Admin through **Teacher Management**, which uses admin-only database functions. Provision the first Admin strictly from the **Supabase SQL Editor** (or reviewed migrations) following these safety rules:

1. **Verify target environment first:** Double-check the project badge in Supabase Dashboard (Staging vs. Production) before opening the SQL Editor.
2. **Never run destructive local commands in hosted SQL Editor:** Never execute `seed.sql`, `DROP TABLE`, `TRUNCATE`, or `db reset` statements on Staging or Production, and never modify RLS policies or grants ad-hoc outside versioned files in `frontend/supabase/migrations/`.
3. **Verify the user in `auth.users` first:** Ask the approved staff member to sign in with Google once (so they exist in `auth.users` and wait safely on the Pending screen), then confirm their `id`, `email`, and identity before running any `INSERT`.

```sql
-- Step A: Look up the verified user in auth.users by institute-approved email
SELECT id AS auth_user_id, email, created_at
FROM auth.users
WHERE deleted_at IS NULL
  AND lower(email) = lower('<verified-staff-email>');
```

### Initial Admin Provisioning

Bootstrap the first administrator (replacing all `<...>` placeholders with verified values):

```sql
INSERT INTO public.user_roles (user_id, role, student_id, staff_code, full_name)
VALUES (
  '<verified-admin-auth-user-uuid>',
  'admin',
  NULL,
  '<optional-staff-code>',
  '<verified-admin-full-name>'
)
ON CONFLICT (user_id) DO NOTHING;
```

### Teacher Account Provisioning

Preferred path: ask the teacher to sign in with Google once, then approve, edit or revoke them from **Admin → Teacher Management** (`/admin/teachers`). Those actions call server-side admin-only RPCs and write entries to the teacher access history. Use the SQL Editor below only when the admin UI is unavailable; it bypasses the audit log. The `student_id` column MUST remain `NULL` due to `chk_user_roles_role_links`:

```sql
INSERT INTO public.user_roles (user_id, role, student_id, staff_code, full_name)
VALUES (
  '<verified-teacher-auth-user-uuid>',
  'teacher',
  NULL,
  '<optional-staff-code>',
  '<verified-teacher-full-name>'
)
ON CONFLICT (user_id) DO NOTHING;
```

> Have the newly provisioned Admin or Teacher click **Check access again** on the Pending screen (or reload the page) to enter `/admin` or `/teacher`.

---

## 5. Student Account Linking Workflow

Students **must** already have a record in `public.students` (and cannot self-register into a student role):

1. **Roster exists first:** The student's record (`student_code`, `full_name`, `batch_id`, `email`) is created or imported in `public.students` by an Admin.
2. **Student signs in with Google:** Any unlinked Google account receives no `public.user_roles` row (`role = 'pending'`) and sees only the **"Awaiting institute access"** screen with zero access to batches, roster, attendance, tuition, or homework.
3. **Admin verifies and links via RPC:** After verifying the signed-in Google account against institute records, an authenticated Admin links the account using the `SECURITY DEFINER` RPCs (never by granting client table writes):
   - `list_pending_auth_users()` — lists non-deleted `auth.users` without a `user_roles` row.
   - `link_student_account(p_student_id, p_user_id)` — locks the student row, rejects staff accounts (`23514`) and duplicate links (`23505`), and inserts `(user_id, 'student', p_student_id)` into `public.user_roles`.
   - `unlink_student_account(p_student_id)` — removes the `'student'` mapping from `public.user_roles`, immediately revoking portal access under RLS while preserving `public.students` and all historical attendance and tuition records.
4. **Student accesses portal:** Have the student click **Check access again** (or refresh) to load `/student`. Inactive former students (`is_active = false`) retain read-only access to their own profile, past attendance, and past tuition, and receive `0` homework rows.
