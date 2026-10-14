'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import markWhite from '@/components/fc-mark-white.png';

type Props = {
  name: string;
  employer: string;
  memberId: string;
  since: string;
  live?: boolean;
};

export default function MemberCard({ name, employer, memberId, since, live = false }: Props) {
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
    <div className="member-card" role="group" aria-label={`Fortitude Club membership card for ${name}`}>
      <div className="mc-top">
        <span className="mc-brand">
          <Image src={markWhite} alt="" height={34} style={{ width: 'auto', height: 34 }} />
          <span className="mc-brand-word">Fortitude Club</span>
        </span>
        <span className="mc-status">
          <span className={`mc-dot${live ? ' mc-live' : ''}`} aria-hidden="true" />
          Active member
        </span>
      </div>
      <div className="mc-number">{memberId}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, paddingBottom: 4 }}>
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
