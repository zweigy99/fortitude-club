import { updatePassword } from '@/app/actions/auth';
import Alerts from '@/components/Alerts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Choose a new password | Fortitude Club' };

export default function ResetPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <section className="section">
      <div className="wrap narrow stack-lg">
        <h1 style={{ fontSize: 56 }}>Choose a new password</h1>
        <Alerts error={searchParams.error} />
        <form action={updatePassword} className="form">
          <div className="field">
            <label htmlFor="password">New password</label>
            <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
            <span className="hint">At least 8 characters.</span>
          </div>
          <button type="submit" className="btn btn-primary">Save new password</button>
        </form>
      </div>
    </section>
  );
}
