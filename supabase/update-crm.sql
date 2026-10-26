-- ===== Fortitude Club CRM: leads, activity, email templates, unsubscribe =====
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  neighbourhood text,
  address text,
  phone text,
  email text,
  contact_name text,
  website text,
  why text,
  notes text,
  stage text not null default 'new' check (stage in ('new','contacted','follow_up','meeting','negotiating','signed','not_now')),
  owner text,
  next_follow_up date,
  last_contacted_at timestamptz,
  do_not_contact boolean not null default false,
  unsub_token uuid not null default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists leads_stage_idx on public.leads(stage);
create unique index if not exists leads_name_idx on public.leads(lower(name));

create table if not exists public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  kind text not null default 'note',
  subject text,
  body text,
  created_at timestamptz not null default now()
);
create index if not exists lead_activities_lead_idx on public.lead_activities(lead_id, created_at desc);

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  body text not null,
  sort_order int not null default 0
);

alter table public.leads enable row level security;
alter table public.lead_activities enable row level security;
alter table public.email_templates enable row level security;
drop policy if exists "leads admin" on public.leads;
create policy "leads admin" on public.leads for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "lead activities admin" on public.lead_activities;
create policy "lead activities admin" on public.lead_activities for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "templates admin" on public.email_templates;
create policy "templates admin" on public.email_templates for all using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.leads, public.lead_activities, public.email_templates to authenticated, service_role;

-- Public unsubscribe link (CASL): marks the lead as do-not-contact
create or replace function public.unsubscribe_lead(p_token uuid) returns text
language plpgsql security definer set search_path = public as $$
declare n text;
begin
  update public.leads set do_not_contact = true, updated_at = now() where unsub_token = p_token returning name into n;
  if n is not null then
    insert into public.lead_activities (lead_id, kind, subject)
      select id, 'unsubscribe', 'Unsubscribed from outreach emails' from public.leads where unsub_token = p_token;
  end if;
  return n;
end;
$$;
grant execute on function public.unsubscribe_lead(uuid) to anon, authenticated;

insert into public.site_settings (key, value) values
  ('outreach_from_name', 'Hayden from Fortitude Club'),
  ('outreach_from_email', 'hello@fortitudeclub.ca'),
  ('outreach_reply_to', 'info@fortitudeclub.ca'),
  ('business_address', 'Fortitude Club, Toronto, ON')
on conflict (key) do nothing;

insert into public.email_templates (name, subject, body, sort_order)
select * from (values
 ('1. First email', 'Fortitude Club x {{studio}}',
  E'Hi {{first_name}},\n\nI''m {{sender}} from Fortitude Club. We connect Toronto employers with premium local wellness studios, so their employees get exclusive offers at places like yours.\n\nWe''d love to feature {{studio}} to members working nearby. Partners list one intro offer (for example a free first class or session) and members book through your own system, so nothing changes at your front desk.\n\nCurrent partners include STRONG Pilates, RCVRI and Totum Life Science. Would you be open to a 15-minute chat this week?\n\nThanks,\n{{sender}}', 1),
 ('2. Follow-up (after 5 days)', 'Re: Fortitude Club x {{studio}}',
  E'Hi {{first_name}},\n\nJust floating this back to the top of your inbox. A Fortitude listing is free to start: one intro offer, no fees, and you can pause it any time.\n\nHappy to drop by {{studio}} in person if that''s easier.\n\n{{sender}}', 2),
 ('3. Final follow-up', 'Should I close the loop?',
  E'Hi {{first_name}},\n\nI don''t want to crowd your inbox, so this is my last note for now. If a free intro-offer listing for local employees ever sounds useful for {{studio}}, just reply and I''ll set it up.\n\nAll the best,\n{{sender}}', 3),
 ('4. After an in-person visit', 'Great to meet you at {{studio}}',
  E'Hi {{first_name}},\n\nThanks for taking the time today. As promised, here''s a quick recap:\n\n- Fortitude members are employees of our partner companies, verified through their work email.\n- You choose the offer (e.g. first class free) and members book through your own system.\n- You get a monthly report of how many members redeemed with you.\n\nIf you send me the offer and a logo, I''ll have {{studio}} live on fortitudeclub.ca within a day.\n\n{{sender}}', 4)
) v(name, subject, body, sort_order)
where not exists (select 1 from public.email_templates);

