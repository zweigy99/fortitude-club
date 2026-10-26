import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { saveTemplate, deleteTemplate, saveOutreachSettings } from '@/app/actions/crm';
import Alerts from '@/components/Alerts';

export default async function Templates({ searchParams }: { searchParams: { error?: string; saved?: string } }) {
  const { supabase } = await requireAdmin();
  const { data: templates } = await supabase.from('email_templates').select('*').order('sort_order');
  const { data: settings } = await supabase.from('site_settings').select('key, value').in('key', ['outreach_from_name', 'outreach_from_email', 'outreach_reply_to', 'business_address']);
  const s = Object.fromEntries((settings ?? []).map((r: any) => [r.key, r.value]));

  return (
    <div className="stack-lg">
      <Link href="/admin/leads" className="small">Back to leads</Link>
      <h1 style={{ fontSize: 56 }}>Outreach emails</h1>
      <Alerts error={searchParams.error} notice={searchParams.saved ? 'Saved.' : undefined} />

      <form action={saveOutreachSettings} className="panel form">
        <h3>Who emails come from</h3>
        <div className="split" style={{ gap: 16 }}>
          <div className="field"><label htmlFor="fn">Sender name</label><input id="fn" name="outreach_from_name" defaultValue={s.outreach_from_name ?? ''} placeholder="Hayden from Fortitude Club" /></div>
          <div className="field"><label htmlFor="fe">Send from</label><input id="fe" name="outreach_from_email" defaultValue={s.outreach_from_email ?? ''} placeholder="hello@fortitudeclub.ca" /><span className="hint">Must end in @fortitudeclub.ca.</span></div>
          <div className="field"><label htmlFor="rt">Replies go to</label><input id="rt" name="outreach_reply_to" type="email" defaultValue={s.outreach_reply_to ?? ''} placeholder="info@fortitudeclub.ca" /></div>
        </div>
        <div className="field"><label htmlFor="ba">Business mailing address (shown at the bottom of every email)</label><input id="ba" name="business_address" defaultValue={s.business_address ?? ''} placeholder="Fortitude Club, 123 Example St, Toronto, ON M5V 0A0" /><span className="hint">Canada&apos;s anti-spam law expects a real mailing address on commercial emails.</span></div>
        <div><button className="btn btn-primary" type="submit">Save sender settings</button></div>
      </form>

      <div className="stack">
        <h2 style={{ fontSize: 32 }}>Templates</h2>
        <p className="muted small">Placeholders filled in automatically: {'{{studio}}'}, {'{{first_name}}'}, {'{{neighbourhood}}'}, {'{{category}}'}, {'{{sender}}'}. You can always edit the email before sending.</p>
        {(templates ?? []).map((t: any) => (
          <form key={t.id} action={saveTemplate} className="panel form">
            <input type="hidden" name="id" value={t.id} />
            <div className="split" style={{ gap: 16 }}>
              <div className="field"><label>Template name</label><input name="name" defaultValue={t.name} /></div>
              <div className="field"><label>Subject</label><input name="subject" defaultValue={t.subject} /></div>
              <div className="field" style={{ maxWidth: 120 }}><label>Order</label><input name="sort_order" type="number" defaultValue={t.sort_order} /></div>
            </div>
            <div className="field"><label>Message</label><textarea name="body" defaultValue={t.body} style={{ minHeight: 200 }} /></div>
            <div className="row">
              <button className="btn btn-primary btn-small" type="submit">Save template</button>
              <button className="btn btn-danger btn-small" type="submit" formAction={deleteTemplate}>Delete</button>
            </div>
          </form>
        ))}
        <form action={saveTemplate} className="panel form">
          <h3>New template</h3>
          <div className="split" style={{ gap: 16 }}>
            <div className="field"><label>Template name</label><input name="name" required /></div>
            <div className="field"><label>Subject</label><input name="subject" required /></div>
            <div className="field" style={{ maxWidth: 120 }}><label>Order</label><input name="sort_order" type="number" defaultValue={10} /></div>
          </div>
          <div className="field"><label>Message</label><textarea name="body" required style={{ minHeight: 160 }} /></div>
          <div><button className="btn btn-primary btn-small" type="submit">Add template</button></div>
        </form>
      </div>
    </div>
  );
}
