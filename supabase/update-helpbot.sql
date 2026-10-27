-- ===== Help bot: FAQs, chat log, rate limit =====
create table if not exists public.help_faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.chat_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  ip_hash text,
  question text not null,
  answer text,
  handoff boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists chat_logs_ip_idx on public.chat_logs(ip_hash, created_at desc);
alter table public.help_faqs enable row level security;
alter table public.chat_logs enable row level security;
drop policy if exists "faqs readable" on public.help_faqs;
create policy "faqs readable" on public.help_faqs for select using (true);
drop policy if exists "faqs admin" on public.help_faqs;
create policy "faqs admin" on public.help_faqs for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "chat logs admin" on public.chat_logs;
create policy "chat logs admin" on public.chat_logs for select using (public.is_admin());
grant select on public.help_faqs to anon, authenticated;
grant select, insert, update, delete on public.help_faqs, public.chat_logs to authenticated, service_role;

-- Logs a chat turn and returns how many questions this visitor asked in the last hour (for rate limiting)
create or replace function public.chat_log(p_ip text, p_question text, p_answer text, p_handoff boolean) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into public.chat_logs (user_id, ip_hash, question, answer, handoff) values (auth.uid(), p_ip, left(p_question, 2000), left(p_answer, 4000), p_handoff);
  select count(*) into n from public.chat_logs where ip_hash = p_ip and created_at > now() - interval '1 hour';
  return n;
end;
$$;
create or replace function public.chat_count(p_ip text) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.chat_logs where ip_hash = p_ip and created_at > now() - interval '1 hour';
$$;
grant execute on function public.chat_log(text, text, text, boolean) to anon, authenticated;
grant execute on function public.chat_count(text) to anon, authenticated;

insert into public.help_faqs (question, answer, sort_order)
select * from (values
 ('Who can join Fortitude Club?', 'Employees of companies that partner with Fortitude Club. Sign up at fortitudeclub.ca/signup with your work email and choose your employer. If your company isn''t listed, ask your HR team to contact us.', 1),
 ('How long does verification take?', 'If your employer uses automatic verification (for example SALT and JAM), your card switches on as soon as you click the confirmation link in your email. Otherwise the Fortitude team verifies you, usually within one business day.', 2),
 ('I didn''t get my confirmation email', 'Check your junk folder and, for work email, your company''s security quarantine. You can send a fresh link from fortitudeclub.ca/login by clicking "Didn''t get your confirmation email?". Links last 24 hours.', 3),
 ('How do I redeem an offer?', 'Sign in, open the offer on fortitudeclub.ca/offers and tap Redeem. You''ll see the promo code or booking steps. Bring your Fortitude membership card (fortitudeclub.ca/card) to your visit.', 4),
 ('Can I keep my card on my phone?', 'Yes. Open fortitudeclub.ca on your phone, sign in, and add it to your home screen (Share, then Add to Home Screen on iPhone). It opens straight to your card.', 5),
 ('Does Fortitude cost anything for employees?', 'No. Fortitude Club is provided through your employer. You only pay the partner''s discounted price for any paid offers.', 6),
 ('I forgot my password', 'Go to fortitudeclub.ca/login and click "Forgot your password?". We''ll email you a reset link.', 7),
 ('My company wants to join', 'Great! Employers can book a call or learn more at fortitudeclub.ca/employers, or email info@fortitudeclub.ca.', 8),
 ('I run a studio and want to partner', 'We''d love to hear from you. See fortitudeclub.ca/partners or email info@fortitudeclub.ca.', 9)
) v(question, answer, sort_order)
where not exists (select 1 from public.help_faqs);
notify pgrst, 'reload schema';
select count(*) as faqs from public.help_faqs;
