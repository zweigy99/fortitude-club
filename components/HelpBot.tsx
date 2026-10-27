'use client';

import { useEffect, useRef, useState } from 'react';

type Msg = { role: 'user' | 'assistant'; content: string; handoff?: boolean };

const SUGGESTIONS = ['How do I redeem an offer?', 'What partners are near King West?', 'I didn\u2019t get my confirmation email', 'Does my company have Fortitude?'];

function linkify(text: string) {
  const parts = text.split(/(https?:\/\/[^\s)]+|fortitudeclub\.ca\/[^\s),.]*|info@fortitudeclub\.ca)/g);
  return parts.map((p, i) => {
    if (/^https?:\/\//.test(p)) return <a key={i} href={p} target={p.includes('fortitudeclub.ca') ? undefined : '_blank'} rel="noopener noreferrer">{p.replace(/^https?:\/\//, '')}</a>;
    if (/^fortitudeclub\.ca\//.test(p)) return <a key={i} href={`https://${p}`}>{p}</a>;
    if (p === 'info@fortitudeclub.ca') return <a key={i} href="mailto:info@fortitudeclub.ca">{p}</a>;
    return <span key={i}>{p}</span>;
  });
}

export default function HelpBot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [msgs, busy]);
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  async function ask(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    const next: Msg[] = [...msgs, { role: 'user', content: question }];
    setMsgs(next);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      });
      const j = await res.json();
      setMsgs([...next, { role: 'assistant', content: j.reply ?? 'Sorry, something went wrong. Please email info@fortitudeclub.ca.', handoff: j.handoff }]);
    } catch {
      setMsgs([...next, { role: 'assistant', content: 'Sorry, I couldn\u2019t connect. Please email info@fortitudeclub.ca.', handoff: true }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!open && (
        <button type="button" className="hb-launch" onClick={() => setOpen(true)} aria-label="Open Ask Fortitude help chat">
          <span aria-hidden="true" className="hb-launch-dot" />
          Ask Fortitude
        </button>
      )}
      {open && (
        <div className="hb-panel" role="dialog" aria-label="Ask Fortitude help chat">
          <div className="hb-head">
            <div>
              <strong>Ask Fortitude</strong>
              <span className="hb-sub">Answers about offers, partners and your membership</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="hb-close">×</button>
          </div>
          <div className="hb-body" aria-live="polite">
            {msgs.length === 0 && (
              <div className="hb-welcome">
                <p>Hi! I can help with offers, partners, sign-up and your membership card. What would you like to know?</p>
                <div className="hb-suggest">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" onClick={() => ask(s)}>{s}</button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`hb-msg hb-${m.role}`}>
                <div className="hb-bubble">{m.role === 'assistant' ? linkify(m.content) : m.content}</div>
                {m.handoff && (
                  <a className="hb-handoff" href={`mailto:info@fortitudeclub.ca?subject=${encodeURIComponent('Question from the website')}&body=${encodeURIComponent(msgs.filter((x) => x.role === 'user').map((x) => x.content).join('\n'))}`}>Email the Fortitude team</a>
                )}
              </div>
            ))}
            {busy && <div className="hb-msg hb-assistant"><div className="hb-bubble hb-typing">Thinking…</div></div>}
            <div ref={endRef} />
          </div>
          <form
            className="hb-form"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <label htmlFor="hb-input" className="sr-only">Your question</label>
            <input id="hb-input" ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question" maxLength={500} autoComplete="off" />
            <button type="submit" disabled={busy || !input.trim()}>Send</button>
          </form>
          <p className="hb-foot">AI assistant. It can make mistakes; for account issues email info@fortitudeclub.ca.</p>
        </div>
      )}
    </>
  );
}
