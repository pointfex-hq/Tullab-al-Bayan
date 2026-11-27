# Ṭullāb al-Bayān — Iffat Implementation Handoff & Cross-Module Guide

- **Target Branch Base:** `main` (after merging `fix/phase2-migrations-and-qa`)
- **Primary Maintainer / Next Developer:** Iffat Jahan (`iffat1187`, branch `feat/frontend-polish-export`)
- **Database & Auth References:** [DATABASE_DESIGN.md](./DATABASE_DESIGN.md), [DAY1_FOUNDATION_HANDOFF.md](./DAY1_FOUNDATION_HANDOFF.md), [AUTH_SETUP.md](../frontend/AUTH_SETUP.md)

---

## 1. Project Status

**Al Bayan Student Management System (`Ṭullāb al-Bayān`)** is a React 19 + Vite 7 + Tailwind CSS v4 frontend (`frontend/`) backed by Supabase PostgreSQL 15, PostgREST, and Supabase Auth (Google OAuth PKCE), scoped for ~200 students, one institute, `Asia/Dhaka` calendar dates, and two-decimal `BDT` currency.

| Track | Branch | Status | Summary |
|---|---|---|---|
| **Day 1 Foundation** (`Celestial-Pramit`) | `feat/supabase-cli-auth-homework` | **Merged (`36e1843`)** | Live Google OAuth PKCE (`App.jsx`, `supabaseAuth.js`, `useLiveAuth.js`, `MyProfile.jsx`), `batches` / `students` / `user_roles`, `AdminBatchPage` / `batchRepository`, `homework_assignments` CRUD (`202611200001`, `202611230001`, `202611230002`). |
| **Core Modules** (`mohi-ahmed`) | `feat/roster-tuition-attendance` | **Merged (`29e13ea`)** | CSV import (`202611230003`), `monthly_tuition` (`202611230004`), `attendance_sessions` & `attendance_marks` (`202611230005`), Roster/Linking UI (`StudentManagement.jsx`), Tuition UI, Staff Attendance, and Student Overview/Attendance pages. |
| **Phase 2 Stabilization & QA** (`Celestial-Pramit`) | `fix/phase2-migrations-and-qa` | **Ready for Review / PR** | Fixed 4 RLS/trigger/grant issues in `202611230005_attendance.sql`, regenerated `database.types.ts`, restored `AdminTuition.jsx` search/filters/summary cards, fixed `AcademicCalendar.jsx` `StudentCalendar`, made legacy `read*` stubs throw synchronously, and passed 3-layer local Docker QA. |
| **UI Polish, Dashboard, Export & Teacher Approval** (`iffat1187`) | `feat/frontend-polish-export` | **Pending (Next)** | Migrate `StaffDashboard.jsx`, implement **Approved Option 2 Teacher Listing & 1-Click Approval**, add Admin `BatchCalendar` time/venue editing, convert `CurriculumAnalysis.jsx` to static image + coming-soon bar, hide placeholder sidebar links, and build 6-CSV `AdminExport.jsx`. |
| **QA Suite & Runbooks** (`jihadmia35`) | `chore/qa-rls-tests-docs` | **Pending (Async)** | Permanent `frontend/supabase/tests/rls_and_constraints.test.sql`, CSV QA fixtures, Staging QA report, and Operations runbook. |

---

## 2. Completed Work & Verification Evidence (`fix/phase2-migrations-and-qa`)

### Completed Files in This Fix PR
1. [`frontend/supabase/migrations/202611230005_attendance.sql`](../frontend/supabase/migrations/202611230005_attendance.sql)
   - Hardened `stamp_attendance_mark_actor()` to stamp `marked_by := auth.uid()`, set `marked_at := now()` on `INSERT`, reject mutating `session_id` or `student_id` (`42501`) on `UPDATE`, and preserve `OLD.marked_at` across PostgREST `.upsert()` updates.
   - Added `is_student_eligible_for_session(uuid, uuid)` (`STABLE SECURITY DEFINER SET search_path = ''`, restricted to `'admin'`/`'teacher'`) so Teachers can `INSERT` marks for active matching-batch students without direct `SELECT` on `public.students`.
   - Removed unintended `UPDATE` grant/policy on `attendance_sessions`; fixed `"Students read eligible attendance sessions"` so linked students retain historical `SELECT` on marked sessions after batch transfer or Option A reactivation, while limiting unmarked sessions to active current-batch sessions `>= greatest(enrolled_at, batch_assigned_at)`.
   - Updated `"Staff update existing attendance marks"` so staff can fix typos on existing marks even after student transfer/deactivation; added `FOR UPDATE` locking and `NULL` guard in `delete_empty_attendance_session()`.
