import { canonicalZone } from './cities';
import type { Person } from './schedule';

/** Estado compartible: todo cabe en el hash de la URL, sin backend ni cuentas. */
export interface ShareState {
  people: Person[];
  date?: string;
  refZone?: string;
  duration?: number;
}

type Compact = { v: 1; p: [string, string, string, number, number][]; d?: string; r?: string; l?: number };

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64: string): string {
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodeState(state: ShareState): string {
  const compact: Compact = {
    v: 1,
    p: state.people.map((x) => [x.name, x.timeZone, x.city, x.workStart, x.workEnd]),
  };
  if (state.date) compact.d = state.date;
  if (state.refZone) compact.r = state.refZone;
  if (state.duration) compact.l = state.duration;
  return toBase64Url(JSON.stringify(compact));
}

function validZone(tz: unknown): tz is string {
  if (typeof tz !== 'string') return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const clampMinute = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? Math.min(1439, Math.max(0, Math.round(n))) : 0);

/** Decodifica sin confiar en la entrada: cualquier campo inválido se descarta. */
export function decodeState(hash: string): ShareState | null {
  try {
    const raw = JSON.parse(fromBase64Url(hash.replace(/^#/, ''))) as Compact;
    if (raw?.v !== 1 || !Array.isArray(raw.p)) return null;
    const people: Person[] = raw.p
      .filter((x) => Array.isArray(x) && typeof x[0] === 'string' && validZone(x[1]))
      .slice(0, 50)
      .map((x, i) => ({
        id: `p${i}-${Math.random().toString(36).slice(2, 7)}`,
        name: x[0].slice(0, 40),
        timeZone: canonicalZone(x[1]),
        city: typeof x[2] === 'string' ? x[2].slice(0, 60) : x[1],
        workStart: clampMinute(x[3]),
        workEnd: clampMinute(x[4]),
      }));
    return {
      people,
      date: typeof raw.d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.d) ? raw.d : undefined,
      refZone: validZone(raw.r) ? canonicalZone(raw.r) : undefined,
      duration: typeof raw.l === 'number' && raw.l >= 1 && raw.l <= 32 ? raw.l : undefined,
    };
  } catch {
    return null;
  }
}
