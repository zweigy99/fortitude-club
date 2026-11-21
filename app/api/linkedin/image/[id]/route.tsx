import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false }, global: { fetch: (u: any, o: any) => fetch(u, { ...o, cache: 'no-store' }) } });
  const { data } = await supabase.rpc('linkedin_card', { p_id: params.id });
  const c = ((data as any[]) ?? [])[0] ?? {};
  const headline: string = c.headline || 'Better benefits. Healthier teams.';
  const logo: string | null = c.logo_url && /^(data:image\/(png|jpe?g)|https:)/.test(c.logo_url) ? c.logo_url : null;
  const size = headline.length > 60 ? 64 : headline.length > 36 ? 76 : 88;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#141414', color: '#f8f6f1', padding: 72 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 24, letterSpacing: 8 }}>FORTITUDE CLUB</div>
          {c.partner_name && <div style={{ display: 'flex', fontSize: 22, letterSpacing: 6, color: '#1f9e8e' }}>PARTNER SPOTLIGHT</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {logo && (
            <div style={{ display: 'flex', background: '#ffffff', padding: '18px 26px', borderRadius: 6, alignSelf: 'flex-start' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} alt="" height={64} style={{ height: 64, objectFit: 'contain' }} />
            </div>
          )}
          <div style={{ display: 'flex', fontSize: size, lineHeight: 1.06, letterSpacing: -2, maxWidth: 1000 }}>{headline}</div>
          <div style={{ display: 'flex', fontSize: 28, color: '#bdbab3' }}>{c.partner_name ? `${c.partner_name}${c.neighbourhood ? ` \u00b7 ${c.neighbourhood}` : ''}` : 'Premium local wellness for your team'} · fortitudeclub.ca</div>
        </div>
        <div style={{ display: 'flex', height: 10, background: '#1f9e8e', width: '100%' }} />
      </div>
    ),
    { width: 1200, height: 627 }
  );
}