insert into public.leads (name, category, address, phone, email, website, why) values

  ('Ritual Beauty & Wellness','Recovery','571 Wellington St W','416-306-0040',null,'https://ritual.ca','Independent sauna, cold plunge and spa with a strong community focus. Rated 4.8 (546 reviews).'),
  ('Well BYND Wellness Clinic','Recovery','460 Richmond St W, Suite 500','416-504-2269',null,'https://wellbynd.com','Naturopathy, acupuncture, lymphatic massage, infrared sauna and yoga under one roof.'),
  ('Othership Adelaide (local chain)','Recovery','425 Adelaide St W','416-361-0101',null,'https://othership.us/adelaide','Toronto-founded; rated 4.9 (1,400+ reviews). Direct competitor to RCVRI, so check with Ashley first.'),
  ('Tonic Spa at Sweat and Tonic (local chain)','Recovery','486 Front St W (The Well)','647-477-0539',null,'https://sweatandtonic.com','Hot/cold suite, red light, cryotherapy and IV therapy. Pitch together with the fitness side.'),
  ('Löyly Floating Sauna','Recovery','Queens Quay (moored on the waterfront)',null,null,null,'Unique wooden sauna barge. Contact details not confirmed; walk-up visit.'),
  ('REFINED Reformer + Fit Factory Downtown (local chain)','Pilates & movement','373 King St W','647-693-1455 (REFINED) / 416-900-0362 (Fit Factory)','info@refinedreformer.com',null,'Two brands at one address, so potentially one pitch for both. Fit Factory has 1,200+ reviews.'),
  ('Spark Pilates','Pilates & movement','487 Adelaide St W, #201','437-332-7779',null,'https://sparkpilates.com','Classical Pilates with privates and duets. Rated 5.0.'),
  ('CORE Studio Pilates','Pilates & movement','56 Stewart St',null,null,'https://corestudio.ca','Owner-run classical reformer and tower studio with small classes. Owner: Monica.'),
  ('LSDR Studios','Pilates & movement','543 Richmond St W, Unit B2 (Portland St entrance)',null,null,'https://lsdrstudios.com','Reformer classes with a breathwork focus and instructor headsets.'),
  ('Imprint Pilates','Pilates & movement','204 Spadina Ave','416-939-9545',null,'https://imprintpilates.com','Small-group reformer and mat. Owner answers emails quickly.'),
  ('Canergy Prima','Pilates & movement','105 King St E, 2nd floor','647-973-7388',null,'https://canergyprima.com','Premium reformer studio near St. Lawrence that doesn''t overcrowd classes.'),
  ('Nice Day Pilates','Pilates & movement','8 Eastern Ave','647-609-6298',null,'https://nicedaypilates.ca','Very design-forward, community-driven studio. Owner: Jenn.'),
  ('Neutral Pilates Downtown','Pilates & movement','181 Bay St, Concourse C395','647-502-7177',null,'https://neutralpilates.com','In the PATH at Brookfield Place; ideal for Financial District employees.'),
  ('Studio Fitness','Pilates & movement','477 Richmond St W, Unit 104','416-428-4802',null,'https://studio-fitness.com','Private personal-training gym with infrared sauna. Rated 5.0.'),
  ('Solis Movement (local chain)','Pilates & movement','548 King St W, 3rd floor','416-546-3177','downtown@solismovement.ca',null,'Hot Pilates, hot yoga and reformer across four studios.'),
  ('LAGREE Plus Adelaide (local chain)','Pilates & movement','410 Adelaide St W',null,null,'https://lagreeplus.ca','Lagree studio with a café. Rated 4.9.'),
  ('Studio Lagree King West (local chain)','Pilates & movement','788 King St W','416-901-4788',null,'https://studiolagree.com','Lagree plus KO boxing conditioning classes.'),
  ('Sweat and Tonic (local chain)','Pilates & movement','486 Front St W (The Well)','647-477-1446',null,'https://sweatandtonic.com','Biggest one-stop offer: HIIT, ride, yoga, Lagree, HYROX and coworking.'),
  ('Peak Physio & Sports Rehab','Integrated health','121 King St W, B132','647-352-7325',null,'https://peakphysiorehab.com','Physio, chiro, massage and workplace ergonomics. Rated 5.0 (195 reviews).'),
  ('Physiohealth Studios','Integrated health','33 Victoria St, #130','416-368-2525',null,'https://physiohealthstudios.com','Multidisciplinary clinic with a private training gym. Owner: Joanna.'),
  ('TO Kinesiology','Integrated health','115 Wolseley St','647-393-1337',null,'https://tokinesiology.ca','Training, Pilates, VO2/metabolic testing, sauna and red light. Owner: Nem.'),
  ('Peridot Wellness','Integrated health','931 Queen St W, #201','647-640-8422',null,'https://peridotwellnessto.ca','Chiro, massage, acupuncture and a 4-reformer Pilates studio. Rated 5.0.'),
  ('Integra Health Centre (local chain)','Integrated health','130 King St W, Suite 3600','416-777-9355',null,'https://integrahealth.ca','Large Exchange Tower clinic. Some recent reviews complain about billing; vet before partnering.'),
  ('Cornerstone Physiotherapy (local chain)','Integrated health','55 University Ave, #1710','416-363-1975','info@cornerstonephysio.com',null,'PATH-connected; rated 4.9 (518 reviews). Clinic director: Joon Nah.'),
  ('Hardknocks Boxing Club','Boxing & martial arts','156 Bathurst St','416-792-1531',null,'https://hardknocksboxingclub.com','Proper technical boxing gym with strong coaching reviews.'),
  ('161 Boxing Club','Boxing & martial arts','161 Spadina Ave, 2nd floor','289-271-9127',null,null,'Beginner-friendly through pro-level boxing; hosts events and rents event space. Rated 5.0.'),
  ('Jungle Toronto','Boxing & martial arts','501 Queen St W','647-327-2306',null,null,'Technical boxing plus primal-movement ''Flo'' mobility classes. Rated 5.0.'),
  ('Toronto Kickboxing & Muay Thai (TKMT Downtown)','Boxing & martial arts','610 Queen St W, 3rd floor','647-391-4536',null,null,'Muay Thai, kickboxing HIIT, boxing, strength and yoga; lunchtime classes suit office workers.'),
  ('Old School Muay Thai','Boxing & martial arts','254 Niagara St (rear unit)','416-436-0226',null,null,'Authentic Muay Thai gym with a diverse, welcoming community.'),
  ('Boxing DownTown Toronto','Boxing & martial arts','33 Bay St','888-771-4080',null,null,'Private 1-on-1 boxing training; good fit for busy professionals.'),
  ('F45 Training Toronto Downtown (franchise)','F45','165 King St W','647-351-9590',null,null,'Sits above St. Andrew subway in the Financial District. Rated 4.8 (228 reviews).'),
  ('F45 Training St. Lawrence Market (franchise)','F45','106 Front St E','416-846-0800',null,null,'Bright, inclusive studio. Manager: Damon.'),
  ('F45 Training Liberty Village (franchise)','F45','171 E Liberty St','647-348-4838',null,null,'Strong community; pushes members into HYROX. Studio manager: Aliya.'),
  ('CrossFit SMASHBOX / SMASHBOX Performance','HYROX & strength','14 Duncan St','416-274-4469',null,null,'CrossFit and HYROX classes plus open gym, steps from the Financial District.'),
  ('416 Fitness Club','HYROX & strength','396 Queens Quay W, Unit 103','416-901-0416',null,null,'Waterfront strength gym offering CrossFit, bodybuilding and HYROX-style classes.'),
  ('Auxiliary Fitness Toronto Central','HYROX & strength','180 Bloor St W, Lower Concourse','416-876-5718',null,null,'New Yorkville location equipped for CrossFit, HYROX and Olympic lifting.'),
  ('Empact Fitness','HYROX & strength','366 Adelaide St E, #102','647-696-7441',null,null,'Strength and conditioning with Olympic lifting; owners Nizar and Nadine. Rated 5.0.'),
  ('Intent Training (Ola Tsev Fitness)','HYROX & strength','487 King St E','437-244-7501',null,null,'Small-group strength training and 1-on-1 coaching. Rated 5.0.'),
  ('Fit Squad Training Gym','HYROX & strength','111 Peter St, Unit 102',null,null,null,'Premium, uncrowded strength gym with personal training. Rated 5.0 (347 reviews).'),
  ('RIDE CYCLE CLUB','Spin','2 Humbert St (Ossington)','416-531-3100',null,null,'Choreographed, high-energy rides; longtime Toronto favourite.'),
  ('RISE CYCLE Liberty Village','Spin','171 E Liberty St, Unit 149','647-563-8888',null,null,'Welcoming community studio. Rated 5.0 (340 reviews).'),
  ('Kardia','Spin','10 Lower Spadina Ave, Suite 100','647-729-5008',null,null,'Spin, yoga, HIIT and candlelit meditation; owner Heather teaches classes.'),
  ('Method Five','Spin','224 Queen St W, upper floor',null,null,null,'Spin plus heated Pilates and conditioning near Osgoode.'),
  ('SPINCO Toronto Downtown (Canadian chain)','Spin','129 Spadina Ave','647-327-7746',null,null,'Party-style rhythm rides with a loyal following.'),
  ('trove','Yoga & mind-body','426 Adelaide St W','647-805-9816',null,null,'Sound baths, breathwork, Reiki, massage, salt cave and cold plunge. Hosts group wellness events.'),
  ('Float Toronto','Yoga & mind-body','1159 Queen St W','416-803-0935',null,null,'Float tanks; established at this location for 10+ years. Rated 4.8 (472 reviews).'),
  ('Mindful Meridians PEMF & Float Studio','Yoga & mind-body','25 Mill St (Distillery)','437-222-1552',null,null,'Float tanks and PEMF therapy with memberships. Rated 5.0.'),
  ('Jaybird Studio Queen West','Yoga & mind-body','735 Queen St W, 2nd floor','416-203-2473',null,null,'Infrared, candlelit yoga and Pilates. Second location in Yorkville.'),
  ('Modo Yoga Queen West','Yoga & mind-body','1165 Queen St W',null,null,null,'Owner-run (Laura) hot yoga studio, newly opened. Part of the Modo network.'),
  ('Oxygen Yoga & Fitness Fashion District (franchise)','Yoga & mind-body','410 Adelaide St W, Unit 4','416-573-5235',null,null,'Infrared yoga and fitness classes; owner-operated.'),
  ('Peak Nutrition','Nutrition','100 King St W, 56th floor','416-436-0141',null,null,'Dietitian (Terence) who does sports and HYROX fuelling plans. Pairs well with fitness partners.'),
  ('Health By Nutrition','Nutrition','100 King St W, #5635','416-795-5909',null,null,'Nutritionist Vicki Lau''s personalized programs. Rated 5.0.'),
  ('My Dietitian','Nutrition','790 Bay St','647-500-0950',null,null,'Registered dietitian (Julia) with a practical, science-based approach.'),
  ('JM Nutrition','Nutrition','600 Sherbourne St, #404','416-451-3573',null,null,'Dietitian team with customized meal plans. Rated 4.9 (275 reviews).'),
  ('Well Beings Counselling','Mental wellness','401 Bay St, Suite 1605','647-490-2522',null,null,'Team of therapists in the core with evening and weekend hours.'),
  ('Talm Psychotherapy','Mental wellness','100 King St W, #5600','437-826-3132',null,null,'Psychotherapy practice in First Canadian Place; owner is responsive to feedback.'),
  ('True Balance Psychotherapy','Mental wellness','1 King St W, 48th floor','365-536-1457',null,null,'Holistic psychotherapy (Reta). Rated 5.0.'),
  ('REVIV IV Therapy at MyBest Clinic','IV & longevity','642 King St W, #101','833-697-3848',null,null,'IV drips plus concierge service. Note: REVIV is an international brand operated locally.'),
  ('Lumèr – Timeless Health Clinic','IV & longevity','25 Wood St, #1','416-966-4106',null,null,'Naturopathic and IV therapy clinic. Rated 4.7 (560 reviews).'),
  ('Urban Integrative IV & Detox Clinic','IV & longevity','615 Yonge St, 6th floor','416-463-2911',null,null,'IV therapy, ozone and detox services. Led by Dr. Yores.'),
  ('King West Massage','Massage & chiro','725 King St W','416-294-7970',null,null,'Solo RMT practice (Sal). Rated 5.0.'),
  ('Toronto Integrative Medicine Centre','Massage & chiro','283 Spadina Ave, 3rd floor','647-901-7297',null,null,'Acupuncture, chiropractic and massage.'),
  ('ALIVE Holistic Health & Fertility Clinic','Massage & chiro','2 Carlton St, #708','416-591-1535',null,null,'Acupuncture and red light therapy. Rated 4.9 (219 reviews).'),
  ('Village Rehab Team – King West','Massage & chiro','56 Ordnance St','416-530-1234',null,null,'Chiro, physio and massage. Rated 5.0 (432 reviews).'),
  ('King West Village Chiropractic','Massage & chiro','1002 King St W','416-597-1604',null,null,'Chiro and massage clinic. Rated 4.9.'),
  ('Triangle Physiotherapy King West (local chain)','Massage & chiro','980 King St W','416-548-5408',null,null,'Physio for active clients. Rated 4.9 (809 reviews).'),
  ('Ethos Climbing','Climbing','128 Queens Quay E','416-594-9965',null,null,'New waterfront bouldering gym with a fitness area and espresso bar.'),
  ('Rock On Climbing','Climbing','474 Front St E, Unit 4','647-217-9461',null,null,'Small bouldering gym with 24/7 member access.'),
  ('Basecamp Climbing Queen West (local chain)','Climbing','186 Spadina Ave, Unit 1A','416-546-3941',null,null,'Top rope and bouldering in a converted movie theatre.'),
  ('Diamond Muay Thai + Boxing','Outside core','3 Carlaw Ave (Leslieville)','416-546-0559',null,null,'Large, beginner-friendly Muay Thai gym. Rated 5.0 (467 reviews).'),
  ('Othership Yorkville (local chain)','Outside core','110 Bloor St W','416-922-2547',null,'https://othership.us','Second Othership location; same RCVRI caution applies.'),
  ('Jaybird Studio','Outside core','110 Bloor St W, Lower Concourse','416-922-9481',null,null,'Reformer and yoga studio in Yorkville. Rated 4.8 (500+ reviews).'),
  ('Wellness Haus','Outside core','413 Spadina Rd','437-826-1959',null,null,'Medical-aesthetics clinic with private sauna and cold plunge rooms.'),
  ('Alter Leslieville','Outside core','988 Queen St E','416-461-0660',null,null,'Neighbourhood sauna and ice bath studio.')
on conflict do nothing;

notify pgrst, 'reload schema';
select stage, count(*) from public.leads group by stage;
