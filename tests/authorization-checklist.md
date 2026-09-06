# Authorization test checklist

These tests should be automated before production launch.

## Test setup
Create two separate auth users: `user_a` and `user_b`.

## Required assertions
1. User A can insert a transaction with `user_id = auth.uid()`.
2. User A can select their own transaction.
3. User A cannot select User B's transaction.
4. User A cannot update User B's transaction.
5. User A cannot delete User B's transaction.
6. User A cannot create a transaction whose `account_id` belongs to User B.
7. User A cannot update their transaction's `user_id` to User B.
8. Anonymous users cannot access user-owned rows.
9. Storage/receipt policies must enforce the same ownership rule.
10. Service-role credentials must never be shipped to the Mac/web client.

## Manual SQL sanity checks
Run queries as authenticated users in a controlled test environment and verify that RLS returns zero rows for another user's records. Do not disable RLS during application tests.