2. [`frontend/src/types/database.types.ts`](../frontend/src/types/database.types.ts) — Regenerated cleanly (UTF-8 without BOM) from local Supabase covering all 7 tables, 2 compatibility views, and 12 functions.
3. [`frontend/src/features/roster/rosterRepository.js`](../frontend/src/features/roster/rosterRepository.js) & [`frontend/src/features/admin/StudentManagement.jsx`](../frontend/src/features/admin/StudentManagement.jsx) — Renamed async `readRoster()` → `listRoster()`; restored synchronous throwing stub `readRoster()`; guarded empty file picker in `CsvImportDialog`.
4. [`frontend/src/features/attendance/attendanceRepository.js`](../frontend/src/features/attendance/attendanceRepository.js) & [`frontend/src/features/tuition/tuitionRepository.js`](../frontend/src/features/tuition/tuitionRepository.js) — Replaced `readSessions`/`readTuition` aliases with synchronous throwing stubs; trimmed whitespace in `parseFee()`.
5. [`frontend/src/features/tuition/AdminTuition.jsx`](../frontend/src/features/tuition/AdminTuition.jsx) — Restored Search roster, Payment status filter dropdown, clickable Batch payment summary cards, `"Month not generated yet"` hint, status badges, and save feedback while preserving `Generate Monthly Tuition`, Paid-change confirmation, `paymentDisabled`, and `ledger` mode.
6. [`frontend/src/features/academics/AcademicCalendar.jsx`](../frontend/src/features/academics/AcademicCalendar.jsx) — Updated `StudentCalendar` to read `account.batch` and show an inactive-enrollment notice when `account.isActive === false` (removed broken `readRoster()` call; `BatchCalendar` left untouched).

### Verification Summary (`fix/phase2-migrations-and-qa`)
- **PASS — Local Migrations & Day 1 SQL Regression Scripts:** `supabase db reset` (`202611200001`–`202611230005` + `seed.sql`), `preflight_phase1_audit.sql`, `verify_phase2_backfill_local.sql`, and `verify_phase2_preflight_failures_local.sql` all exited `0` on local Docker PostgreSQL.
- **PASS — 6-Role SQL & Live Local GoTrue JWT + PostgREST/Repository Suite:** Verified `admin`, `teacher`, `active student` (including Batch `1 -> 2` transfer, Option A reactivation, and cross-student isolation), `former student`, `pending user`, and `anon` across CSV import, student link/unlink, monthly tuition, PostgREST `.upsert()` insert/update, immutable key/actor enforcement, and Day 1 homework/batches.
- **PASS — Frontend Build, SSR & Unauthenticated Browser Smoke:** `npm run build` (`vite build`), 9 React SSR component checks, and local browser check on `/sign-in` + `/admin` redirect passed with 0 JS console/network errors.
- **NOT TESTED — Interactive Google OAuth & Authenticated Browser Click-Through:** Local Supabase lacks Google Cloud OAuth credentials; live browser clicking inside authenticated `/admin`, `/teacher`, and `/student` sessions must be verified on Staging/Production after hosted migrations are pushed.
- **NOT APPLIED TO HOSTED SUPABASE:** `202611230003`–`202611230005` have NOT been pushed to hosted Staging/Production Supabase yet.

---

## 3. Current Database Architecture (Verified)

