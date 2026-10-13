import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { updatePartner } from '@/app/actions/admin';
import { PartnerFields } from '@/components/AdminForms';
import Alerts from '@/components/Alerts';

export default async function EditPartner({ params, searchParams }: { params: { id: string }; searchParams: { error?: string; saved?: string } }) {
  const { supabase } = await requireAdmin();
  const { data: partner } = await supabase.from('partners').select('*').eq('id', params.id).maybeSingle();
  if (!partner) notFound();

  return (
    <div className="stack-lg" style={{ maxWidth: 900 }}>
      <Link href="/admin/offers" className="small">Back to offers and partners</Link>
      <h1 style={{ fontSize: 48 }}>{partner.name}</h1>
      <Alerts error={searchParams.error} notice={searchParams.saved ? 'Partner saved.' : undefined} />
      <form action={updatePartner} className="panel form">
        <input type="hidden" name="id" value={partner.id} />
        <PartnerFields partner={partner} />
        <div><button className="btn btn-primary" type="submit">Save partner</button></div>
      </form>
    </div>
  );
}
