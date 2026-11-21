import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';
import { LOCKUP_WHITE, MARK_DARK } from '@/lib/brand';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const INK = '#141414';
const PAPER = '#f8f6f1';
const TEAL = '#1f9e8e';
const MUTED = '#bdbab3';

async function loadFont(weight: number) {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@${weight}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1' },
        cache: 'force-cache',
      })
    ).text();
    const url = css.match(/src: url\(([^)]+)\) format\('(truetype|opentype)'\)/)?.[1];
    if (!url) return null;
    return await (await fetch(url, { cache: 'force-cache' })).arrayBuffer();
  } catch {
    return null;
  }
}

/** Satori renders PNG/JPEG/SVG only, so skip WebP/AVIF photos. */
const usablePhoto = (src: string | null | undefined) => !!src && /^https:\/\/.+\.(jpe?g|png)(\?|$)/i.test(src.trim());
const usableLogo = (src: string | null | undefined) => !!src && /^(data:image\/(png|jpe?g|svg\+xml)|https:)/.test(src);

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
    global: { fetch: (u: any, o: any) => fetch(u, { ...o, cache: 'no-store' }) },
  });
  const { data } = await supabase.rpc('linkedin_card', { p_id: params.id });
  const c: any = ((data as any[]) ?? [])[0] ?? {};
  const headline: string = c.headline || 'Better benefits. Healthier teams.';
  const logo = usableLogo(c.logo_url) ? c.logo_url : null;
  const photo = ((c.photos ?? '') as string).split('\n').map((s) => s.trim()).find(usablePhoto) ?? null;
  const isPartner = !!c.partner_name;
  const eyebrow = isPartner ? 'Partner spotlight' : 'For employers';
  const size = headline.length > 48 ? 58 : headline.length > 30 ? 68 : 80;

  const [light, medium] = await Promise.all([loadFont(300), loadFont(500)]);
  const fonts: any[] = [];
  if (light) fonts.push({ name: 'Hanken', data: light, weight: 300, style: 'normal' });
  if (medium) fonts.push({ name: 'Hanken', data: medium, weight: 500, style: 'normal' });

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: INK, ...(fonts.length ? { fontFamily: 'Hanken' } : {}) }}>
        {/* Left: brand + headline */}
        <div style={{ width: 690, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '56px 56px 48px 64px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOCKUP_WHITE} alt="" width={132} height={120} style={{ width: 132, height: 120, objectFit: 'contain' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex', width: 36, height: 3, background: TEAL }} />
              <div style={{ display: 'flex', fontSize: 20, fontWeight: 500, letterSpacing: 5, color: TEAL, textTransform: 'uppercase' }}>{eyebrow}</div>
            </div>
            <div style={{ display: 'flex', fontSize: size, fontWeight: 300, lineHeight: 1.08, letterSpacing: -1.5, color: PAPER }}>{headline}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #3a3a3a', paddingTop: 22 }}>
            <div style={{ display: 'flex', fontSize: 22, color: MUTED }}>{isPartner && c.neighbourhood ? c.neighbourhood : 'Local wellness for Toronto teams'}</div>
            <div style={{ display: 'flex', fontSize: 22, fontWeight: 500, color: PAPER }}>fortitudeclub.ca</div>
          </div>
        </div>

        {/* Right: partner photo + logo, or branded panel */}
        {photo ? (
          <div style={{ flex: 1, height: '100%', display: 'flex', position: 'relative' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="" width={510} height={627} style={{ width: 510, height: 627, objectFit: 'cover' }} />
            <div style={{ position: 'absolute', left: 0, top: 0, width: 510, height: 627, display: 'flex', background: 'linear-gradient(180deg, rgba(20,20,20,0) 55%, rgba(20,20,20,0.55) 100%)' }} />
            {logo && (
              <div style={{ position: 'absolute', left: 32, bottom: 36, display: 'flex', background: '#ffffff', padding: '16px 22px', borderRadius: 4 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} alt="" height={52} style={{ height: 52, maxWidth: 260, objectFit: 'contain' }} />
              </div>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 36, background: PAPER }}>
            {logo ? (
              <div style={{ display: 'flex', background: '#ffffff', padding: '28px 36px', borderRadius: 4, border: '1px solid #e1ddd3' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} alt="" height={92} style={{ height: 92, maxWidth: 360, objectFit: 'contain' }} />
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={MARK_DARK} alt="" width={120} height={180} style={{ width: 120, height: 180, objectFit: 'contain', opacity: 0.9 }} />
            )}
            <div style={{ display: 'flex', fontSize: 24, fontWeight: 500, letterSpacing: 4, color: INK, textTransform: 'uppercase' }}>{isPartner ? c.partner_name : 'Local wellness, on us'}</div>
          </div>
        )}
        <div style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: 8, display: 'flex', background: TEAL }} />
      </div>
    ),
    { width: 1200, height: 627, fonts: fonts.length ? fonts : undefined, headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}
