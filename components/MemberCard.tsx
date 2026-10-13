'use client';

import { useEffect, useState } from 'react';

type Props = {
  name: string;
  employer: string;
  memberId: string;
  since: string;
  live?: boolean;
  tilt?: boolean;
};

export default function MemberCard({ name, employer, memberId, since, live = false, tilt = false }: Props) {
  const [now, setNow] = useState<string>('');

  useEffect(() => {
    if (!live) return;
    const tick = () =>
      setNow(
        new Date().toLocaleString('en-CA', {
          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit',
        })
      );
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [live]);

  return (
    <div className={`member-card${tilt ? ' tilt' : ''}`} role="group" aria-label={`Fortitude Club membership card for ${name}`}>
      <div className="mc-top">
        <span className="mc-brand">FORTITUDE CLUB</span>
        <span className="mc-status">
          <span className={`mc-dot${live ? ' mc-live' : ''}`} aria-hidden="true" />
          Active member
        </span>
      </div>
      <div className="mc-number">{memberId}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, paddingBottom: 6 }}>
        <div>
          <div className="mc-name">{name}</div>
          <div className="mc-meta">{employer}</div>
        </div>
        <div className="mc-meta" style={{ textAlign: 'right' }}>
          {live && now ? <>Verified live<br />{now}</> : <>Member since<br />{since}</>}
        </div>
      </div>
    </div>
  );
}
