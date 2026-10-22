import { requireAdmin } from '@/lib/auth';
import { sendPartnerReport } from '@/app/actions/admin';
import Alerts from '@/components/Alerts';

export default async function AdminReports({ searchParams }: { searchParams: { error?: string; sent?: string } }) {
  const { supabase } = await requireAdmin();
  const { data: partners } = await supabase.from('partners').select('id, name, contact_email').order('name');
  const { data: history } = await supabase.from('partner_reports').select('*, partners(name)').order('sent_at', { ascending: false }).limit(30);

  return (
    <div className="stack-lg">
      <div className="stack">
        <h1 style={{ fontSize: 56 }}>Partner reports</h1>
        <p className="muted">Email a partner how many Fortitude members redeemed with them. Set each partner&apos;s contact email in Offers and partners → Edit partner.</p>
      </div>
      <Alerts error={searchParams.error} notice={searchParams.sent ? (searchParams.sent === '1' ? 'Report sent.' : 'The report could not be sent. Check the RESEND_API_KEY.') : undefined} />
      <div className="stack">
        {(partners ?? []).map((p: any) => (
          <form key={p.id} action={sendPartnerReport} className="panel row" style={{ alignItems: 'flex-end' }}>
            <input type="hidden" name="partner_id" value={p.id} />
            <div className="field" style={{ minWidth: 180 }}><label>Partner</label><strong style={{ paddingTop: 10 }}>{p.name}</strong></div>
            <div className="field" style={{ flex: 1, minWidth: 220 }}>
              <label htmlFor={`to-${p.id}`}>Send to</label>
              <input id={`to-${p.id}`} name="to" type="email" defaultValue={p.contact_email ?? ''} placeholder="owner@studio.com" required />
            </div>
            <div className="field" style={{ width: 160 }}>
              <label htmlFor={`d-${p.id}`}>Period</label>
              <select id={`d-${p.id}`} name="days" defaultValue="30">
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last 12 months</option>
              </select>
            </div>
            <button className="btn btn-primary" type="submit">Send report</button>
          </form>
        ))}
      </div>
      <div className="stack">
        <h2 style={{ fontSize: 32 }}>Sent reports</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Partner</th><th>Period</th><th>Sent to</th><th>Redemptions</th></tr></thead>
            <tbody>
              {(history ?? []).map((h: any) => (
                <tr key={h.id}><td>{new Date(h.sent_at).toLocaleDateString('en-CA')}</td><td>{h.partners?.name}</td><td>{h.period_label}</td><td>{h.sent_to}</td><td>{h.redemptions}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
