# Production deployment checklist

## Supabase
- Create a new project.
- Run `supabase/migrations/001_initial_schema.sql` once in SQL Editor.
- Confirm RLS is enabled on every user-owned table.
- Keep only the public/anon key in the frontend.
- Configure Auth email settings and redirect URLs for the deployed origin.
- Turn on MFA if the chosen Supabase plan/workflow supports your desired method.
- Configure database backups and review retention.

## Frontend
- Copy `.env.example` to `.env.local`.
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Run `npm install` then `npm run build`.
- Deploy the `dist/` folder to a static host.
- Use HTTPS.

## Before inviting users
- Test User A vs User B reads, updates and deletes.
- Test an account-reference attack where User A inserts a transaction using User B's account UUID.
- Test expired/invalid sessions.
- Test password reset and email confirmation.
- Enable rate limiting / WAF at the hosting layer.
- Run dependency/security scanning.
- Publish privacy policy and terms if distributing publicly.

The project intentionally does not claim that a frontend alone can guarantee zero security breaches. The database RLS layer is the primary user-isolation control.
