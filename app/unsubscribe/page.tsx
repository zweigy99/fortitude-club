import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Unsubscribe | Fortitude Club', robots: { index: false } };

export default async function Unsubscribe({ searchParams }: { searchParams: { t?: string } }) {
  let name: string | null = null;
  if (searchParams.t && /^[0-9a-f-]{36}$/i.test(searchParams.t)) {
    const { data } = await createClient().rpc('unsubscribe_lead', { p_token: searchParams.t });
    name = (data as string) ?? null;
  }
  return (
    <section className="section">
      <div className="wrap stack" style={{ maxWidth: 640 }}>
        <h1 style={{ fontSize: 52 }}>{name ? 'You\u2019re unsubscribed.' : 'Link not recognised.'}</h1>
        <p className="lede">
          {name
            ? `We won\u2019t send ${name} any more Fortitude Club partnership emails. If this was a mistake, email info@fortitudeclub.ca.`
            : 'This unsubscribe link is invalid or has already been used. Email info@fortitudeclub.ca and we\u2019ll remove you straight away.'}
        </p>
      </div>
    </section>
  );
}
