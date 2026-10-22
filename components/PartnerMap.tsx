'use client';

import { useEffect, useRef, useState } from 'react';

type Point = { name: string; lat: number; lng: number; href: string; place?: string; logo?: string | null; offers?: number };

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

const safe = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

export default function PartnerMap({ points, title = true }: { points: Point[]; title?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (!points.length || !ref.current) return;
    let map: any;
    load()
      .then((L) => {
        if (!ref.current) return;
        map = L.map(ref.current, { scrollWheelZoom: false, zoomControl: true });
        mapRef.current = map;
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd',
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        }).addTo(map);
        const bounds: [number, number][] = [];
        markersRef.current = points.map((p, i) => {
          const inner = p.logo
            ? `<img src="${safe(p.logo)}" alt="" style="height:22px;max-width:96px;width:auto;display:block;object-fit:contain">`
            : `<span style="font:600 12px/1 'Hanken Grotesk',Helvetica,Arial,sans-serif;color:#141414;white-space:nowrap">${safe(p.name)}</span>`;
          const html = `<div class="fc-pin"><div class="fc-pin-card">${inner}</div><div class="fc-pin-tip"></div></div>`;
          const icon = L.divIcon({ className: '', html, iconSize: [120, 52], iconAnchor: [60, 52], popupAnchor: [0, -50] });
          const popup = `<div style="font-family:'Hanken Grotesk',Helvetica,Arial,sans-serif;min-width:200px">
              ${p.logo ? `<img src="${safe(p.logo)}" alt="" style="height:34px;width:auto;max-width:170px;object-fit:contain;display:block;margin:0 0 8px">` : ''}
              <div style="font-weight:600;font-size:15px;margin:0 0 2px">${safe(p.name)}</div>
              ${p.place ? `<div style="color:#5c5a55;font-size:13px;margin:0 0 6px">${safe(p.place)}</div>` : ''}
              ${p.offers ? `<div style="color:#12776b;font-size:13px;font-weight:600;margin:0 0 10px">${p.offers} member offer${p.offers === 1 ? '' : 's'}</div>` : ''}
              <a href="${p.href}" style="display:inline-block;background:#141414;color:#f8f6f1;text-decoration:none;padding:8px 12px;font-size:13px;border-radius:2px">View studio &amp; offers</a>
            </div>`;
          const m = L.marker([p.lat, p.lng], { icon, title: p.name, riseOnHover: true }).addTo(map).bindPopup(popup);
          m.on('click', () => setActive(i));
          bounds.push([p.lat, p.lng]);
          return m;
        });
        if (bounds.length === 1) map.setView(bounds[0], 15);
        else map.fitBounds(bounds, { padding: [70, 70] });
      })
      .catch(() => {
        if (ref.current) ref.current.innerHTML = '<p style="padding:16px">The map couldn&#39;t load. Studio addresses are listed below.</p>';
      });
    return () => {
      if (map) map.remove();
      mapRef.current = null;
    };
  }, [points]);

  const focus = (i: number) => {
    setActive(i);
    const map = mapRef.current;
    const m = markersRef.current[i];
    if (map && m) {
      map.flyTo(m.getLatLng(), 15, { duration: 0.6 });
      setTimeout(() => m.openPopup(), 650);
    }
  };

  if (!points.length) return null;

  if (points.length === 1) return <div ref={ref} className="partner-map" role="region" aria-label={`Map showing ${points[0].name}`} />;

  return (
    <div className="stack" style={{ gap: 16 }}>
      {title && (
        <div className="stack" style={{ gap: 6 }}>
          <span className="label">Studio map</span>
          <h2 style={{ fontSize: 'clamp(28px, 3.4vw, 40px)' }}>Find a Fortitude studio near you.</h2>
          <p className="muted">Every pin is a Fortitude Club partner with exclusive member offers. Tap a studio to see where it is and what you get.</p>
        </div>
      )}
      <div className="map-wrap">
        <div ref={ref} className="partner-map partner-map-lg" role="region" aria-label="Map of Fortitude Club partner studios" />
        <ul className="map-list" aria-label="Partner studios">
          {points.map((p, i) => (
            <li key={p.name}>
              <button type="button" onClick={() => focus(i)} className={`map-item${active === i ? ' is-active' : ''}`}>
                <span className="map-item-logo">
                  {p.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.logo} alt="" />
                  ) : (
                    <span className="map-item-initial">{p.name.slice(0, 1)}</span>
                  )}
                </span>
                <span className="map-item-text">
                  <span className="map-item-name">{p.name}</span>
                  {p.place && <span className="map-item-place">{p.place}</span>}
                  {!!p.offers && <span className="map-item-offers">{p.offers} member offer{p.offers === 1 ? '' : 's'}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
