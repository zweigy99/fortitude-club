-- Adds offer type + redemption steps, and loads the partner offers from the Fortitude Club guide.
alter table public.offers add column if not exists kind text not null default 'Member offer';
alter table public.offers add column if not exists steps text;

update public.partners set category = 'Recovery', neighbourhood = 'Mercer Street, Downtown Toronto', address = null,
  website = 'https://rcvri.co/en-ca',
  description = 'Recovery, wellness and performance services in the heart of downtown Toronto.', active = true
  where name = 'RCVRI';
update public.partners set category = 'Fitness', neighbourhood = 'King West, Toronto', address = null, website = null,
  description = 'A full-service fitness and wellness facility offering training, classes and recovery services.', active = true
  where name = 'Totum Life Science';
update public.partners set category = 'Pilates', neighbourhood = 'Liberty Village, Toronto', address = null,
  website = 'https://strongpilates.ca/location/liberty-village',
  description = 'Boutique Pilates studio offering dynamic, low-impact strength and conditioning classes.', active = true
  where name = 'STRONG Pilates';

delete from public.offers;

insert into public.offers (partner_id, kind, title, description, promo_code, redeem_type, redeem_url, steps, sort_order, active)
select p.id, v.kind, v.title, v.description, v.code, v.rtype, v.url, v.steps, v.sort, true
from (values
  ('RCVRI', 'Intro offer', 'First session free for all Fortitude Club members',
   'Booked online, with the discount applied at checkout. Enter the code exactly as written.',
   'FORTITUDE', 'code', 'https://rcvri.co/en-ca/toronto-booking',
   E'Open the RCVRI Toronto booking page.\nClick Book Online.\nChoose the service you''d like to try.\nClick Buy a Package, then select Casual one-off session.\nIn your cart, enter the code FORTITUDE.', 1),
  ('RCVRI', 'Standard offer', '$40 for 6 sessions over a 2-week period',
   'Booked online, with the discount applied at checkout. Enter the code exactly as written.',
   'FORTY', 'code', 'https://rcvri.co/en-ca',
   E'Open the RCVRI site.\nClick the unlimited intro offer.\nContinue through to checkout.\nEnter the code FORTY to apply your rate.', 2),
  ('Totum Life Science', 'Intro offer', '7-day free trial: unlimited Totum access for every member',
   'Code to follow.', null, 'show_card', null, null, 1),
  ('Totum Life Science', 'Standard offer', 'No initiation fee, plus 20% off bi-weekly or paid-in-full membership rates',
   'Code to follow.', null, 'show_card', null, null, 2),
  ('STRONG Pilates', 'Intro offer', 'First class free for all Fortitude Club members',
   'Starts from the Liberty Village studio page. Enter the promo code at checkout and bring your Fortitude membership card to your first class.',
   'FORTITUDE', 'code', 'https://strongpilates.ca/location/liberty-village',
   E'Open the Liberty Village studio page and click Schedule.\nSelect the class you''d like to book.\nUnder By Package, choose STRONG Casual.\nAt checkout, enter the promo code FORTITUDE. Your class is free.', 1),
  ('STRONG Pilates', 'Standard offer', '$25 for 7 classes over a 14-day period',
   'Starts from the Liberty Village studio page. Enter the promo code at checkout and bring your Fortitude membership card to your first class.',
   'FIFTY', 'code', 'https://strongpilates.ca/location/liberty-village',
   E'Open the Liberty Village studio page.\nClick the STRONG Intro Offer banner, the blue bar listing 7 classes for $50.\nEnter the promo code FIFTY at checkout to pay $25.', 2)
) as v(partner, kind, title, description, code, rtype, url, steps, sort)
join public.partners p on p.name = v.partner;

notify pgrst, 'reload schema';
