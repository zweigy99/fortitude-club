import Link from 'next/link';
import { requestPasswordReset } from '@/app/actions/auth';
import Alerts from '@/components/Alerts';

export const metadata = { title: 'Reset password | Fortitude Club' };

export default function ForgotPage({ searchParams }: { searchParams: { error?: string; sent?: string } }) {
  return (
    <section className="section">
      <div className="wrap narrow stack-lg">
        <h1 style={{ fontSize: 56 }}>Reset your password</h1>
        {searchParams.sent ? (
          <p className="lede">If that email has an account, a reset link is on its way. Open it on this device.</p>
        ) : (
          <>
            <Alerts error={searchParams.error} />
            <form action={requestPasswordReset} className="form">
              <div className="field">
                <label htmlFor="email">Work email</label>
                <input id="email" name="email" type="email" autoComplete="email" required />
              </div>
              <button type="submit" className="btn btn-primary">Send reset link</button>
            </form>
          </>
        )}
        <Link href="/login" className="small">Back to sign in</Link>
      </div>
    </section>
  );
}
