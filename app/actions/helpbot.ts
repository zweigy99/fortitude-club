'use server';

import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';

export async function saveFaq(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('id') || '');
  const row = {
    question: String(formData.get('question') || '').trim(),
    answer: String(formData.get('answer') || '').trim(),
    sort_order: Number(formData.get('sort_order') || 0) || 0,
  };
  if (!row.question || !row.answer) redirect('/admin/helpbot');
  if (id) await supabase.from('help_faqs').update(row).eq('id', id);
  else await supabase.from('help_faqs').insert(row);
  redirect('/admin/helpbot?saved=1');
}

export async function deleteFaq(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from('help_faqs').delete().eq('id', String(formData.get('id')));
  redirect('/admin/helpbot?saved=1');
}
