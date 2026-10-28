'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const MAX_PHOTOS = 12;

/** Shrinks large photos in the browser so uploads are fast and reliable. */
async function shrink(file: File, maxEdge: number, type: 'image/jpeg' | 'image/png', quality = 0.82): Promise<Blob> {
  if (file.type === 'image/svg+xml') return file;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('That file isn\u2019t an image we can read. Try a JPG or PNG.'));
      i.src = url;
    });
    const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024 && (file.type === type || type === 'image/jpeg')) return file;
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    const ctx = c.getContext('2d')!;
    if (type === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
    }
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise<Blob>((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process the image.'))), type, quality));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function PartnerMediaUploader({ partnerId, initialLogo, initialPhotos, disabled }: { partnerId: string; initialLogo: string; initialPhotos: string[]; disabled?: boolean }) {
  const [logo, setLogo] = useState(initialLogo);
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState(false);

  async function upload(blob: Blob, kind: string, ext: string) {
    const supabase = createClient();
    const path = `${partnerId}/${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error } = await supabase.storage.from('partner-media').upload(path, blob, { contentType: blob.type || `image/${ext}`, upsert: false });
    if (error) throw new Error(error.message.includes('row-level security') ? 'Your account isn\u2019t allowed to upload for this studio. Email info@fortitudeclub.ca.' : error.message);
    return supabase.storage.from('partner-media').getPublicUrl(path).data.publicUrl;
  }

  async function onLogo(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setBusy(true);
    setStatus('Uploading logo\u2026');
    try {
      const isSvg = f.type === 'image/svg+xml';
      const blob = await shrink(f, 1000, 'image/png');
      const url = await upload(blob, 'logo', isSvg ? 'svg' : 'png');
      setLogo(url);
      setStatus('Logo uploaded. Click \u201cSave studio page\u201d to publish it.');
    } catch (e: any) {
      setStatus(e.message ?? 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  async function onPhotos(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, MAX_PHOTOS - photos.length);
    if (!list.length) {
      setStatus(`You already have ${MAX_PHOTOS} photos. Remove one to add another.`);
      return;
    }
    setBusy(true);
    const added: string[] = [];
    try {
      for (let i = 0; i < list.length; i++) {
        setStatus(`Uploading photo ${i + 1} of ${list.length}\u2026`);
        const blob = await shrink(list[i], 1800, 'image/jpeg');
        added.push(await upload(blob, 'photo', 'jpg'));
      }
      setStatus(`${added.length} photo${added.length === 1 ? '' : 's'} uploaded. Click \u201cSave studio page\u201d to publish.`);
    } catch (e: any) {
      setStatus((added.length ? `${added.length} uploaded, then: ` : '') + (e.message ?? 'Upload failed.'));
    } finally {
      setPhotos((p) => [...p, ...added]);
      setBusy(false);
    }
  }

  const move = (i: number, d: number) =>
    setPhotos((p) => {
      const n = [...p];
      const j = i + d;
      if (j < 0 || j >= n.length) return p;
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  return (
    <div className="stack" style={{ gap: 18 }}>
      <input type="hidden" name="logo_url" value={logo} />
      <input type="hidden" name="photos" value={photos.join('\n')} />
      <div className="field">
        <label htmlFor="pm-logo">Logo</label>
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="Current logo" style={{ height: 52, width: 'auto', maxWidth: 220, objectFit: 'contain', background: '#fff', padding: 6, border: '1px solid var(--line)', marginBottom: 8, alignSelf: 'flex-start' }} />
        )}
        <input id="pm-logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" disabled={disabled || busy} onChange={(e) => { onLogo(e.target.files); e.target.value = ''; }} />
        <span className="hint">PNG or SVG on a white or transparent background works best.</span>
      </div>
      <div className="field">
        <label htmlFor="pm-photos">Photos ({photos.length} of {MAX_PHOTOS})</label>
        {photos.length > 0 && (
          <div className="gallery" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', marginBottom: 8 }}>
            {photos.map((src, i) => (
              <div key={src} style={{ position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Photo ${i + 1}`} />
                <div className="row" style={{ position: 'absolute', top: 6, right: 6, gap: 4 }}>
                  <button type="button" className="btn btn-ghost btn-small" style={{ background: '#fff', padding: '2px 8px', minHeight: 26 }} disabled={disabled || i === 0} onClick={() => move(i, -1)} aria-label={`Move photo ${i + 1} earlier`}>←</button>
                  <button type="button" className="btn btn-ghost btn-small" style={{ background: '#fff', padding: '2px 8px', minHeight: 26 }} disabled={disabled || i === photos.length - 1} onClick={() => move(i, 1)} aria-label={`Move photo ${i + 1} later`}>→</button>
                  <button type="button" className="btn btn-danger btn-small" style={{ padding: '2px 8px', minHeight: 26 }} disabled={disabled} onClick={() => setPhotos((p) => p.filter((_, k) => k !== i))} aria-label={`Remove photo ${i + 1}`}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <input id="pm-photos" type="file" multiple accept="image/png,image/jpeg,image/webp,image/heic" disabled={disabled || busy} onChange={(e) => { onPhotos(e.target.files); e.target.value = ''; }} />
        <span className="hint">Choose one or several photos. Large photos are resized automatically. The first photo shows first on your page.</span>
      </div>
      {status && <p className="small" role="status" style={{ color: busy ? 'var(--muted)' : 'var(--teal-text)', fontWeight: 600 }}>{status}</p>}
    </div>
  );
}
