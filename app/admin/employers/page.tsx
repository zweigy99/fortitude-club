import { requireAdmin } from '@/lib/auth';
import { saveEmployer, updateEmployer } from '@/app/actions/admin';
import Alerts from '@/components/Alerts';

export default async function AdminEmployers({ searchParams }: { searchParams: { error?: string } }) {
  const { supabase } = await requireAdmin();
  const { data: employers } = await supabase.from('employers').select('*').order('name');
  const { data: stats } = await supabase.rpc('employer_stats');
  const byId = new Map((stats ?? []).map((s: any) => [s.employer_id, s]));

  return (
    <div className="stack-lg">
      <div className="stack">
        <h1 style={{ fontSize: 56 }}>Employers</h1>
        <p className="muted">Employers listed here appear in the sign-up form. Add an email domain to get automatic match flags in the review queue.</p>
      </div>
      <Alerts error={searchParams.error} />

      <form action={saveEmployer} className="panel form">
        <h3>Add an employer</h3>
        <div className="split" style={{ gap: 16 }}>
          <div className="field"><label htmlFor="name">Name</label><input id="name" name="name" type="text" required /></div>
          <div className="field"><label htmlFor="email_domain">Work email domain</label><input id="email_domain" name="email_domain" type="text" placeholder="company.com" /></div>
        </div>
        <div><button className="btn btn-primary" type="submit">Add employer</button></div>
      </form>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email domain</th><th>Shown at sign-up</th><th>Approved</th><th>Waiting</th><th>Redemptions</th><th></th></tr></thead>
          <tbody>
            {(employers ?? []).map((e) => {
              const s: any = byId.get(e.id) ?? {};
              const formId = `emp-${e.id}`;
              return (
                <tr key={e.id}>
                  <td><input form={formId} name="name" type="text" defaultValue={e.name} aria-label="Employer name" style={{ minHeight: 36 }} /></td>
                  <td><input form={formId} name="email_domain" type="text" defaultValue={e.email_domain ?? ''} aria-label="Email domain" placeholder="company.com" style={{ minHeight: 36 }} /></td>
                  <td><label className="check"><input form={formId} name="active" type="checkbox" defaultChecked={e.active} /> Yes</label></td>
                  <td>{s.approved_members ?? 0}</td>
                  <td>{s.pending_members ?? 0}</td>
                  <td>{s.redemptions ?? 0}</td>
                  <td>
                    <form id={formId} action={updateEmployer}>
                      <input type="hidden" name="id" value={e.id} />
                      <button className="btn btn-ghost btn-small" type="submit">Save</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
