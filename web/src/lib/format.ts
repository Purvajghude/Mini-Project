import type { Lifecycle } from './types';

export const PROFICIENCY = ['', 'Aware', 'Beginner', 'Working', 'Strong', 'Expert'] as const;
export const PROFICIENCY_HINT = [
  '',
  'Read about it; not used it yet',
  'Followed tutorials or a course',
  'Built something real with it',
  'Comfortable leading this part',
  'Others come to you for help',
] as const;

export const LIFECYCLE: Record<Lifecycle, string> = {
  DRAFT: 'Draft',
  RECRUITING: 'Recruiting',
  ACTIVE: 'Building',
  ARCHIVED: 'Archived',
};

export const DAYS = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || '?';
}

/** Stable warm hue per person so avatars are recognisable without photos. */
export function hueFor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export function relative(iso: string) {
  const diff = (Date.now() - Date.parse(iso)) / 1000;
  const units: [number, Intl.RelativeTimeFormatUnit][] = [[60, 'second'], [60, 'minute'], [24, 'hour'], [7, 'day'], [4.35, 'week'], [12, 'month']];
  let v = -diff;
  for (const [step, unit] of units) {
    if (Math.abs(v) < step) return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(Math.round(v), unit);
    v /= step;
  }
  return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(Math.round(v), 'year');
}

export const dateTime = (iso: string) => new Date(iso).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
export const timeOnly = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
export const minutesToTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** Turns a free-text project brief into display blocks: "Heading:" lines and "- " bullets. */
export function parseBrief(text: string) {
  const blocks: ({ kind: 'p'; text: string } | { kind: 'h'; text: string } | { kind: 'ul'; items: string[] })[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (/^[-•*]\s+/.test(line)) {
      const item = line.replace(/^[-•*]\s+/, '');
      const last = blocks[blocks.length - 1];
      if (last?.kind === 'ul') last.items.push(item); else blocks.push({ kind: 'ul', items: [item] });
    } else if (/^[^.]{2,40}:$/.test(line)) blocks.push({ kind: 'h', text: line.slice(0, -1) });
    else blocks.push({ kind: 'p', text: line });
  }
  return blocks;
}
