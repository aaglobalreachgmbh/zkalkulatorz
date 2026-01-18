-- 20240101_init.sql
-- THE IRON VAULT: INIT MIGRATION

-- 1. ENABLE RLS (Active Defense)
-- All tables created must have RLS enabled immediately.

-- 2. TARIFFS_PUBLIC (The Shop Window)
-- Visible to authenticated users.
create table public.tariffs_public (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  provider text not null, -- e.g. 'Vodafone'
  created_at timestamptz default now()
);
alter table public.tariffs_public enable row level security;

-- Policy: Authenticated users can READ public tariffs
create policy "Allow read access for authenticated users"
  on public.tariffs_public
  for select
  to authenticated
  using (true);

-- 3. TARIFFS_COMMERCIAL (The Vault)
-- LOCKED. NO API ACCESS. Linked 1:1 to public tariffs.
create table public.tariffs_commercial (
  tariff_id uuid primary key references public.tariffs_public(id) on delete cascade,
  cost_price_netto numeric(10, 4) not null, -- Precision for financial data
  margin_rule_json jsonb not null default '{}'::jsonb, -- Flexible margin logic
  commission_upfront numeric(10, 2) not null default 0,
  updated_at timestamptz default now()
);
alter table public.tariffs_commercial enable row level security;

-- Policy: DENY ALL. No policies created for 'anon' or 'authenticated'.
-- Only 'service_role' (Edge Functions) can bypass RLS to read this.

-- 4. CALCULATIONS (User Quotes)
create table public.calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  input_data jsonb not null, -- What the user asked for
  result_snapshot jsonb not null, -- The calculated offer (frozen)
  created_at timestamptz default now()
);
alter table public.calculations enable row level security;

-- Policy: Users can see THEIR OWN calculations only.
create policy "Users see own calculations"
  on public.calculations
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users create calculations"
  on public.calculations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 5. AUDIT_LOG (The Watcher)
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid, -- Nullable if system action
  action text not null,
  target_resource text not null,
  details jsonb,
  ip_address text,
  created_at timestamptz default now()
);
alter table public.audit_log enable row level security;

-- Policy: Append only by system/service_role. No user read access via API.
-- (Service Role bypasses RLS)
