-- Run in Supabase → SQL Editor after `profiles` exists (see docs/schema.sql).
-- Grants ClearDesk (/admin) access for these accounts (same login as PaperPay).

update public.profiles
set role = 'admin'
where lower(email) in (
  'lee@paperless.money',
  'ops@paperless.money'
);
