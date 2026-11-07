/**
 * Lógica de zonas horarias sin dependencias: todo se apoya en Intl.
 *
 * Convenciones:
 * - Un "instante" es un timestamp UTC en milisegundos.
 * - Un "día civil" es un string YYYY-MM-DD interpretado en una zona concreta.
 * - Los minutos del día van de 0 a 1439.
 */

export const MINUTE = 60_000;
export const SLOT_MINUTES = 15;

const partsCache = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = partsCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
    });
    partsCache.set(timeZone, f);
  }
  return f;
}

export interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number; // 0 = domingo
}

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function zonedParts(timeZone: string, instant: number): ZonedParts {
  const out: Record<string, string> = {};
  for (const p of formatter(timeZone).formatToParts(new Date(instant))) out[p.type] = p.value;
  return {
    year: Number(out.year),
    month: Number(out.month),
    day: Number(out.day),
    hour: Number(out.hour) % 24,
    minute: Number(out.minute),
    second: Number(out.second),
    weekday: WEEKDAYS[out.weekday] ?? 0,
  };
}

/** Desfase de la zona respecto a UTC, en minutos, en un instante dado (p. ej. CDMX = -360). */
export function offsetMinutes(timeZone: string, instant: number): number {
  const p = zonedParts(timeZone, instant);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const truncated = Math.floor(instant / 1000) * 1000;
  return Math.round((asUtc - truncated) / MINUTE);
}

export function parseYmd(ymd: string): [number, number, number] {
  const [y, m, d] = ymd.split('-').map(Number);
  return [y, m, d];
}

export function toYmd(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Suma días a un día civil (aritmética de calendario, sin zonas). */
export function addDays(ymd: string, days: number): string {
  const [y, m, d] = parseYmd(ymd);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return toYmd(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

/** Día civil actual en una zona. */
export function todayIn(timeZone: string, now = Date.now()): string {
  const p = zonedParts(timeZone, now);
  return toYmd(p.year, p.month, p.day);
}

/**
 * Instante UTC de la hora local `minutes` del día `ymd` en `timeZone`.
 * Si esa hora no existe (salto de horario de verano), devuelve la primera
 * hora válida posterior, igual que hacen los calendarios.
 */
export function zonedToInstant(timeZone: string, ymd: string, minutes = 0): number {
  const [y, m, d] = parseYmd(ymd);
  const wall = Date.UTC(y, m - 1, d) + minutes * MINUTE;
  // Dos iteraciones bastan para converger incluso cerca de un cambio de horario.
  let guess = wall - offsetMinutes(timeZone, wall) * MINUTE;
  guess = wall - offsetMinutes(timeZone, guess) * MINUTE;
  const check = zonedParts(timeZone, guess);
  const got = Date.UTC(check.year, check.month - 1, check.day, check.hour, check.minute);
  if (got !== wall) {
    // Hora inexistente: avanzamos hasta la siguiente válida.
    guess += wall - got;
  }
  return guess;
}

/** Minuto del día (0-1439) en la zona para un instante. */
export function minuteOfDay(timeZone: string, instant: number): number {
  const p = zonedParts(timeZone, instant);
  return p.hour * 60 + p.minute;
}

export interface DayWindow {
  start: number;
  end: number;
  /** Duración real en minutos: 1380 o 1500 en días con cambio de horario. */
  minutes: number;
}

export function dayWindow(timeZone: string, ymd: string): DayWindow {
  const start = zonedToInstant(timeZone, ymd, 0);
  const end = zonedToInstant(timeZone, addDays(ymd, 1), 0);
  return { start, end, minutes: Math.round((end - start) / MINUTE) };
}

/** Formatea minutos del día como HH:MM. */
export function formatMinutes(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function formatOffset(offset: number): string {
  const sign = offset >= 0 ? '+' : '−';
  const abs = Math.abs(offset);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${h}${m ? ':' + String(m).padStart(2, '0') : ''}`;
}

export function formatTime(timeZone: string, instant: number): string {
  return formatMinutes(minuteOfDay(timeZone, instant));
}

const dateFmtCache = new Map<string, Intl.DateTimeFormat>();
export function formatDate(timeZone: string, instant: number, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }): string {
  const key = timeZone + JSON.stringify(opts);
  let f = dateFmtCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat('es', { timeZone, ...opts });
    dateFmtCache.set(key, f);
  }
  return f.format(new Date(instant));
}

/** Diferencia en días civiles entre el día local de `instant` en `tz` y `ymd`. */
export function dayShift(timeZone: string, instant: number, ymd: string): number {
  const p = zonedParts(timeZone, instant);
  const [y, m, d] = parseYmd(ymd);
  return Math.round((Date.UTC(p.year, p.month - 1, p.day) - Date.UTC(y, m - 1, d)) / 86_400_000);
}

export interface DstChange {
  timeZone: string;
  /** Primer día civil (en la zona) con el nuevo desfase. */
  date: string;
  instant: number;
  from: number;
  to: number;
}

/** Busca el próximo cambio de desfase de la zona dentro de `days` días a partir de `fromInstant`. */
export function nextOffsetChange(timeZone: string, fromInstant: number, days = 30): DstChange | null {
  const base = offsetMinutes(timeZone, fromInstant);
  const step = 6 * 60 * MINUTE;
  for (let t = fromInstant + step; t <= fromInstant + days * 86_400_000; t += step) {
    const off = offsetMinutes(timeZone, t);
    if (off !== base) {
      // Búsqueda binaria del instante exacto del cambio.
      let lo = t - step;
      let hi = t;
      while (hi - lo > MINUTE) {
        const mid = Math.floor((lo + hi) / 2);
        if (offsetMinutes(timeZone, mid) === base) lo = mid;
        else hi = mid;
      }
      const p = zonedParts(timeZone, hi);
      return { timeZone, date: toYmd(p.year, p.month, p.day), instant: hi, from: base, to: off };
    }
  }
  return null;
}
