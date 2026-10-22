import { requireAdmin } from '@/lib/auth';
import { saveStat, deleteStat, saveSetting } from '@/app/actions/admin';
import Alerts from '@/components/Alerts';

export default async function AdminSite({ searchParams }: { searchParams: { error?: string; saved?: string } }) {
  const { supabase } = await requireAdmin();
  const { data: stats } = await supabase.from('site_stats').select('*').order('sort_order');
  const { data: booking } = await supabase.from('site_settings').select('value').eq('key', 'booking_link').maybeSingle();

  return (
    <div className="stack-lg">
      <div className="stack">
        <h1 style={{ fontSize: 56 }}>Site content</h1>
        <p className="muted">The numbers on the home page and the &quot;Book a call&quot; link for employers.</p>
      </div>
      <Alerts error={searchParams.error} notice={searchParams.saved ? 'Saved. Changes are live.' : undefined} />

      <div className="stack">
        <h2 style={{ fontSize: 32 }}>Home page numbers</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Number</th><th>Label</th><th>Order</th><th></th></tr></thead>
            <tbody>
              {(stats ?? []).map((st: any) => (
                <tr key={st.id}>
                  <td><input form={`st-${st.id}`} name="value" defaultValue={st.value} aria-label="Number" style={{ minHeight: 36, width: 110 }} /></td>
                  <td><input form={`st-${st.id}`} name="label" defaultValue={st.label} aria-label="Label" style={{ minHeight: 36 }} /></td>
                  <td><input form={`st-${st.id}`} name="sort_order" type="number" defaultValue={st.sort_order} aria-label="Order" style={{ minHeight: 36, width: 70 }} /></td>
                  <td>
                    <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                      <form id={`st-${st.id}`} action={saveStat}><input type="hidden" name="id" value={st.id} /><button className="btn btn-ghost btn-small" type="submit">Save</button></form>
                      <form action={deleteStat}><input type="hidden" name="id" value={st.id} /><button className="btn btn-danger btn-small" type="submit">Remove</button></form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form action={saveStat} className="panel row" style={{ alignItems: 'flex-end' }}>
          <div className="field" style={{ width: 120 }}><label htmlFor="nv">Number</label><input id="nv" name="value" placeholder="e.g. 250+" /></div>
          <div className="field" style={{ flex: 1, minWidth: 200 }}><label htmlFor="nl">Label</label><input id="nl" name="label" placeholder="e.g. Members" /></div>
          <div className="field" style={{ width: 90 }}><label htmlFor="no">Order</label><input id="no" name="sort_order" type="number" defaultValue={10} /></div>
          <button className="btn btn-primary" type="submit">Add number</button>
        </form>
      </div>

      <form action={saveSetting} className="panel form">
        <h2 style={{ fontSize: 32 }}>Book a call link</h2>
        <input type="hidden" name="key" value="booking_link" />
        <div className="field">
          <label htmlFor="bl">Calendar booking link</label>
          <input id="bl" name="value" type="url" defaultValue={booking?.value ?? ''} placeholder="https://calendly.com/… or your Google Calendar booking page" />
          <span className="hint">Adds a &quot;Book a call&quot; button on the home page and For employers page. Leave blank to hide it.</span>
        </div>
        <div><button className="btn btn-primary" type="submit">Save link</button></div>
      </form>
    </div>
  );
}
