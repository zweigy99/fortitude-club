'use client';

import { useEffect, useRef } from 'react';

type Point = { name: string; lat: number; lng: number; href: string; place?: string };

const CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

function load(): Promise<any> {
  const w = window as any;
  if (w.L) return Promise.resolve(w.L);
  if (!document.querySelector(`link[href="${CSS}"]`)) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = CSS;
    document.head.appendChild(l);
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${JS}"]`) as HTMLScriptElement | null;
    const s = existing ?? document.createElement('script');
    s.addEventListener('load', () => resolve(w.L));
    s.addEventListener('error', reject);
    if (!existing) {
      s.src = JS;
      document.body.appendChild(s);
    }
  });
}

export default function PartnerMap({ points }: { points: Point[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!points.length || !ref.current) return;
    let map: any;
    load()
      .then((L) => {
        if (!ref.current) return;
        map = L.map(ref.current, { scrollWheelZoom: false });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);
        const icon = L.divIcon({
          className: '',
          html: '<span style="display:block;width:16px;height:16px;border-radius:50%;background:#1f9e8e;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        const bounds: [number, number][] = [];
        points.forEach((p) => {
          const safe = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
          L.marker([p.lat, p.lng], { icon, title: p.name })
            .addTo(map)
            .bindPopup(`<strong>${safe(p.name)}</strong>${p.place ? `<br>${safe(p.place)}` : ''}<br><a href="${p.href}">View partner</a>`);
          bounds.push([p.lat, p.lng]);
        });
        if (bounds.length === 1) map.setView(bounds[0], 15);
        else map.fitBounds(bounds, { padding: [40, 40] });
      })
      .catch(() => {
        if (ref.current) ref.current.innerHTML = '<p style="padding:16px">The map couldn&#39;t load. Partner addresses are listed below.</p>';
      });
    return () => {
      if (map) map.remove();
    };
  }, [points]);

  if (!points.length) return null;
  return <div ref={ref} className="partner-map" role="region" aria-label="Map of Fortitude Club partners" />;
}