### Tables (`public` schema, RLS enabled, `REVOKE ALL` baseline)
1. `public.batches` (`id` `1..7` Saturday–Friday, `name`, `day_of_week`, `display_order`, `class_time`, `venue`) — `SELECT` for approved roles; `UPDATE (class_time, venue)` for `admin` only; `INSERT`/`DELETE` revoked.
2. `public.students` (`id` UUID PK, `student_code`, `full_name`, `email` nullable for legacy backfill, `batch_id` FK `batches`, `default_monthly_fee`, `default_scholarship_percent` in `0/50/100`, `is_active`, `enrolled_at`, `batch_assigned_at`, `deactivated_at`) — `admin` `SELECT`/`INSERT`/`UPDATE`; student `SELECT` own row; **Teacher direct `SELECT` denied (`0` rows)**.
3. `public.user_roles` (`user_id` UUID PK FK `auth.users(id) ON DELETE CASCADE`, `role` in `'admin'|'teacher'|'student'`, `student_id` UUID UNIQUE FK `students(id) ON DELETE RESTRICT`, `staff_code`, `full_name`, `created_at`, `updated_at`) — Constraint `chk_user_roles_role_links` enforces `student_id IS NOT NULL AND staff_code IS NULL` for `'student'` and `student_id IS NULL` for `'admin'`/`'teacher'`. Client `INSERT`/`UPDATE`/`DELETE` revoked (`SELECT` own or all for `admin`).
4. `public.homework_assignments` (`id`, `batch_id`, `title`, `instructions`, `deadline`, `published_by`, `published_at`, `updated_at`) — Staff CRUD; active student `SELECT` own batch; former student `0` rows.
5. `public.monthly_tuition` (`id`, `student_id`, `batch_id` snapshot, `billing_month` 1st-of-month, `base_fee`, `scholarship_percent`, generated `amount_due` & `display_status`, `payment_status`, `paid_at`, `notes`, `updated_by`) — Admin `SELECT`/`INSERT`/`UPDATE` (`batch_id` immutable on update; `Paid` requires `amount_due > 0`); Student `SELECT` own rows; **Teacher denied (`0` rows)**.
6. `public.attendance_sessions` (`id`, `batch_id`, `class_date`, `class_type` `'Physical'|'Online'`, `session_no`, `created_by`) — Staff `SELECT` (created/deleted via RPCs only); Linked student `SELECT` on marked sessions OR active current-batch sessions `>= greatest(enrolled_at, batch_assigned_at)`.
7. `public.attendance_marks` (`session_id`, `student_id`, `status` `'Present'|'Late'|'Sick'|'Absent'`, `marked_by`, `marked_at`, `updated_at`) — Staff `SELECT`, `INSERT` (active matching-batch student via `is_student_eligible_for_session`), `UPDATE` (existing marks); Student `SELECT` own marks; `DELETE` revoked.

### Views & Legacy Archives
- Compatibility views (`security_invoker = true`): `public.bayan_staff_access`, `public.bayan_student_profiles` (dropped later in `202611230006_finalize_legacy_cleanup.sql` after legacy email backfill).
- Archived Phase 1 tables (`42501` denied to all clients): `_archived_bayan_staff_access`, `_archived_bayan_student_profiles`.

### Verified RPC & Helper Functions (`SECURITY DEFINER SET search_path = ''`)
- Auth/RLS helpers: `current_user_role()`, `current_student_id()`, `is_active_student()`, `is_student_eligible_for_session(uuid, uuid)`.
- Teacher roster: `get_teacher_roster()` (active students without `email` or fee defaults).
- Student linking: `list_pending_auth_users()`, `link_student_account(p_student_id, p_user_id)`, `unlink_student_account(p_student_id)`.
- Bulk import & tuition: `import_students_csv(p_rows)`, `generate_monthly_tuition(p_billing_month, p_batch_id)`.
- Attendance: `create_attendance_session(p_batch_id, p_class_date, p_class_type)`, `delete_empty_attendance_session(p_session_id)`.

### Auth & Account Shape Contract (`useOutletContext() -> { role, account }`)
- Unlinked Google users have no `user_roles` row (`role = 'pending'`) and are locked on `PendingAccessScreen` in `App.jsx`.
- Staff roles (`admin`, `teacher`) and linked students (`student`) resolve via `loadProfile()` in `supabaseAuth.js` with shape `{ userId, role, name, email, photo, staffId, studentUuid, id, batchId, batch, isActive, enrolledAt, batchAssignedAt }`.

