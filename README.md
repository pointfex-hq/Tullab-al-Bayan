# Ṭullāb al-Bayān

### Arabic language learning and institute management portal

**Developed by Team Helium**

**Live portal** [Ṭullāb al-Bayān on Vercel](https://tullab-al-bayan.vercel.app/sign-in)

Ṭullāb al-Bayān is Al Bayan Institute’s Arabic language learning portal. It gives students, teachers, and administrators separate workspaces for managing classes, homework, attendance, and tuition across seven weekday batches.

## Contributor Credits and Branch History

| Contributor | Source branch | Contribution |
| --- | --- | --- |
| Iffat Jahan | `feat/frontend-polish-export` | Staff dashboards, teacher approvals, calendar editing, curriculum skills, Admin Export, and Online Payment |
| Pramit Datta | `feat/supabase-cli-auth-homework` | Supabase foundation, Google sign-in, batch data, and homework |
| Mostofa Mohi Uddin Ahmed | `feat/roster-tuition-attendance` | Student roster and CSV import, tuition and scholarships, and attendance |
| Jihad Mia | `fix/bug-sweep` | Portal redesign, application logging, and fixes including student email linking |

## 1. Key Capabilities

- **Student workspace (`/student`)** — View batch schedules, published homework, personal attendance, and monthly tuition. **Online Payment** provides bank and bKash transfer instructions. Admins record the status of received payments in Tuition Management.
- **Teacher workspace (`/teacher`)** — Open any of the seven batch calendars, manage homework for a batch, and record or correct attendance as Present, Late, Sick, or Absent.
- **Admin workspace (`/admin`)** — Manage the student roster, approve, edit and revoke teacher access, review the teacher access history, edit class time and venue, and manage monthly tuition and scholarships. Monthly tuition also downloads a tuition fee PDF filtered by billing period (month, range or all months) and batch. Teacher access changes write database audit entries.
- **Curriculum** — Browse the 12-book Arabic curriculum and read the four course skill descriptions. Admins can update skill descriptions for all workspaces.
- **Admin data export (`/admin/export`)** — Download a ZIP with six CSVs and a manifest for the full institute, a billing month, or a date range. Use separate Supabase database backups for recovery.

## 2. Architecture and Directory Structure

React Router manages workspaces in a Vite application styled with Tailwind CSS. Feature repositories use the authenticated Supabase client for PostgreSQL reads and writes. PostgreSQL row-level security and database functions enforce access by role. Scheduling and export boundaries use `Asia/Dhaka`.

```text
Tullab-al-Bayan/
├── frontend/
│   ├── src/
│   │   ├── app/                     # Routes, portal layout, and role-based navigation
│   │   ├── components/              # Shared UI components
│   │   ├── features/                # Academics, admin, attendance, auth, dashboards,
│   │   │                            # homework, roster, and tuition
│   │   ├── lib/                     # Logging and date formatting
│   │   ├── styles/                  # Shared styles and theme
│   │   └── types/                   # Database type definitions
│   ├── public/curriculum/covers/    # The 12 curriculum book covers
│   ├── supabase/
│   │   ├── migrations/             # Schema, policies, role functions, and seed rows
│   │   ├── scripts/                # Local database verification scripts
│   │   ├── config.toml              # Local Supabase configuration
│   │   └── seed.sql                 # Local sample data
│   ├── .env.example                 # Frontend configuration template
│   ├── AUTH_SETUP.md                # Supabase and Google sign-in guide
│   └── vercel.json                   # Client-side route rewrites
├── docs/                            # Database design, technical notes, and handoffs
└── README.md
```

## 3. Local Development Setup

### Prerequisites

- Node.js 22.12 or later and npm.
- A configured local or staging Supabase project. Running Supabase locally requires Docker and, on Windows, WSL 2.
- An approved Google test account for signed-in testing.

### Step 1. Clone and install

```sh
git clone https://github.com/pointfex-hq/Tullab-al-Bayan.git
cd Tullab-al-Bayan
cd frontend
npm ci
```

### Step 2. Configure Supabase and Google sign-in

Create `frontend/.env.local` and set the Supabase values for your environment. [Environment template](frontend/.env.example)

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | URL of your local or staging Supabase project |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable or legacy anon key for that project |

For a local database, start the stack from `frontend/` with `npx --yes supabase@3.2.0 start`. Follow the setup guide to configure the Google provider, register the callback and redirect URLs, and provision an initial Admin account. Keep service-role keys and database credentials on the server. [Supabase and Google sign-in setup](frontend/AUTH_SETUP.md)

### Step 3. Start the frontend

```sh
npm run dev
```

Open the development URL printed by Vite. The default is [http://localhost:5173/](http://localhost:5173/).

## 4. Verification and Testing

Run the production build from `frontend/` and the whitespace check from the repository root.

```sh
cd frontend
npm run build
cd ..
git diff --check
```

Use configured Supabase test accounts to verify sign-in redirects, attendance and homework permissions, student-only tuition visibility, and Admin access to teacher approvals and exports. The repository includes [local database verification scripts](frontend/supabase/scripts/).

## 5. Role-Based Access Control

Google OAuth with PKCE establishes identity. The app looks up the account’s approved role before opening its workspace. Signed-out visitors go to `/sign-in`. A signed-in account without institute access sees the pending-access screen.

| Role | Home | Attendance and homework | Tuition and institute administration |
| --- | --- | --- | --- |
| Student | `/student` | Own attendance and, while enrolled, homework for their batch | Read own tuition records and payment instructions |
| Teacher | `/teacher` | Record attendance and manage homework across batches using the staff roster view | No tuition or institute management access |
| Admin | `/admin` | View and manage attendance and homework across batches | Manage roster, teacher access, tuition, scholarships, and exports |

An Admin can approve, edit and revoke a teacher from **Teacher Management** and review every change in its access-history panel. Students can link to an unlinked roster record through a matching verified Google email or have an Admin link the account. Former students retain access to their own profile and historical attendance and tuition.

## 6. Deploying to Vercel

Connect the repository to a Vercel project and configure it for the frontend build.

| Setting | Value |
| --- | --- |
| Root Directory | `frontend` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Set the two `VITE_SUPABASE_*` variables for the intended Preview or Production environment. Register each deployment’s exact `/sign-in` URL in Supabase Auth. The checked-in [Vercel routing configuration](frontend/vercel.json) serves the React app on direct workspace URLs.

## Project Documentation

- [Database design](docs/DATABASE_DESIGN.md)
- [Technology stack](docs/TECH_STACK.md)
- [Foundation handoff](docs/DAY1_FOUNDATION_HANDOFF.md)
