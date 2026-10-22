-- ===== Fortitude Club v2: stats, settings, partner pages, map, employer dashboard, announcements, partner reports =====
create table if not exists public.site_stats (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  value text not null,
  sort_order int not null default 0
);
create table if not exists public.site_settings (
  key text primary key,
  value text
);
alter table public.partners add column if not exists slug text;
alter table public.partners add column if not exists hours text;
alter table public.partners add column if not exists photos text;
alter table public.partners add column if not exists lat double precision;
alter table public.partners add column if not exists lng double precision;
alter table public.partners add column if not exists contact_email text;
create unique index if not exists partners_slug_idx on public.partners(slug);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  subject text not null, body text not null, audience text, recipients int not null default 0,
  sent_at timestamptz not null default now()
);
create table if not exists public.partner_reports (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade,
  period_label text, sent_to text, redemptions int not null default 0,
  sent_at timestamptz not null default now()
);

-- employer contacts (HR leads) get their own dashboard
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('member','admin','employer'));

alter table public.site_stats enable row level security;
alter table public.site_settings enable row level security;
alter table public.announcements enable row level security;
alter table public.partner_reports enable row level security;
drop policy if exists "stats readable" on public.site_stats;
create policy "stats readable" on public.site_stats for select using (true);
drop policy if exists "stats admin" on public.site_stats;
create policy "stats admin" on public.site_stats for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "settings readable" on public.site_settings;
create policy "settings readable" on public.site_settings for select using (true);
drop policy if exists "settings admin" on public.site_settings;
create policy "settings admin" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "announcements admin" on public.announcements;
create policy "announcements admin" on public.announcements for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "reports admin" on public.partner_reports;
create policy "reports admin" on public.partner_reports for all using (public.is_admin()) with check (public.is_admin());

grant select on public.site_stats, public.site_settings to anon, authenticated;
grant select, insert, update, delete on public.site_stats, public.site_settings, public.announcements, public.partner_reports to authenticated, service_role;

-- Employer dashboard numbers (admins: any employer; employer contacts: their own)
create or replace function public.employer_dashboard(p_employer uuid) returns json
language plpgsql stable security definer set search_path = public as $$
declare me record; result json;
begin
  select role, employer_id into me from public.profiles where id = auth.uid();
  if me is null or not (me.role = 'admin' or (me.role = 'employer' and me.employer_id = p_employer)) then
    return null;
  end if;
  select json_build_object(
    'employer', (select name from employers where id = p_employer),
    'approved', (select count(*) from profiles where employer_id = p_employer and status = 'approved'),
    'pending', (select count(*) from profiles where employer_id = p_employer and status = 'pending'),
    'redemptions_total', (select count(*) from redemptions where employer_id = p_employer),
    'redemptions_30d', (select count(*) from redemptions where employer_id = p_employer and created_at >= now() - interval '30 days'),
    'active_members_30d', (select count(distinct user_id) from redemptions where employer_id = p_employer and created_at >= now() - interval '30 days'),
    'by_offer', coalesce((select json_agg(x order by x.n desc) from (
        select o.title as offer, p.name as partner, count(*) as n
          from redemptions r join offers o on o.id = r.offer_id join partners p on p.id = o.partner_id
         where r.employer_id = p_employer group by o.title, p.name) x), '[]'::json),
    'by_month', coalesce((select json_agg(y order by y.month) from (
        select to_char(date_trunc('month', created_at), 'YYYY-MM') as month, count(*) as n
          from redemptions where employer_id = p_employer group by 1) y), '[]'::json)
  ) into result;
  return result;
end;
$$;
grant execute on function public.employer_dashboard(uuid) to authenticated;

-- Starter content (editable in Admin)
update public.partners set slug = regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g') where slug is null;
update public.partners set slug = trim(both '-' from slug);
update public.partners set lat = 43.6457, lng = -79.3896 where name = 'RCVRI' and lat is null;
update public.partners set lat = 43.6386, lng = -79.4196 where name = 'STRONG Pilates' and lat is null;
update public.partners set lat = 43.6448, lng = -79.3960 where name = 'Totum Life Science' and lat is null;
insert into public.site_stats (label, value, sort_order)
select * from (values ('Premium local partners', '3', 1), ('Partner offers', '6', 2), ('Employers on board', '2', 3)) v(label, value, sort_order)
where not exists (select 1 from public.site_stats);
insert into public.site_settings (key, value) values ('booking_link', '') on conflict (key) do nothing;
notify pgrst, 'reload schema';