---

## 4. Iffat's Module Ownership & Responsibilities

| Module / File | Current State | Incomplete / Blocked Work | Owned By | Required Actions & Completion Criteria |
|---|---|---|---|---|
| [`StaffDashboard.jsx`](../frontend/src/features/dashboard/StaffDashboard.jsx) | **BLOCKED (Broken on `/admin` & `/teacher`)** | Calls transitional throwing stubs `readRoster()`, `readSessions()`, `readTuition()`, `readHomework()`; renders error banner `"Dashboard records could not be loaded..."`; Admin summary uses legacy `historyId` and divides/sums without async state; Teacher summary uses static `academicCalendar()`. | Iffat | Migrate to async `batchRepository.listActiveRosterForRole(role)`, `attendanceRepository.listSessions({ classDate: today })`, `tuitionRepository.listMonthlyTuition({ billingMonth: month })` (**Admin only** — never call for Teacher!), `homeworkRepository.listHomework()`, and `batchRepository.listBatches()`. Handle loading/error/empty states. Once migrated, delete transitional `read*` stubs from `rosterRepository.js`, `attendanceRepository.js`, `tuitionRepository.js`, `homeworkRepository.js`. |
| [`AcademicCalendar.jsx`](../frontend/src/features/academics/AcademicCalendar.jsx) & [`academicRepository.js`](../frontend/src/features/academics/academicRepository.js) | **Partial** (`StudentCalendar` fixed; Admin editing pending) | `BatchCalendar` still reads static empty `classDetails` from `studentSchedule.js` instead of `batches.class_time` & `batches.venue` from DB; Admin cannot edit `class_time`/`venue`; `AcademicPages.jsx` hidden `/grades` still passes `account.historyId`. | Iffat | **Preserve `StudentCalendar` fix in lines 84–100!** Wire `BatchCalendar` to `batches.class_time` and `batches.venue` (`listBatches()`); add Admin-only edit form calling `supabase.from('batches').update({ class_time, venue }).eq('id', batchId)`; update `BatchGrid`/parent via `reload()` or local state. Keep hidden `/grades` safe (`account.studentUuid`). |
| **Teacher Dashboard & Navigation** (`StaffDashboard.jsx`, `portalNavigation.jsx`) | **Partial** | `StaffDashboard.jsx` teacher summary is broken on sync stubs; Teacher Management route does not exist yet. | Iffat | Fix `TeacherSummary` in `StaffDashboard.jsx` (today/upcoming classes from DB `batches`, today's attendance completion across `get_teacher_roster()` + `listSessions()`, latest 3 homework items using `item.title` + `item.batchName`); verify Teacher nav routes (`/teacher`, `/teacher/attendance`, `/teacher/homework`, `/teacher/academic-calendar`, `/teacher/curriculum-*`) only show Teacher-permitted views and never query `monthly_tuition` or `students`. |
| **Teacher Management & 1-Click Approval** (`TeacherManagement.jsx`, `teacherRepository.js`, `portalNavigation.jsx`, `useLiveAuth.js`, migrations) | **Implemented** | Fixed the missing database objects that made the page fail with `PGRST202`/`PGRST205`. Added teacher editing and an Admin-only access-history panel. | Iffat | Applied migrations `202611250003_teacher_management_and_audit.sql` and `202611270003_teacher_management_edit_audit.sql`; `TeacherManagement.jsx` still lives at `/admin/teachers`, and `useLiveAuth.js` keeps its session-refresh role update. |
| [`CurriculumAnalysis.jsx`](../frontend/src/features/academics/CurriculumAnalysis.jsx) | **Legacy (`localStorage`)** | Still loads `curriculumSkills.js` `localStorage` and shows Admin Edit/Delete forms & modal dialogs. | Iffat | Remove `curriculumSkills.js` usage and all Edit/Delete UI/state. Render a static frontend image (under `frontend/public/` or `src/assets/`) plus a clear **"Feature coming soon"** alert banner for all roles (`admin`, `teacher`, `student`). Zero DB or `localStorage` calls. |
| [`portalNavigation.jsx`](../frontend/src/app/portalNavigation.jsx) | **Pending cleanup** | `Online Payment` (`online-payment`) and `Bayan Wi-Fi` (`bayan-wifi`) are still visible in sidebar; `/admin/export` and `/admin/teachers` routes are not registered. | Iffat | Hide `online-payment` and `bayan-wifi` from sidebar (`hiddenFromSidebar: true` — matches existing pattern on `grades` & `tuition-fee-waiver`). Register `/admin/teachers` (`TeacherManagement`) and `/admin/export` (`AdminExport`) strictly inside `if (role === 'admin')`. |
| `AdminExport.jsx` *(new)* & `frontend/package.json` | **Not Started** | File does not exist; `fflate` not yet installed in `frontend/package.json`. | Iffat | Install `fflate`; build Admin-only `/admin/export` supporting **Complete Institute Data**, **Selected Billing Month (`YYYY-MM`)**, and **Custom Date Range (`from_date`..`to_date` in `Asia/Dhaka`)**; export UTF-8 BOM RFC-4180 CSVs (`batches.csv`, `students.csv`, `attendance_sessions.csv`, `attendance_marks.csv`, `monthly_tuition.csv`, `homework_assignments.csv`) + `manifest.json` inside `al-bayan-export-YYYY-MM-DD.zip`; prefix formula characters (`=`, `+`, `-`, `@`, `\t`, `\r`) with `'`; display backup disclaimer notice. |
| [`CurriculumDetails.jsx`](../frontend/src/features/academics/CurriculumDetails.jsx) | **Complete (Static)** | None. | Shared (Static) | Verify 12-book grid & cover fallback remain intact; do not convert to DB. |
| Teacher Attendance & Homework (`StaffAttendance.jsx`, `HomeworkPages.jsx`), Admin Student Mgmt & Account Linking (`StudentManagement.jsx`), Pending Screen (`App.jsx`) | **Implemented (Prerelease Browser QA Pending)** | Implemented by Day 1 & Mostofa PR #2; live authenticated browser click-through still pending. | Pramit / Mostofa *(Do not rewrite)* | Preserve existing code. Include in end-to-end Staging browser regression QA once deployed. |

---

## 5. Teacher Approval Architecture — APPROVED DECISION (Option 2)

> [!IMPORTANT]
> **Approved Architectural Decision (Do Not Redesign):** Option 2 (**Teacher Listing & 1-Click Approval in Admin UI**) is officially approved and locked. Do not invent a self-signup teacher workflow or allow frontend role escalation.

### Approved Workflow (10 Steps)
1. A teacher signs in using Google (`/sign-in` OAuth PKCE).
2. The account is authenticated in `auth.users` but has no row in `public.user_roles`.
3. The user sees the pending-access screen (`PendingAccessScreen` in `App.jsx`).
4. An authorized Admin opens Teacher Management (`/admin/teachers`) and views pending Google accounts.
5. The Admin sees only the minimum necessary fields (`user_id`, `email`, `full_name`, `created_at`) to verify identity.
6. The Admin enters/confirms the verified name + optional `staff_code` and clicks **Approve as Teacher**.
7. The database `SECURITY DEFINER` RPC validates the caller (`auth.uid()` is `'admin'`) and target `auth.users` row, and assigns `role = 'teacher'` in `public.user_roles` plus an audit log record.
8. The teacher refreshes their session (`TOKEN_REFRESHED` / **Check access again** / page reload) or reauthenticates.
9. `loadProfile()` returns `role: 'teacher'`, and `App.jsx` routes them into `/teacher`.
10. If revoked later via **Revoke teacher access**, the user's `public.user_roles` teacher row is removed cleanly (losing access immediately on next refresh/request) while preserving `auth.users` and all historical `homework_assignments.published_by`, `attendance_sessions.created_by`, and `attendance_marks.marked_by` references.

### Ten Mandatory Security Requirements
1. **No unnecessary schema changes:** Reuse `public.user_roles` (`role IN ('admin', 'teacher', 'student')`, `staff_code`, `full_name`, `student_id IS NULL`). Do not add unnecessary columns to `public.user_roles`; expose teacher emails via an Admin-only `SECURITY DEFINER` read RPC (`list_teacher_accounts()`) joining `user_roles` with `auth.users`.
2. **Server-side admin authorization via `auth.uid()`:** Both `link_teacher_account` and `unlink_teacher_account` must check caller authorization on the server using `auth.uid()` / `public.current_user_role() = 'admin'` (`42501` otherwise). Never trust frontend route/role flags.
3. **Least-privilege `list_pending_auth_users()`:** Keep restricted strictly to Admin (`current_user_role() = 'admin'`) and expose only `(user_id, email, full_name, created_at)` for unlinked non-deleted `auth.users`.
4. **Duplicate & target validation:** Validate `p_user_id IS NOT NULL`, lock `auth.users` (`deleted_at IS NULL FOR UPDATE`, else `P0002`), reject existing `'teacher'` (`23505`), reject modifying `'admin'` or linked `'student'` (`23514`), and prevent case-insensitive duplicate `staff_code` (`23505`).
5. **Non-destructive revocation:** `unlink_teacher_account` deletes only the `'teacher'` row from `public.user_roles` (rejecting non-teachers / `'admin'` / self-revocation), preserving all historical attendance/homework records.
6. **Zero breakage to student linking:** Keep `link_student_account()`, `unlink_student_account()`, and all `students`/`user_roles` RLS policies intact.
7. **Cross-role isolation:** Verify students cannot access other students' private records and teachers cannot access `students` direct `SELECT`, `monthly_tuition`, `user_roles` of others, `role_audit_logs`, or Admin RPCs.
8. **Session refresh pickup:** Update `useLiveAuth.js` so `TOKEN_REFRESHED` and `USER_UPDATED` auth events silently trigger `loadProfile()` in the background, ensuring `supabase.auth.refreshSession()` picks up newly approved or revoked roles without disrupting unchanged active sessions.
9. **Tamper-evident audit logging:** Create an append-only `public.role_audit_logs` table (`id`, `actor_user_id`, `target_user_id`, `action` in `('approve_teacher', 'revoke_teacher')`, `role`, `details jsonb`, `created_at`) with RLS enabled, `SELECT` for Admin only, and **all client `INSERT`/`UPDATE`/`DELETE` revoked** so only `SECURITY DEFINER` RPCs can append audit rows.
10. **SQL-Editor-only Admin creation:** Never allow public signup or any frontend/RPC endpoint to assign `role = 'admin'`. Admin provisioning remains strictly in Supabase SQL Editor per [`AUTH_SETUP.md`](../frontend/AUTH_SETUP.md).

### Pre-Implementation Inspection & Conflict-Check Requirement
Before writing Option 2 code, inspect `202611230001_phase2_core_and_backfill.sql`, `public.user_roles`, `list_pending_auth_users()`, `link_student_account()`, `unlink_student_account()`, `supabaseAuth.js`, `useLiveAuth.js`, and `App.jsx` on current `main`, verify no conflicting migrations exist (use `202611240001_teacher_management_and_audit.sql` after `202611230005`), and confirm `role_audit_logs` + new RPCs leave student linking untouched.

### Required Option 2 Security Test Scenarios
- **Admin:** Lists pending users, approves pending user as teacher, lists active teachers, revokes teacher access, sees audit rows in `role_audit_logs`, cannot assign duplicate teacher/staff_code (`23505`), cannot touch admin or linked student (`23514`), cannot promote to `'admin'`, and existing student linking/unlinking still passes.
- **Approved Teacher:** Gains teacher access after session refresh/reauth, reads `batches` & `get_teacher_roster()`, manages homework/attendance, sees `0` direct `students` / `monthly_tuition` / `role_audit_logs` rows, fails `42501` on all Admin RPCs, and loses access immediately after revocation while historical records persist.
- **Linked Student:** Reads only own profile, attendance, tuition, and batch homework; unaffected by teacher approval/revocation; fails `42501` on teacher/admin RPCs.
- **Unauthorized / Pending / Anonymous:** `0` domain rows; `42501` on `list_pending_auth_users`, `list_teacher_accounts`, `link_teacher_account`, `unlink_teacher_account`; direct writes to `role_audit_logs` and `user_roles` fail `42501`.

---

## 6. Exact Dependency-Aware Implementation Order

1. **Read & Sync:** Pull latest merged `main` (containing `fix/phase2-migrations-and-qa`), read this document, `DATABASE_DESIGN.md`, and `DAY1_FOUNDATION_HANDOFF.md`.
2. **Inspect Live Codebase:** Inspect `user_roles`, `202611230001`–`202611230005`, `supabaseAuth.js`, `useLiveAuth.js`, `StaffDashboard.jsx`, `AcademicCalendar.jsx`, `portalNavigation.jsx`, and `CurriculumAnalysis.jsx`. Confirm no conflicts.
3. **Migrate `StaffDashboard.jsx`:** Replace `readRoster()`, `readSessions()`, `readTuition()`, `readHomework()`, and `academicCalendar()` with real async repositories (keeping Teacher excluded from `monthly_tuition`); remove transitional `read*` stubs from the 4 repositories once no callers remain.
4. **Implement Option 2 (Teacher Listing & 1-Click Approval):** Apply `202611250003_teacher_management_and_audit.sql` (`role_audit_logs`, `list_teacher_accounts`, `link_teacher_account`, `unlink_teacher_account`), then `202611270003_teacher_management_edit_audit.sql` (edit RPC + audit reader), keep `useLiveAuth.js` (`TOKEN_REFRESHED`/`USER_UPDATED`), maintain `teacherRepository.js` + `TeacherManagement.jsx` (including edit and history), and keep `/admin/teachers` registered in `portalNavigation.jsx`.
5. **Verify Teacher Dashboard & Navigation:** Confirm `/teacher` shortcuts, Teacher `StaffDashboard`, `StaffAttendance`, `HomeworkPages`, and `AcademicCalendar` work without calling `monthly_tuition` or direct `students`.
6. **Complete `AcademicCalendar.jsx` Admin Editing:** Add Admin `class_time` & `venue` editing to `BatchCalendar` + `academicRepository.js` **without overwriting the `StudentCalendar` fix**.
7. **Complete `CurriculumAnalysis.jsx` & `portalNavigation.jsx` Cleanup:** Convert `CurriculumAnalysis.jsx` to static image + `"Feature coming soon"` banner; hide `Online Payment` and `Bayan Wi-Fi` from sidebar.
8. **Build `AdminExport.jsx` (`fflate`):** Install `fflate`, implement 6-CSV + `manifest.json` ZIP export with formula escaping and backup disclaimer, and register `/admin/export`.
9. **Regenerate Types & Run Full QA:** Regenerate `frontend/src/types/database.types.ts` (UTF-8 without BOM), run `npm run build`, run local SQL + GoTrue JWT security tests (including all Option 2 scenarios), and run authenticated browser QA on Staging once Google OAuth is configured.
10. **Publish Final Module Completion Report** with explicit `PASS` / `FAIL` / `BLOCKED` / `NOT TESTED` evidence.

---

## 7. Files That Must Not Be Casually Overwritten

- **Migrations `202611200001` through `202611230005`:** Never edit existing applied/verified migrations (`202611230001`–`0005`); teacher management uses the forward migrations `202611250003_teacher_management_and_audit.sql` and `202611270003_teacher_management_edit_audit.sql`.
- **Auth & Student Linking Core:** `App.jsx`, `supabaseAuth.js`, `MyProfile.jsx`, `list_pending_auth_users`, `link_student_account`, `unlink_student_account`, and `StudentManagement.jsx` Google account linking panel. (In `useLiveAuth.js`, add only the non-disruptive `TOKEN_REFRESHED`/`USER_UPDATED` refresh—preserve PKCE cleanup and `userId` caching.)
- **Student Calendar Fix:** `StudentCalendar` in `AcademicCalendar.jsx` (lines 84–100).
- **Shared Batch/Homework Layer:** `AdminBatchPage.jsx`, `BatchGrid.jsx`, `batchRepository.js`, `HomeworkPages.jsx`, `homeworkRepository.js`.
- **Shared Utility Exports:** `frontend/src/demo.js` (`formatDate`) and `frontend/src/features/roster/demoRoster.js` (until verified unused across all pages).
- **Production Auth Config:** `frontend/vercel.json`, `frontend/supabase/config.toml`, hosted Supabase Google OAuth / URL settings.

---

## 8. Acceptance Checklist

| Module / Feature | Current Status | Verification Target for Sign-Off |
|---|---|---|
| Core Auth, Batches, Homework (`Day 1`) | **PASS (Local SQL/API/Build)** · **NOT TESTED (Live Google OAuth Browser)** | Staging Google OAuth round-trip + UI smoke check |
| Attendance Migrations & RLS (`202611230005` fixed) | **PASS (Local SQL + Live JWT `.upsert()` + Build)** | Authenticated `/admin/attendance` & `/teacher/attendance` browser check |
| Roster, CSV Import, Student Linking (`StudentManagement`) | **PASS (Local SQL + Live JWT API + Build)** | Authenticated `/admin/students` CSV upload & Google link/unlink browser click-through |
| Tuition (`AdminTuition` w/ search/filters/cards & `StudentTuition`) | **PASS (Local SQL + Live JWT API + SSR + Build)** | Authenticated browser click-through on all 4 Admin modes & Student Ledger |
| `AcademicCalendar` (`StudentCalendar`) | **PASS (SSR + Build)** · **NOT TESTED (Authenticated Browser)** | Authenticated Active & Former student calendar check |
| `AcademicCalendar` (`BatchCalendar` time/venue edits) | **NOT TESTED (Pending Iffat)** | Admin edits `class_time`/`venue`, reloads, Teacher & Active Student see update |
| `StaffDashboard.jsx` | **BLOCKED (Pending Iffat)** | Loads live Admin & Teacher summaries with 0 console/RLS errors |
| Option 2 Teacher Listing & 1-Click Approval (plus edit/history) | **Code complete; hosted verification pending** | All 4 security scenarios + `role_audit_logs` + `TOKEN_REFRESHED`; Admin can approve, edit, revoke and read the audit panel |
| `CurriculumAnalysis.jsx` & Sidebar Cleanup | **NOT TESTED (Pending Iffat)** | Static image + "Feature coming soon" bar; `Online Payment` & `Bayan Wi-Fi` hidden |
| `AdminExport.jsx` (`6`-CSV ZIP) | **NOT TESTED (Pending Iffat)** | Complete/Month/Range ZIP opens cleanly in Excel; formula escaping verified; Teacher/Student denied |

---

## 9. Known Blockers & Untested Areas

1. **Blocked UI Page:** `StaffDashboard.jsx` displays `"Dashboard records could not be loaded. Refresh to try again."` until migrated from the 4 transitional synchronous `read*` stubs to async repositories.
2. **Hosted Supabase Migration Gap:** `202611230003`, `202611230004`, and `202611230005` are verified locally but must be pushed via `supabase db push` to hosted Staging/Production (never `db reset`) before live Tuition/Attendance/CSV features work online.
3. **Google OAuth & Interactive Browser Testing:** Interactive Google OAuth redirects and authenticated multi-role browser click-throughs remain `NOT TESTED` locally (external Google Cloud credentials exist only on hosted environments).
4. **Legacy Null Emails:** Unlinked legacy Phase 1 students remain nullable until Admin email backfill and post-rollout `202611230006_finalize_legacy_cleanup.sql`.

---

## 10. Instructions for Iffat's AI Agent

> Start by reading this document and inspecting the current merged `main` branch. Do not assume the implementation described in the document is still identical to the current repository. Verify the code before modifying it. Work only on the assigned modules, preserve existing behavior, and report conflicts before making structural changes.

- Never commit `.env.local`, `service_role` keys, or local scratch scripts containing test credentials.
- Never run `supabase db reset` or `seed.sql` against hosted Staging or Production databases.
- Always regenerate `frontend/src/types/database.types.ts` as UTF-8 without BOM (with zero trailing whitespace) after adding the teacher-management migrations, and verify `npm run build` and `git diff --check` before opening a PR.
