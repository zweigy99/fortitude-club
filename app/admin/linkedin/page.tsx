import { requireAdmin, siteUrl } from '@/lib/auth';
import CopyButton from '@/components/CopyButton';

type Draft = { id: string; title: string; text: string; image?: string | null; link?: string };

export default async function LinkedInDrafts() {
  const { supabase } = await requireAdmin();
  const since30 = new Date(Date.now() - 30 * 864e5).toISOString();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const [{ data: partners }, { data: offers }, { count: members }, { count: redemptionsMonth }, { count: employers }] = await Promise.all([
    supabase.from('partners').select('id, name, neighbourhood, description, logo_url, slug, created_at, offers(title, kind, active)').eq('active', true).order('created_at', { ascending: false }),
    supabase.from('offers').select('id, title, kind, created_at, partners(name, slug, logo_url)').eq('active', true).gte('created_at', since30).order('created_at', { ascending: false }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('redemptions').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
    supabase.from('employers').select('id', { count: 'exact', head: true }).eq('active', true),
  ]);
  const site = siteUrl();
  const month = new Date().toLocaleString('en-CA', { month: 'long' });
  const drafts: Draft[] = [];

  for (const p of (partners ?? []) as any[]) {
    const intro = (p.offers ?? []).find((o: any) => o.active && (o.kind ?? '').toLowerCase().startsWith('intro'));
    drafts.push({
      id: `partner-${p.id}`,
      title: `Partner spotlight: ${p.name}`,
      image: p.logo_url,
      link: p.slug ? `${site}/partners/${p.slug}` : `${site}/partners`,
      text: `Partner spotlight: ${p.name}${p.neighbourhood ? ` in ${p.neighbourhood}` : ''} \u{1F4AA}

${p.description ?? ''}

Fortitude Club members get ${intro ? intro.title.charAt(0).toLowerCase() + intro.title.slice(1) : 'exclusive member offers'}, plus ongoing member pricing.

Fortitude connects employers with premium local wellness providers, so every employee benefit actually gets used.

See the offer: ${p.slug ? `${site}/partners/${p.slug}` : `${site}/partners`}

#WorkplaceWellness #EmployeeBenefits #Toronto #Wellness`,
    });
  }

  for (const o of (offers ?? []) as any[]) {
    drafts.push({
      id: `offer-${o.id}`,
      title: `New offer: ${o.title} at ${o.partners?.name}`,
      image: o.partners?.logo_url,
      link: `${site}/offers/${o.id}`,
      text: `New on Fortitude Club: ${o.title} at ${o.partners?.name} \u2728

Another reason to make the most of your wellness benefit this ${month}. Members can redeem it today from their Fortitude card.

Not a member yet? Ask your employer about Fortitude Club, or book a call with us: ${site}/employers

#WorkplaceWellness #EmployeeBenefits #Toronto`,
    });
  }

  drafts.push({
    id: 'milestone',
    title: `Monthly update: ${month}`,
    text: `Fortitude Club in ${month} \u{1F4C8}

\u2022 ${(partners ?? []).length} premium local wellness partners
\u2022 ${employers ?? 0} employers giving their teams better benefits
\u2022 ${members ?? 0} verified members
\u2022 ${redemptionsMonth ?? 0} offers redeemed so far this month

Better benefits. Healthier teams. If you run a Toronto studio, gym or clinic and want to reach engaged local professionals, let's talk: ${site}/partners

#WorkplaceWellness #Toronto #SmallBusiness`,
  });

  drafts.push({
    id: 'partner-recruit',
    title: 'Call for new partners',
    text: `We're growing Fortitude Club's network of Toronto wellness partners \u{1F44B}

If you run a Pilates, yoga, spin, boxing, recovery, physio or nutrition studio downtown, Fortitude connects you with highly engaged local employees, with no change at your front desk. You choose the intro offer; members book through your own system.

Current partners include ${((partners ?? []) as any[]).map((p) => p.name).slice(0, 4).join(', ')}.

Interested? Comment below or message us, or see how it works: ${site}/partners

#Toronto #FitnessBusiness #WellnessBusiness #Partnerships`,
  });

  return (
    <div className="stack-lg">
      <div className="stack">
        <h1 style={{ fontSize: 56 }}>LinkedIn posts</h1>
        <p className="muted">Ready-to-post updates written from your live partners, offers and numbers. Edit if you like, click <b>Copy text</b>, then <b>Open LinkedIn</b> and paste. To post as Fortitude Club, choose your company page in LinkedIn&apos;s post box.</p>
      </div>
      {drafts.map((d) => (
        <div key={d.id} className="panel stack">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3>{d.title}</h3>
            {d.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.image} alt="" style={{ height: 40, width: 'auto', maxWidth: 140, objectFit: 'contain' }} />
            )}
          </div>
          <label htmlFor={d.id} className="sr-only">Post text for {d.title}</label>
          <textarea id={d.id} defaultValue={d.text} style={{ minHeight: 230 }} />
          <div className="row">
            <CopyButton targetId={d.id} />
            <a href="https://www.linkedin.com/feed/?shareActive=true" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-small">Open LinkedIn</a>
            {d.image && <a href={d.image} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-small">Open logo image</a>}
            {d.link && <a href={d.link} target="_blank" rel="noopener noreferrer" className="small">Preview the page it links to</a>}
          </div>
        </div>
      ))}
    </div>
  );
}
