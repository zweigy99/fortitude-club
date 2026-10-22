import { ImageResponse } from 'next/og';

export const alt = 'Fortitude Club: Better benefits. Healthier teams.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#141414', color: '#f8f6f1', padding: 72 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', fontSize: 56, fontWeight: 300, letterSpacing: -2 }}>FC</div>
          <div style={{ display: 'flex', fontSize: 22, letterSpacing: 8 }}>FORTITUDE CLUB</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', fontSize: 84, lineHeight: 1.05, letterSpacing: -2 }}>Better benefits.</div>
          <div style={{ display: 'flex', fontSize: 84, lineHeight: 1.05, letterSpacing: -2 }}>Healthier teams.</div>
          <div style={{ display: 'flex', fontSize: 28, color: '#bdbab3' }}>Premium local wellness for your team. fortitudeclub.ca</div>
        </div>
        <div style={{ display: 'flex', height: 10, background: '#1f9e8e', width: '100%' }} />
      </div>
    ),
    size
  );
}
