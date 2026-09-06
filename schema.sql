-- Money Manager production database schema for PostgreSQL/Supabase.
-- IMPORTANT: enable RLS on every user-owned table and never authorize using a client-supplied user_id.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Personal User',
  currency text not null default 'INR' check (currency in ('INR','USD','EUR','GBP')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('Bank','Cash','UPI','Credit Card','Investment')),
  opening_balance numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  title text not null,
  category text not null,
  amount numeric(14,2) not null check (amount > 0),
  type text not null check (type in ('income','expense')),
  transaction_date date not null,
  note text,
  task_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  month date not null,
  amount numeric(14,2) not null check (amount >= 0),
  unique(user_id, category, month)
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(14,2) not null check (target_amount > 0),
  saved_amount numeric(14,2) not null default 0 check (saved_amount >= 0),
  target_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  amount numeric(14,2) not null default 0 check (amount >= 0),
  due_date date not null,
  category text not null default 'Planning',
  done boolean not null default false,
  create_expense_on_complete boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(14,2) not null check (amount > 0),
  cycle text not null check (cycle in ('Weekly','Monthly','Quarterly','Yearly')),
  next_date date not null,
  category text not null default 'Subscription',
  created_at timestamptz not null default now()
);

-- RLS: each authenticated user can only access rows whose user_id equals auth.uid().
do $$ declare t text; begin
  foreach t in array array['profiles','accounts','transactions','budgets','goals','tasks','subscriptions'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

create policy "profiles_owner_select" on public.profiles for select using (id = auth.uid());
create policy "profiles_owner_insert" on public.profiles for insert with check (id = auth.uid());
create policy "profiles_owner_update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "accounts_owner_all" on public.accounts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "transactions_owner_all" on public.transactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "budgets_owner_all" on public.budgets for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "goals_owner_all" on public.goals for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "tasks_owner_all" on public.tasks for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "subscriptions_owner_all" on public.subscriptions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Defense in depth: prevent cross-user account references.
create or replace function public.enforce_transaction_account_owner()
returns trigger language plpgsql security invoker as $$
begin
  if new.account_id is not null and not exists (
    select 1 from public.accounts a where a.id = new.account_id and a.user_id = auth.uid()
  ) then
    raise exception 'account does not belong to authenticated user';
  end if;
  return new;
end; $$;

drop trigger if exists transaction_account_owner on public.transactions;
create trigger transaction_account_owner before insert or update on public.transactions
for each row execute function public.enforce_transaction_account_owner();

-- New-user profile trigger.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'display_name','Personal User')) on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Recommended indexes.
create index if not exists accounts_user_id_idx on public.accounts(user_id);
create index if not exists transactions_user_date_idx on public.transactions(user_id, transaction_date desc);
create index if not exists budgets_user_month_idx on public.budgets(user_id, month);
create index if not exists goals_user_id_idx on public.goals(user_id);
create index if not exists tasks_user_due_idx on public.tasks(user_id, due_date);
create index if not exists subscriptions_user_next_idx on public.subscriptions(user_id, next_date);
create index if not exists transactions_task_id_idx on public.transactions(task_id);
