export const STAGES = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'follow_up', label: 'Follow-up' },
  { key: 'meeting', label: 'Meeting booked' },
  { key: 'negotiating', label: 'Negotiating' },
  { key: 'signed', label: 'Signed' },
  { key: 'not_now', label: 'Not now' },
] as const;

export const stageLabel = (k: string) => STAGES.find((s) => s.key === k)?.label ?? k;

export function fillTemplate(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '');
}

export function leadVars(lead: any, fromName: string) {
  const first = (lead.contact_name || '').trim().split(' ')[0];
  return {
    studio: lead.name ?? '',
    first_name: first || 'there',
    neighbourhood: lead.neighbourhood || 'downtown Toronto',
    category: lead.category ?? '',
    sender: (fromName || 'Fortitude Club').split(' from ')[0],
  };
}

export const addDays = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
