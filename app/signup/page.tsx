import Link from 'next/link';
import { redirect } from 'next/navigation';
import { signUp } from '@/app/actions/auth';
import { getSession } from '@/lib/auth';
import Alerts from '@/components/Alerts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Join | Fortitude Club' };

export default async function SignUpPage({ searchParams }: { searchParams: { error?: string; sent?: string } }) {
  const { supabase, user } = await getSession();
  if (user) redirect('/card');

  if (searchParams.sent) {
    return (
      <section className="section">
        <div className="wrap narrow stack">
          <h1 style={{ fontSize: 56 }}>Check your inbox</h1>
          <p className="lede">We sent a confirmation link to your work email. Open it on this device to confirm your address.</p>
          <p>After that, our team verifies your employer. Your membership card switches on once you're approved.</p>
        </div>
      </section>
    );
  }

  const { data: employers } = await supabase.from('employers').select('id, name').eq('active', true).order('name');

  return (
    <section className="section">
      <div className="wrap narrow stack-lg">
        <div className="stack">
          <h1 style={{ fontSize: 56 }}>Join Fortitude Club</h1>
          <p className="muted">Use your work email. We verify every member with their employer.</p>
        </div>
        <Alerts error={searchParams.error} />
        <form action={signUp} className="form">
          <div className="field">
            <label htmlFor="full_name">Full name</label>
            <input id="full_name" name="full_name" type="text" autoComplete="name" required />
          </div>
          <div className="field">
            <label htmlFor="email">Work email</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="employer_id">Employer</label>
            <select id="employer_id" name="employer_id" required defaultValue="">
              <option value="" disabled>Choose your employer</option>
              {(employers ?? []).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <span className="hint">Not listed? Ask your HR team to <Link href="/employers">contact us</Link>.</span>
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
            <span className="hint">At least 8 characters.</span>
          </div>
          <button type="submit" className="btn btn-primary">Create my account</button>
        </form>
        <p className="small">Already a member? <Link href="/login">Sign in</Link></p>
      </div>
    </section>
  );
}
