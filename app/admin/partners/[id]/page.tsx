import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { updatePartner } from '@/app/actions/admin';
import { PartnerFields } from '@/components/AdminForms';
import { invitePartnerUser, removePartnerUser } from '@/app/actions/requests';
import Alerts from '@/components/Alerts';

export default async function EditPartner({ params, searchParams }: { params: { id: string }; searchParams: { error?: string; saved?: string } }) {
  const { supabase } = await requireAdmin();
  const { data: partner } = await supabase.from('partners').select('*').eq('id', params.id).maybeSingle();
  if (!partner) notFound();
  const [{ data: invites }, { data: staff }] = await Promise.all([
    supabase.from('partner_invites').select('email, created_at').eq('partner_id', partner.id),
    supabase.from('partner_members').select('profiles(full_name, work_email)').eq('partner_id', partner.id),
  ]);
  const activeEmails = new Set((staff ?? []).map((x: any) => x.profiles?.work_email).filter(Boolean));

  return (
    <div className="stack-lg" style={{ maxWidth: 900 }}>
      <Link href="/admin/offers" className="small">Back to offers and partners</Link>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <h1 style={{ fontSize: 48 }}>{partner.name}</h1>
        <div className="row">
          <Link href={`/partner?as=${partner.id}`} className="btn btn-primary">View as partner</Link>
          <a href="#logins" className="btn btn-ghost">Partner logins &amp; invites</a>
        </div>
      </div>
      <Alerts error={searchParams.error} notice={searchParams.saved ? 'Partner saved.' : undefined} />
      <form action={updatePartner} className="panel form">
        <input type="hidden" name="id" value={partner.id} />
        <PartnerFields partner={partner} />
        <div><button className="btn btn-primary" type="submit">Save partner</button></div>
      </form>

      <div className="panel stack" id="logins">
        <h2 style={{ fontSize: 28 }}>Partner portal logins</h2>
        <p className="muted small">People here can sign in to the partner portal to update {partner.name}&apos;s page, upload photos, see their results and suggest offer changes (which you approve in Partner requests).</p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Email</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {(invites ?? []).map((i: any) => (
                <tr key={i.email}>
                  <td>{i.email}</td>
                  <td>{activeEmails.has(i.email) ? <span className="badge badge-ok">Active</span> : <span className="badge badge-warn">Invited</span>}</td>
                  <td>
                    <form action={removePartnerUser}>
                      <input type="hidden" name="partner_id" value={partner.id} />
                      <input type="hidden" name="email" value={i.email} />
                      <button className="linkbtn small" type="submit">Remove access</button>
                    </form>
                  </td>
                </tr>
              ))}
              {(invites ?? []).length === 0 && <tr><td colSpan={3} className="muted">No one yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <form action={invitePartnerUser} className="row" style={{ alignItems: 'flex-end' }}>
          <input type="hidden" name="partner_id" value={partner.id} />
          <div className="field" style={{ flex: 1, minWidth: 240 }}>
            <label htmlFor="inv">Invite by email</label>
            <input id="inv" name="email" type="email" defaultValue={partner.contact_email ?? ''} placeholder="owner@studio.com" required />
          </div>
          <div className="field" style={{ flexBasis: '100%' }}>
            <label htmlFor="inv-note">Personal note (optional, added to the invite email)</label>
            <textarea id="inv-note" name="note" placeholder="e.g. Hi Ashley, great working with you..." style={{ minHeight: 90 }} />
          </div>
          <button className="btn btn-primary" type="submit">Send invite</button>
        </form>
      </div>
    </div>
  );
}
