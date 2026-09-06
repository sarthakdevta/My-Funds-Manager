# Money Manager

A privacy-first personal finance dashboard designed to start as a personal Mac project and scale to multiple users.

## Features
- Authentication-ready login/signup with Supabase Auth.
- PostgreSQL schema with Row Level Security (RLS).
- User-isolated profiles, accounts, transactions, budgets, goals, tasks and subscriptions.
- Dashboard, transactions, accounts, budgets, goals, tasks, subscriptions, reports and settings.
- Local demo mode when Supabase variables are not configured.
- JSON backup/export and import for local testing.
- Responsive UI suitable for wrapping as a macOS desktop app later.

## Initialization status

The project is initialized as a working version 2.0.0 MVP with the core frontend, local demo mode, and Supabase security foundation in place.

### Initialized and available
- React 19 + Vite 7 frontend with responsive styling and Lucide icons.
- 9 application areas: Dashboard, Transactions, Accounts, Budget, Goals, Tasks, Subscriptions, Reports and Settings.
- 7 user-owned database tables: profiles, accounts, transactions, budgets, goals, tasks and subscriptions.
- Supabase Auth session handling, new-user profile creation, and authenticated data loading/saving.
- Row Level Security policies for every user-owned table, plus account-owner validation for transactions.
- Local demo account with seeded accounts, transactions, budgets, goals, tasks and subscriptions.
- Local browser persistence when Supabase is not configured.
- Transaction search and filtering, account balance calculation, budget progress, goal progress, reports and recurring-cost summaries.
- JSON workspace backup export and import.
- Security schema check script and deployment checklist.

### Still requires configuration before production use
- Create a Supabase project and run the initial migration.
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env.local`.
- Configure authentication email settings and redirect URLs.
- Deploy the built `dist/` directory over HTTPS.
- Complete the multi-user authorization, session, backup and security checks in [DEPLOYMENT.md](DEPLOYMENT.md).

The local demo is intended for UI testing only. It is not a secure place for real financial information.

## Run locally
Requirements: Node.js 20+ recommended.

```bash
npm install
npm run dev
```

Open the localhost URL printed by Vite.

### Demo mode
Without `.env.local`, the app uses a local UI-only demo account:
- Email: `demo@money.local`
- Password: `123456`

Do not enter real financial information in demo mode.

## Enable real multi-user authentication
1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/migrations/001_initial_schema.sql`.
4. Copy `.env.example` to `.env.local`.
5. Add your Supabase URL and anon/publishable key.
6. Restart Vite.
7. Create a real account through the app.

The frontend only uses the public/anon key. Never put a Supabase service-role key in the frontend or `.env` values beginning with `SUPABASE_SERVICE_ROLE` in a client build.

## Security model
The database is the security boundary. All user-owned tables have RLS policies based on `auth.uid()`. The client never selects another user's `user_id` as an authorization mechanism. Transactions also have a defense-in-depth trigger preventing a transaction from referencing an account owned by another authenticated user.

For a public release, add server-side rate limiting/WAF, error monitoring without sensitive payloads, verified email policy, MFA, backups, dependency scanning, security headers, privacy policy/terms, and a tested incident-response process.

## macOS app
The current UI is web-based so it can be tested quickly. Once the cloud/auth flow is verified, it can be packaged as a native-looking macOS app using a WebKit wrapper or rebuilt in SwiftUI against the same backend. Keep the backend/database as the source of truth for multi-device and multi-user data.
