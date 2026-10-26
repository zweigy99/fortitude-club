-- ===== Lead finder: Google Maps sourcing =====
alter table public.leads add column if not exists google_place_id text;
alter table public.leads add column if not exists rating numeric;
alter table public.leads add column if not exists review_count int;
alter table public.leads add column if not exists source text not null default 'manual';
create unique index if not exists leads_place_idx on public.leads(google_place_id) where google_place_id is not null;

create table if not exists public.lead_searches (
  id uuid primary key default gen_random_uuid(),
  area text not null,
  category text not null,
  last_run_at timestamptz,
  last_added int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.lead_searches enable row level security;
drop policy if exists "lead searches admin" on public.lead_searches;
create policy "lead searches admin" on public.lead_searches for all using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.lead_searches to authenticated, service_role;

update public.leads set source = 'prospect list' where source = 'manual' and created_at < now() - interval '1 minute';
notify pgrst, 'reload schema';
select count(*) as leads, count(*) filter (where source = 'prospect list') as from_prospect_list from public.leads;
