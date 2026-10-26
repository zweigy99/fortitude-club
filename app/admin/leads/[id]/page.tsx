import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { STAGES, fillTemplate, leadVars, stageLabel } from '@/lib/crm';
import { updateLead, setStage, addActivity, sendLeadEmail, convertToPartner, deleteLead } from '@/app/actions/crm';
import Alerts from '@/components/Alerts';

export default async function LeadDetail({ params, searchParams }: { params: { id: string }; searchParams: { tpl?: string; error?: string; saved?: string; sent?: string } }) {
  const { supabase } = await requireAdmin();
  const { data: lead } = await supabase.from('leads').select('*').eq('id', params.id).maybeSingle();
  if (!lead) notFound();
  const [{ data: activity }, { data: templates }, { data: fromRow }] = await Promise.all([
    supabase.from('lead_activities').select('*').eq('lead_id', lead.id).order('created_at', { ascending: false }),
    supabase.from('email_templates').select('*').order('sort_order'),
    supabase.from('site_settings').select('value').eq('key', 'outreach_from_name').maybeSingle(),
  ]);
  const fromName = fromRow?.value || 'Fortitude Club';
  const tpl = (templates ?? []).find((t: any) => t.id === searchParams.tpl) ?? (templates ?? [])[lead.last_contacted_at ? 1 : 0];
  const vars = leadVars(lead, fromName);
  const subject = tpl ? fillTemplate(tpl.subject, vars) : '';
  const body = tpl ? fillTemplate(tpl.body, vars) : '';

  return (
    <div className="stack-lg">
      <Link href="/admin/leads" className="small">All leads</Link>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div className="stack" style={{ gap: 8 }}>
          <h1 style={{ fontSize: 48 }}>{lead.name}</h1>
          <span className="muted">{[lead.category, lead.neighbourhood, lead.address].filter(Boolean).join(' · ')}</span>
          <div className="row" style={{ gap: 8 }}>
            <span className="badge badge-ok">{stageLabel(lead.stage)}</span>
            {lead.do_not_contact && <span className="badge badge-bad">Unsubscribed: don&apos;t email</span>}
            {lead.website && <a href={lead.website} target="_blank" rel="noopener noreferrer" className="small">Website</a>}
            {lead.phone && <a href={`tel:${lead.phone}`} className="small">{lead.phone}</a>}
          </div>
        </div>
        <form action={setStage} className="row" style={{ gap: 8 }}>
          <input type="hidden" name="id" value={lead.id} />
          <label htmlFor="stage" className="sr-only">Stage</label>
          <select id="stage" name="stage" defaultValue={lead.stage} style={{ minWidth: 170 }}>
            {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <button className="btn btn-primary btn-small" type="submit">Update stage</button>
        </form>
      </div>
      <Alerts error={searchParams.error} notice={searchParams.sent ? 'Email sent and logged. Follow-up date set.' : searchParams.saved ? 'Saved.' : undefined} />

      <div className="split" style={{ alignItems: 'start', gap: 24 }}>
        <div className="stack-lg">
          <div className="panel stack">
            <h3>Send an email</h3>
            {!lead.email ? (
              <p className="muted">No email yet. Find it on their website or contact page, add it under <b>Edit details</b>, then come back here. You can also call them ({lead.phone ?? 'no phone on file'}) and log it below.</p>
            ) : lead.do_not_contact ? (
              <p className="muted">This studio unsubscribed. Don&apos;t email them again; call or visit instead if appropriate.</p>
            ) : (
              <>
                <nav className="filters" aria-label="Choose template">
                  {(templates ?? []).map((t: any) => (
                    <Link key={t.id} href={`/admin/leads/${lead.id}?tpl=${t.id}`} className="chip" aria-current={tpl?.id === t.id ? 'page' : undefined}>{t.name}</Link>
                  ))}
                </nav>
                <form action={sendLeadEmail} className="form" key={tpl?.id}>
                  <input type="hidden" name="id" value={lead.id} />
                  <div className="field"><label>To</label><span>{lead.contact_name ? `${lead.contact_name} · ` : ''}{lead.email}</span></div>
                  <div className="field"><label htmlFor="subj">Subject</label><input id="subj" name="subject" defaultValue={subject} required /></div>
                  <div className="field"><label htmlFor="body">Message</label><textarea id="body" name="body" defaultValue={body} required style={{ minHeight: 260 }} /></div>
                  <div className="row" style={{ alignItems: 'flex-end' }}>
                    <div className="field" style={{ width: 200 }}>
                      <label htmlFor="fd">Remind me to follow up in</label>
                      <select id="fd" name="follow_days" defaultValue="5"><option value="3">3 days</option><option value="5">5 days</option><option value="7">1 week</option><option value="14">2 weeks</option><option value="0">No reminder</option></select>
                    </div>
                    <button className="btn btn-primary" type="submit">Send email</button>
                  </div>
                  <p className="small muted">Sends from {fromName}. Replies go to your inbox. An unsubscribe link and your business address are added automatically.</p>
                </form>
              </>
            )}
          </div>

          <div className="panel stack">
            <h3>Log a call, visit or note</h3>
            <form action={addActivity} className="form">
              <input type="hidden" name="id" value={lead.id} />
              <div className="row">
                <label className="check"><input type="radio" name="kind" value="call" defaultChecked /> Call</label>
                <label className="check"><input type="radio" name="kind" value="visit" /> Visit</label>
                <label className="check"><input type="radio" name="kind" value="note" /> Note</label>
              </div>
              <div className="field"><label htmlFor="ab">What happened?</label><textarea id="ab" name="body" placeholder="e.g. Spoke to the owner, wants the deck, call back Tuesday" /></div>
              <div className="row" style={{ alignItems: 'flex-end' }}>
                <div className="field" style={{ width: 200 }}><label htmlFor="nf">Next follow-up</label><input id="nf" name="next_follow_up" type="date" defaultValue={lead.next_follow_up ?? ''} /></div>
                <button className="btn btn-ghost" type="submit">Save to timeline</button>
              </div>
            </form>
          </div>

          <div className="stack">
            <h3>Timeline</h3>
            {(activity ?? []).length === 0 && <p className="muted">Nothing yet.</p>}
            {(activity ?? []).map((a: any) => (
              <div key={a.id} className="panel" style={{ padding: 16 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <strong>{a.kind === 'email' ? `Email: ${a.subject}` : a.subject}</strong>
                  <span className="small muted">{new Date(a.created_at).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                {a.body && <p className="small" style={{ whiteSpace: 'pre-line', marginTop: 8 }}>{a.body}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="stack-lg">
          <form action={updateLead} className="panel form">
            <h3>Edit details</h3>
            <input type="hidden" name="id" value={lead.id} />
            <div className="field"><label htmlFor="e-name">Studio name</label><input id="e-name" name="name" defaultValue={lead.name} required /></div>
            <div className="field"><label htmlFor="e-contact">Contact person</label><input id="e-contact" name="contact_name" defaultValue={lead.contact_name ?? ''} placeholder="e.g. Sarah Lee (owner)" /></div>
            <div className="field"><label htmlFor="e-email">Email</label><input id="e-email" name="email" type="email" defaultValue={lead.email ?? ''} /></div>
            <div className="field"><label htmlFor="e-phone">Phone</label><input id="e-phone" name="phone" defaultValue={lead.phone ?? ''} /></div>
            <div className="field"><label htmlFor="e-web">Website</label><input id="e-web" name="website" defaultValue={lead.website ?? ''} /></div>
            <div className="field"><label htmlFor="e-cat">Category</label><input id="e-cat" name="category" defaultValue={lead.category ?? ''} /></div>
            <div className="field"><label htmlFor="e-hood">Neighbourhood</label><input id="e-hood" name="neighbourhood" defaultValue={lead.neighbourhood ?? ''} /></div>
            <div className="field"><label htmlFor="e-addr">Address</label><input id="e-addr" name="address" defaultValue={lead.address ?? ''} /></div>
            <div className="field"><label htmlFor="e-owner">Owner on our team</label><input id="e-owner" name="owner" defaultValue={lead.owner ?? ''} /></div>
            <div className="field"><label htmlFor="e-next">Next follow-up</label><input id="e-next" name="next_follow_up" type="date" defaultValue={lead.next_follow_up ?? ''} /></div>
            <div className="field"><label htmlFor="e-why">Why they fit</label><textarea id="e-why" name="why" defaultValue={lead.why ?? ''} /></div>
            <div className="field"><label htmlFor="e-notes">Notes</label><textarea id="e-notes" name="notes" defaultValue={lead.notes ?? ''} /></div>
            <div><button className="btn btn-primary" type="submit">Save details</button></div>
          </form>

          <div className="panel stack">
            <h3>Signed?</h3>
            {lead.partner_id ? (
              <Link href={`/admin/partners/${lead.partner_id}`} className="btn btn-ghost">Open partner record</Link>
            ) : (
              <form action={convertToPartner}>
                <input type="hidden" name="id" value={lead.id} />
                <p className="small muted" style={{ marginBottom: 10 }}>Creates a (hidden) partner record with these details, so you can add their logo and offers and switch them live.</p>
                <button className="btn btn-teal" type="submit">Convert to partner</button>
              </form>
            )}
          </div>
          <form action={deleteLead}>
            <input type="hidden" name="id" value={lead.id} />
            <button className="btn btn-danger btn-small" type="submit">Delete lead</button>
          </form>
        </div>
      </div>
    </div>
  );
}
