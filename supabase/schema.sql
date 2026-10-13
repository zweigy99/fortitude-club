-- Fortitude Club database setup
-- Run this once in Supabase: SQL Editor > New query > paste > Run.

-- ---------- Tables ----------
create table if not exists public.employers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  email_domain text,              -- e.g. jamcrm.com; used to flag matching work emails in the admin queue
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  work_email text not null,
  employer_id uuid references public.employers(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  role text not null default 'member' check (role in ('member','admin')),
  member_number bigint generated always as identity (start with 1001),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Fitness',
  neighbourhood text,
  address text,
  website text,
  image_url text,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  title text not null,
  description text,
  terms text,
  -- How members redeem:
  --   'show_card' = show the digital card at the front desk
  --   'code'      = reveal a promo code after the member taps Redeem
  --   'link'      = send the member to the partner's booking page
  redeem_type text not null default 'show_card' check (redeem_type in ('show_card','code','link')),
  promo_code text,
  redeem_url text,
  active boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  employer_id uuid references public.employers(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists redemptions_offer_idx on public.redemptions(offer_id);
create index if not exists redemptions_created_idx on public.redemptions(created_at desc);

-- ---------- Helper functions ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_approved() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and status = 'approved');
$$;

-- Create a pending profile whenever someone signs up
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare emp uuid;
begin
  begin
    emp := nullif(new.raw_user_meta_data->>'employer_id', '')::uuid;
  exception when others then
    emp := null;
  end;
  insert into public.profiles (id, full_name, work_email, employer_id)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email, emp);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Row level security ----------
alter table public.employers enable row level security;
alter table public.profiles enable row level security;
alter table public.partners enable row level security;
alter table public.offers enable row level security;
alter table public.redemptions enable row level security;

drop policy if exists "employers readable" on public.employers;
create policy "employers readable" on public.employers for select using (active or public.is_admin());
drop policy if exists "employers admin" on public.employers;
create policy "employers admin" on public.employers for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "own profile or admin" on public.profiles;
create policy "own profile or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists "admin updates profiles" on public.profiles;
create policy "admin updates profiles" on public.profiles for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "partners readable" on public.partners;
create policy "partners readable" on public.partners for select using (active or public.is_admin());
drop policy if exists "partners admin" on public.partners;
create policy "partners admin" on public.partners for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "offers readable" on public.offers;
create policy "offers readable" on public.offers for select using (active or public.is_admin());
drop policy if exists "offers admin" on public.offers;
create policy "offers admin" on public.offers for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "approved members redeem" on public.redemptions;
create policy "approved members redeem" on public.redemptions for insert
  with check (user_id = auth.uid() and public.is_approved());
drop policy if exists "own redemptions or admin" on public.redemptions;
create policy "own redemptions or admin" on public.redemptions for select
  using (user_id = auth.uid() or public.is_admin());

-- ---------- Admin reporting ----------
create or replace function public.offer_redemption_stats()
returns table (offer_id uuid, offer_title text, partner_name text, total bigint, last_30_days bigint, unique_members bigint)
language sql stable security definer set search_path = public as $$
  select o.id, o.title, p.name,
         count(r.id),
         count(r.id) filter (where r.created_at >= now() - interval '30 days'),
         count(distinct r.user_id)
  from public.offers o
  join public.partners p on p.id = o.partner_id
  left join public.redemptions r on r.offer_id = o.id
  where public.is_admin()
  group by o.id, o.title, p.name
  order by 4 desc, 2;
$$;

create or replace function public.employer_stats()
returns table (employer_id uuid, employer_name text, approved_members bigint, pending_members bigint, redemptions bigint)
language sql stable security definer set search_path = public as $$
  select e.id, e.name,
    (select count(*) from public.profiles pr where pr.employer_id = e.id and pr.status = 'approved'),
    (select count(*) from public.profiles pr where pr.employer_id = e.id and pr.status = 'pending'),
    (select count(*) from public.redemptions r where r.employer_id = e.id)
  from public.employers e
  where public.is_admin()
  order by 2;
$$;

-- ---------- Starter data (edit or delete in the admin area) ----------
insert into public.employers (name, email_domain) values
  ('SALT', null),
  ('JAM', 'jamcrm.com')
on conflict (name) do nothing;

insert into public.partners (name, category, neighbourhood, address, website, description)
select * from (values
  ('STRONG Pilates', 'Fitness', 'Little Italy', '533 College St, Toronto', 'https://strongpilates.ca', 'Pilates-inspired classes that combine strength and cardio on the Rowformer.'),
  ('RCVRI', 'Recovery', 'Entertainment District', '8 Mercer St, Toronto', 'https://rcvri.co/en-ca', 'Science-backed recovery: sauna, cold plunge, red light and compression therapy.'),
  ('Totum Life Science', 'Health', 'King West', '445 King St W, Suite 101, Toronto', null, 'Training, physiotherapy, chiropractic and massage under one roof.')
) as v(name, category, neighbourhood, address, website, description)
where not exists (select 1 from public.partners);

-- Starter offers are created INACTIVE. Add the real details in Admin > Offers, then switch them on.
insert into public.offers (partner_id, title, description, redeem_type, active)
select p.id, 'Member offer at ' || p.name, 'Add the offer details in the admin area.', 'show_card', false
from public.partners p
where not exists (select 1 from public.offers);
