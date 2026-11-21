/** Convert a Toronto wall-clock date + time ("2026-11-24", "09:00") to a UTC ISO string, handling daylight saving. */
export function torontoToUtc(date: string, time: string) {
  const guess = new Date(`${date}T${time}:00Z`);
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', timeZoneName: 'shortOffset' }).formatToParts(guess);
  const off = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT-5';
  const m = off.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  const mins = m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0)) : -300;
  return new Date(guess.getTime() - mins * 60000).toISOString();
}

/** Format a UTC timestamp as Toronto local "YYYY-MM-DDTHH:MM" for datetime-local inputs. */
export function utcToTorontoInput(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour === '24' ? '00' : p.hour}:${p.minute}`;
}

export function fmtToronto(iso: string | null) {
  if (!iso) return 'Not scheduled';
  return new Date(iso).toLocaleString('en-CA', { timeZone: 'America/Toronto', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
