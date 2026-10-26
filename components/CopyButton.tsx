'use client';

import { useState } from 'react';

export default function CopyButton({ targetId, label = 'Copy text' }: { targetId: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-primary btn-small"
      onClick={async () => {
        const el = document.getElementById(targetId) as HTMLTextAreaElement | null;
        if (!el) return;
        try {
          await navigator.clipboard.writeText(el.value);
        } catch {
          el.select();
          document.execCommand('copy');
        }
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }}
    >
      {done ? 'Copied ✓' : label}
    </button>
  );
}
