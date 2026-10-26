-- ===== Partner portal =====
alter table public.profiles add column if not exists partner_id uuid references public.partners(id) on delete set null;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('member','admin','employer','partner'));

create table if not exists public.partner_invites (
  email text primary key,
  partner_id uuid not null references public.partners(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.offer_requests (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  offer_id uuid references public.offers(id) on delete cascade,
  requested_by uuid references public.profiles(id) on delete set null,
  action text not null default 'edit' check (action in ('edit','new','pause','resume')),
  changes jsonb not null default '{}'::jsonb,
  note text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index if not exists offer_requests_status_idx on public.offer_requests(status, created_at desc);

create or replace function public.my_partner_id() returns uuid
language sql stable security definer set search_path = public as $$
  select partner_id from public.profiles where id = auth.uid() and role = 'partner';
$$;
grant execute on function public.my_partner_id() to authenticated;

alter table public.partner_invites enable row level security;
alter table public.offer_requests enable row level security;
drop policy if exists "invites admin" on public.partner_invites;
create policy "invites admin" on public.partner_invites for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "requests read" on public.offer_requests;
create policy "requests read" on public.offer_requests for select using (public.is_admin() or partner_id = public.my_partner_id());
drop policy if exists "requests partner insert" on public.offer_requests;
create policy "requests partner insert" on public.offer_requests for insert with check (partner_id = public.my_partner_id() and requested_by = auth.uid() and status = 'pending');
drop policy if exists "requests admin" on public.offer_requests;
create policy "requests admin" on public.offer_requests for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "partner sees own offers" on public.offers;
create policy "partner sees own offers" on public.offers for select using (partner_id = public.my_partner_id());
drop policy if exists "partner sees own record" on public.partners;
create policy "partner sees own record" on public.partners for select using (id = public.my_partner_id());
grant select, insert, update, delete on public.partner_invites, public.offer_requests to authenticated, service_role;

-- Partners edit only these fields of their own studio
create or replace function public.partner_update_details(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid := public.my_partner_id();
begin
  if pid is null then raise exception 'Not a partner account'; end if;
  update public.partners set
    description   = coalesce(p->>'description', description),
    neighbourhood = coalesce(p->>'neighbourhood', neighbourhood),
    address       = coalesce(p->>'address', address),
    hours         = coalesce(p->>'hours', hours),
    website       = coalesce(p->>'website', website),
    contact_email = coalesce(p->>'contact_email', contact_email),
    logo_url      = coalesce(p->>'logo_url', logo_url),
    photos        = coalesce(p->>'photos', photos)
  where id = pid;
end;
$$;
grant execute on function public.partner_update_details(jsonb) to authenticated;

-- Partner dashboard numbers
create or replace function public.partner_stats() returns json
language plpgsql stable security definer set search_path = public as $$
declare pid uuid := public.my_partner_id(); result json;
begin
  if pid is null then return null; end if;
  select json_build_object(
    'total', (select count(*) from redemptions r join offers o on o.id = r.offer_id where o.partner_id = pid),
    'last_30', (select count(*) from redemptions r join offers o on o.id = r.offer_id where o.partner_id = pid and r.created_at >= now() - interval '30 days'),
    'members', (select count(distinct r.user_id) from redemptions r join offers o on o.id = r.offer_id where o.partner_id = pid),
    'employers', (select count(distinct r.employer_id) from redemptions r join offers o on o.id = r.offer_id where o.partner_id = pid),
    'by_offer', coalesce((select json_agg(x order by x.n desc) from (
        select o.title, count(r.id) as n, count(r.id) filter (where r.created_at >= now() - interval '30 days') as n30
          from offers o left join redemptions r on r.offer_id = o.id where o.partner_id = pid group by o.id, o.title) x), '[]'::json),
    'by_month', coalesce((select json_agg(y order by y.month) from (
        select to_char(date_trunc('month', r.created_at), 'YYYY-MM') as month, count(*) as n
          from redemptions r join offers o on o.id = r.offer_id where o.partner_id = pid group by 1) y), '[]'::json)
  ) into result;
  return result;
end;
$$;
grant execute on function public.partner_stats() to authenticated;

-- Invited partner staff become partner accounts when they confirm their email
create or replace function public.auto_approve_verified() returns trigger
language plpgsql security definer set search_path = public as $$
declare emp_id uuid; dom text; inv record;
begin
  if new.email_confirmed_at is null then return new; end if;
  if tg_op = 'UPDATE' and old.email_confirmed_at is not null then return new; end if;
  select * into inv from public.partner_invites where email = lower(new.email);
  if found then
    update public.profiles set role = 'partner', partner_id = inv.partner_id, status = 'approved', reviewed_at = now(),
           approval_email_sent_at = coalesce(approval_email_sent_at, now())
     where id = new.id;
    return new;
  end if;
  dom := lower(split_part(new.email, '@', 2));
  select e.id into emp_id from public.employers e
   where e.active and e.auto_approve and e.email_domain is not null and e.email_domain <> ''
     and (dom = lower(e.email_domain) or dom like '%.' || lower(e.email_domain))
   limit 1;
  if emp_id is not null then
    update public.profiles set status = 'approved', employer_id = emp_id, reviewed_at = now()
     where id = new.id and status = 'pending';
  end if;
  return new;
end;
$$;

-- Logo / photo uploads
insert into storage.buckets (id, name, public) values ('partner-media', 'partner-media', true) on conflict (id) do nothing;
drop policy if exists "partner media upload" on storage.objects;
create policy "partner media upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'partner-media' and ((storage.foldername(name))[1] = public.my_partner_id()::text or public.is_admin()));
drop policy if exists "partner media read" on storage.objects;
create policy "partner media read" on storage.objects for select using (bucket_id = 'partner-media');

notify pgrst, 'reload schema';
select 'partner portal ready' as status;
