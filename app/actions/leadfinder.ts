'use server';

import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { searchPlaces, isChain } from '@/lib/places';

async function runOne(supabase: any, area: string, category: string, skipChains: boolean, minReviews: number) {
  const { results, error } = await searchPlaces(`${category} in ${area}, Toronto, Ontario`);
  if (error && results.length === 0) return { added: 0, skipped: 0, error };
  const [{ data: leads }, { data: partners }] = await Promise.all([
    supabase.from('leads').select('name, google_place_id'),
    supabase.from('partners').select('name'),
  ]);
  const names = new Set([...(leads ?? []), ...(partners ?? [])].map((x: any) => x.name.toLowerCase().trim()));
  const ids = new Set((leads ?? []).map((x: any) => x.google_place_id).filter(Boolean));
  let added = 0;
  let skipped = 0;
  for (const p of results) {
    const n = p.name.toLowerCase().trim();
    if (ids.has(p.id) || names.has(n) || (skipChains && isChain(p.name)) || (p.reviews ?? 0) < minReviews) {
      skipped++;
      continue;
    }
    const { error: insErr } = await supabase.from('leads').insert({
      name: p.name,
      category,
      neighbourhood: area,
      address: p.address,
      phone: p.phone,
      website: p.website,
      rating: p.rating,
      review_count: p.reviews,
      google_place_id: p.id,
      source: 'google maps',
      why: p.rating ? `Found on Google Maps: rated ${p.rating} (${p.reviews ?? 0} reviews).` : 'Found on Google Maps.',
    });
    if (insErr) skipped++;
    else {
      added++;
      names.add(n);
      ids.add(p.id);
    }
  }
  return { added, skipped, error };
}

export async function findLeads(formData: FormData) {
  const { supabase } = await requireAdmin();
  const area = String(formData.get('area') || '').trim();
  const category = String(formData.get('category') || '').trim();
  const skipChains = formData.get('skip_chains') === 'on';
  const minReviews = Number(formData.get('min_reviews') || 0);
  if (!area || !category) redirect('/admin/leads/find?error=' + encodeURIComponent('Choose an area and a type of studio.'));
  const r = await runOne(supabase, area, category, skipChains, minReviews);
  if (formData.get('save') === 'on') {
    await supabase.from('lead_searches').insert({ area, category, last_run_at: new Date().toISOString(), last_added: r.added });
  }
  if (r.error && r.added === 0) redirect('/admin/leads/find?error=' + encodeURIComponent(r.error));
  redirect(`/admin/leads/find?added=${r.added}&skipped=${r.skipped}&q=${encodeURIComponent(`${category} · ${area}`)}`);
}

export async function runSavedSearches() {
  const { supabase } = await requireAdmin();
  const { data: searches } = await supabase.from('lead_searches').select('*');
  let added = 0;
  let skipped = 0;
  for (const s of searches ?? []) {
    const r = await runOne(supabase, s.area, s.category, true, 5);
    added += r.added;
    skipped += r.skipped;
    await supabase.from('lead_searches').update({ last_run_at: new Date().toISOString(), last_added: r.added }).eq('id', s.id);
    if (r.error && r.added === 0 && r.skipped === 0) redirect('/admin/leads/find?error=' + encodeURIComponent(r.error));
  }
  redirect(`/admin/leads/find?added=${added}&skipped=${skipped}&q=${encodeURIComponent('all saved searches')}`);
}

export async function deleteSearch(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from('lead_searches').delete().eq('id', String(formData.get('id')));
  redirect('/admin/leads/find');
}
