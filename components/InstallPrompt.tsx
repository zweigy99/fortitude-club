'use client';

import { useEffect, useState } from 'react';

const KEY = 'fc-install-dismissed';
const SNOOZE_DAYS = 14;

type Mode = 'android' | 'ios' | null;

export default function InstallPrompt() {
  const [mode, setMode] = useState<Mode>(null);
  const [deferred, setDeferred] = useState<any>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    if (standalone) return;
    try {
      const t = Number(localStorage.getItem(KEY) || 0);
      if (t && Date.now() - t < SNOOZE_DAYS * 864e5) return;
    } catch {}

    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua) || (ua.includes('Mac') && navigator.maxTouchPoints > 1);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    if (isIOS && isSafari) {
      setMode('ios');
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e);
      setMode('android');
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(KEY, String(Date.now())); } catch {}
    setMode(null);
  };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch {}
    setDeferred(null);
    setMode(null);
  };

  if (!mode) return null;

  return (
    <div
      role="dialog"
      aria-label="Add Fortitude Club to your home screen"
      style={{
        position: 'fixed', left: 12, right: 12, bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))', zIndex: 50,
        maxWidth: 460, margin: '0 auto', background: '#141414', color: '#f8f6f1', borderRadius: 14,
        padding: '16px 16px 14px', boxShadow: '0 18px 40px -18px rgba(0,0,0,.6)', fontSize: 15, lineHeight: 1.45,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Keep your card one tap away</div>
          {mode === 'android' ? (
            <div style={{ color: '#c9c6be' }}>Add Fortitude Club to your home screen to open your membership card like an app.</div>
          ) : (
            <div style={{ color: '#c9c6be' }}>
              Tap the <strong style={{ color: '#f8f6f1' }}>Share</strong> button{' '}
              <svg width="15" height="18" viewBox="0 0 15 18" aria-hidden="true" style={{ verticalAlign: '-3px' }}>
                <path d="M7.5 1v10M4 4.5 7.5 1 11 4.5M3 7.5H1.5v9h12v-9H12" fill="none" stroke="#5fd0c2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>{' '}
              in Safari, then choose <strong style={{ color: '#f8f6f1' }}>Add to Home Screen</strong>.
            </div>
          )}
        </div>
        <button
          onClick={dismiss}
          aria-label="Not now"
          style={{ background: 'none', border: 0, color: '#c9c6be', fontSize: 22, lineHeight: 1, padding: 4, cursor: 'pointer' }}
        >
          ×
        </button>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        {mode === 'android' && (
          <button
            onClick={install}
            style={{ background: '#1f9e8e', color: '#fff', border: 0, borderRadius: 2, minHeight: 42, padding: '0 16px', font: '500 15px inherit', cursor: 'pointer' }}
          >
            Add to home screen
          </button>
        )}
        <button
          onClick={dismiss}
          style={{ background: 'transparent', color: '#f8f6f1', border: '1px solid rgba(248,246,241,.35)', borderRadius: 2, minHeight: 42, padding: '0 16px', font: '500 15px inherit', cursor: 'pointer' }}
        >
          {mode === 'android' ? 'Not now' : 'Got it'}
        </button>
      </div>
    </div>
  );
}
