-- PaperPay Database Schema
-- Run this entire file in Supabase SQL Editor

-- Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users primary key,
  full_name text,
  email text,
  kyc_status text default 'pending',
  role text default 'user',
  created_at timestamptz default now()
);

-- Balances per user per currency
create table balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  currency text,
  amount numeric default 0,
  updated_at timestamptz default now()
);

-- Transactions
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  type text,                    -- deposit | swap | withdrawal
  status text,                  -- pending | deposit_confirmed | swap_requested | swap_processing | swap_sent | complete | failed
  currency_in text,
  currency_out text,
  amount_in numeric,
  amount_out numeric,
  rate numeric,
  rate_mode text,               -- instant | locked
  payment_reference text unique,
  wallet_address text,
  txn_hash text,
  incoming_hash text,           -- Melvin → PaperPay wallet
  outgoing_hash text,           -- PaperPay wallet → user wallet
  clearing_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Comms log
create table comms_log (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id),
  channel text,                 -- email | whatsapp | inapp
  direction text,               -- outbound | inbound
  recipient text,
  content text,
  sent_at timestamptz default now()
);

-- Row Level Security
alter table profiles enable row level security;
alter table balances enable row level security;
alter table transactions enable row level security;
alter table comms_log enable row level security;

-- RLS Policies
create policy "Users see own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users see own balances"
  on balances for select using (auth.uid() = user_id);

create policy "Users see own transactions"
  on transactions for select using (auth.uid() = user_id);

create policy "Service role full access to profiles"
  on profiles for all using (auth.role() = 'service_role');

create policy "Service role full access to balances"
  on balances for all using (auth.role() = 'service_role');

create policy "Service role full access to transactions"
  on transactions for all using (auth.role() = 'service_role');

create policy "Service role full access to comms_log"
  on comms_log for all using (auth.role() = 'service_role');

-- Auto-create profile + balances on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );

  insert into balances (user_id, currency, amount) values (new.id, 'GBP', 0);
  insert into balances (user_id, currency, amount) values (new.id, 'EUR', 0);
  insert into balances (user_id, currency, amount) values (new.id, 'USD', 0);
  insert into balances (user_id, currency, amount) values (new.id, 'USDT', 0);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- After first signup, set admins (or use: npm run promote:admins):
-- update profiles set role = 'admin' where lower(email) in ('lee@paperless.money','ops@paperless.money');
