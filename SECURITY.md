# Security Notes

## Non-negotiable rules
1. Never expose Supabase service-role keys to the browser or desktop client.
2. Rely on PostgreSQL RLS for user isolation, not hidden UI controls.
3. Every user-owned table must have RLS enabled and policies based on `auth.uid()`.
4. Never accept a client-supplied owner/user ID as proof of authorization.
5. Validate monetary amounts, dates, categories and foreign keys server/database side.
6. Use HTTPS for all hosted traffic.
7. Keep dependencies patched and run automated vulnerability checks before releases.
8. Add MFA and rate limiting before opening the application to a broader audience.
9. Do not log passwords, auth tokens, financial payloads or sensitive personal information.
10. Test cross-user access explicitly before every production schema change.

## Threat-model checks
- User A attempts to SELECT User B rows: must return zero rows because of RLS.
- User A attempts to UPDATE User B rows: must affect zero rows / be rejected by policy.
- User A attempts to DELETE User B rows: must affect zero rows / be rejected by policy.
- User A inserts a transaction pointing to User B's account: trigger must reject it.
- Unauthenticated users must not access user-owned tables.
