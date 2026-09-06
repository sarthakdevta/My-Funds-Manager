#!/bin/sh
set -eu
FILE="$(dirname "$0")/../supabase/migrations/001_initial_schema.sql"
for table in profiles accounts transactions budgets goals tasks subscriptions; do
  grep -qi "alter table public.$table enable row level security" "$FILE"
done
for table in accounts transactions budgets goals tasks subscriptions; do
  grep -qi "$table.*user_id = auth.uid()\|user_id = auth.uid().*$table" "$FILE"
done
grep -qi "enforce_transaction_account_owner" "$FILE"
echo "Security schema checks passed."
