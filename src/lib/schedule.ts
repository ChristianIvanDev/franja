import { MINUTE, SLOT_MINUTES, dayWindow, minuteOfDay, zonedParts } from './time';

export interface Person {
  id: string;
  name: string;
  timeZone: string;
  city: string;
  /** Inicio y fin de la jornada en minutos locales. Si start > end, la jornada cruza medianoche. */
  workStart: number;
  workEnd: number;
}

export type Availability = 'work' | 'edge' | 'off' | 'weekend';

/** Margen alrededor de la jornada que se considera "posible, pero incómodo". */
export const EDGE_MINUTES = 60;

function inRange(m: number, start: number, end: number): boolean {
  if (start === end) return true; // jornada de 24 h
  return start < end ? m >= start && m < end : m >= start || m < end;
}

export function availabilityAt(person: Person, instant: number, includeWeekends = false): Availability {
  const p = zonedParts(person.timeZone, instant);
  const m = p.hour * 60 + p.minute;
  if (!includeWeekends && (p.weekday === 0 || p.weekday === 6)) {
    // Una jornada nocturna que empezó el viernes sigue contando hasta su fin.
    const crossesMidnight = person.workStart > person.workEnd;
    const fridayNight = crossesMidnight && p.weekday === 6 && m < person.workEnd;
    if (!fridayNight) return 'weekend';
  }
  if (inRange(m, person.workStart, person.workEnd)) return 'work';
  if (inRange(m, (person.workStart - EDGE_MINUTES + 1440) % 1440, person.workStart) ||
      inRange(m, person.workEnd, (person.workEnd + EDGE_MINUTES) % 1440)) return 'edge';
  return 'off';
}

export interface Slot {
  index: number;
  start: number;
  end: number;
  availability: Availability[];
  /** Cuántas personas están en jornada. */
  working: number;
}

export interface DaySchedule {
  start: number;
  end: number;
  minutes: number;
  slots: Slot[];
}

/** Divide el día civil de la zona de referencia en bloques de 15 minutos y calcula quién está disponible. */
export function buildDay(people: Person[], refZone: string, ymd: string, includeWeekends = false): DaySchedule {
  const win = dayWindow(refZone, ymd);
  const count = Math.round(win.minutes / SLOT_MINUTES);
  const slots: Slot[] = [];
  for (let i = 0; i < count; i++) {
    const start = win.start + i * SLOT_MINUTES * MINUTE;
    const availability = people.map((p) => availabilityAt(p, start, includeWeekends));
    slots.push({
      index: i,
      start,
      end: start + SLOT_MINUTES * MINUTE,
      availability,
      working: availability.filter((a) => a === 'work').length,
    });
  }
  return { ...win, slots };
}

export interface Range {
  from: number; // índice de slot inclusivo
  to: number; // índice de slot exclusivo
}

/** Rangos contiguos donde todos están en jornada. */
export function overlapRanges(day: DaySchedule, people: number): Range[] {
  const ranges: Range[] = [];
  if (people === 0) return ranges;
  let open = -1;
  day.slots.forEach((s, i) => {
    const all = s.working === people;
    if (all && open < 0) open = i;
    if (!all && open >= 0) {
      ranges.push({ from: open, to: i });
      open = -1;
    }
  });
  if (open >= 0) ranges.push({ from: open, to: day.slots.length });
  return ranges;
}

export interface Suggestion {
  range: Range;
  /** Personas en jornada durante todo el rango. */
  attendees: number;
  total: number;
}

/**
 * Propone una reunión de `durationSlots`: primero busca coincidencia total y, si no la hay,
 * el bloque con más gente en jornada. Entre empates, prefiere el más cercano al centro del
 * solapamiento (menos probable que alguien esté llegando o saliendo).
 */
export function suggest(day: DaySchedule, people: number, durationSlots = 2, team: Person[] = []): Suggestion | null {
  if (people === 0 || day.slots.length < durationSlots) return null;
  let best: { score: number; from: number; attendees: number } | null = null;
  for (let i = 0; i + durationSlots <= day.slots.length; i++) {
    let attendees = Infinity;
    let comfort = 0;
    for (let j = i; j < i + durationSlots; j++) {
      const s = day.slots[j];
      attendees = Math.min(attendees, s.working);
      comfort += s.availability.filter((a) => a === 'work' || a === 'edge').length;
      // Quien no puede asistir al menos no debería estar durmiendo (22:00–07:00 local).
      team.forEach((p, k) => {
        if (s.availability[k] === 'work') return;
        const m = minuteOfDay(p.timeZone, s.start);
        if (m >= 22 * 60 || m < 7 * 60) comfort -= 3;
      });
    }
    // Penaliza los bloques pegados a los bordes de la jornada de alguien.
    const before = day.slots[i - 1];
    const after = day.slots[i + durationSlots];
    const buffer = (before ? before.working : 0) + (after ? after.working : 0);
    const score = attendees * 10_000 + comfort * 10 + buffer;
    if (!best || score > best.score) best = { score, from: i, attendees };
  }
  if (!best || best.attendees === 0) return null;
  return { range: { from: best.from, to: best.from + durationSlots }, attendees: best.attendees, total: people };
}

/** Minutos locales de una persona al inicio de un slot, útil para etiquetas. */
export function localMinute(person: Person, instant: number): number {
  return minuteOfDay(person.timeZone, instant);
}
