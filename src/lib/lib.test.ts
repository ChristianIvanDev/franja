import { describe, expect, it } from 'vitest';
import {
  addDays,
  dayShift,
  dayWindow,
  formatOffset,
  formatTime,
  nextOffsetChange,
  offsetMinutes,
  zonedToInstant,
} from './time';
import { availabilityAt, buildDay, overlapRanges, suggest, type Person } from './schedule';
import { decodeState, encodeState } from './share';
import { buildIcs, googleCalendarUrl } from './calendar';
import { ALL_ZONES, canonicalZone, parseOffsetQuery, searchCities, zonesByOffset } from './cities';

const at = (iso: string) => Date.parse(iso);

const person = (name: string, timeZone: string, workStart = 540, workEnd = 1080): Person => ({
  id: name,
  name,
  timeZone,
  city: timeZone,
  workStart,
  workEnd,
});

describe('desfases', () => {
  it('calcula desfases fijos, de media hora y de 45 minutos', () => {
    const t = at('2026-11-10T12:00:00Z');
    expect(offsetMinutes('America/Mexico_City', t)).toBe(-360);
    expect(offsetMinutes('Asia/Kolkata', t)).toBe(330);
    expect(offsetMinutes('Asia/Kathmandu', t)).toBe(345);
    expect(offsetMinutes('Australia/Lord_Howe', t)).toBe(660);
  });

  it('respeta el horario de verano', () => {
    expect(offsetMinutes('America/New_York', at('2026-07-01T12:00:00Z'))).toBe(-240);
    expect(offsetMinutes('America/New_York', at('2026-12-01T12:00:00Z'))).toBe(-300);
  });

  it('formatea desfases', () => {
    expect(formatOffset(-360)).toBe('UTC−6');
    expect(formatOffset(345)).toBe('UTC+5:45');
    expect(formatOffset(0)).toBe('UTC+0');
  });
});

describe('conversión de hora local a instante', () => {
  it('convierte una hora normal', () => {
    expect(zonedToInstant('America/Mexico_City', '2026-11-10', 9 * 60)).toBe(at('2026-11-10T15:00:00Z'));
  });

  it('una hora inexistente (salto de primavera) avanza a la siguiente válida', () => {
    const t = zonedToInstant('America/New_York', '2026-03-08', 150); // 02:30 no existe
    expect(formatTime('America/New_York', t)).toBe('03:30');
  });

  it('los días con cambio de horario duran 23 o 25 horas', () => {
    expect(dayWindow('America/New_York', '2026-03-08').minutes).toBe(23 * 60);
    expect(dayWindow('America/New_York', '2026-11-01').minutes).toBe(25 * 60);
    expect(dayWindow('America/New_York', '2026-11-10').minutes).toBe(24 * 60);
  });

  it('suma días a través de fin de mes y año', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
  });

  it('detecta cuando otra zona ya está en otro día', () => {
    const t = at('2026-11-10T20:00:00Z');
    expect(dayShift('Pacific/Auckland', t, '2026-11-10')).toBe(1);
    expect(dayShift('Pacific/Honolulu', t, '2026-11-10')).toBe(0);
  });
});

describe('próximo cambio de horario', () => {
  it('encuentra el fin del horario de verano en Nueva York', () => {
    const change = nextOffsetChange('America/New_York', at('2026-10-20T00:00:00Z'));
    expect(change).toMatchObject({ date: '2026-11-01', from: -240, to: -300 });
  });

  it('no inventa cambios en zonas sin horario de verano', () => {
    expect(nextOffsetChange('America/Mexico_City', at('2026-10-20T00:00:00Z'))).toBeNull();
  });
});

describe('disponibilidad', () => {
  it('marca fin de semana cuando en Tokio ya es sábado', () => {
    const fridayEveningMx = at('2026-11-14T00:00:00Z'); // vie 18:00 CDMX = sáb 09:00 Tokio
    expect(availabilityAt(person('Ana', 'America/Mexico_City'), fridayEveningMx)).toBe('edge');
    expect(availabilityAt(person('Ken', 'Asia/Tokyo'), fridayEveningMx)).toBe('weekend');
    expect(availabilityAt(person('Ken', 'Asia/Tokyo'), fridayEveningMx, true)).toBe('work');
  });

  it('soporta jornadas que cruzan medianoche', () => {
    const night = person('Noa', 'UTC', 22 * 60, 6 * 60);
    expect(availabilityAt(night, at('2026-11-10T23:00:00Z'))).toBe('work');
    expect(availabilityAt(night, at('2026-11-10T03:00:00Z'))).toBe('work');
    expect(availabilityAt(night, at('2026-11-10T12:00:00Z'))).toBe('off');
  });
});

describe('solapamiento y sugerencias', () => {
  const team = [person('Ana', 'America/Mexico_City', 540, 1020), person('Leo', 'Europe/Madrid')];

  it('encuentra la franja común', () => {
    const day = buildDay(team, 'America/Mexico_City', '2026-11-10');
    expect(day.slots).toHaveLength(96);
    // CDMX 09:00–11:00 = Madrid 16:00–18:00
    expect(overlapRanges(day, team.length)).toEqual([{ from: 36, to: 44 }]);
  });

  it('sugiere una reunión dentro de la franja', () => {
    const day = buildDay(team, 'America/Mexico_City', '2026-11-10');
    const s = suggest(day, team.length, 2)!;
    expect(s.attendees).toBe(2);
    expect(s.range.from).toBeGreaterThanOrEqual(36);
    expect(s.range.to).toBeLessThanOrEqual(44);
  });

  it('sin coincidencia total, propone el bloque con más gente', () => {
    const far = [...team, person('Mei', 'Asia/Shanghai')];
    const day = buildDay(far, 'America/Mexico_City', '2026-11-10');
    expect(overlapRanges(day, far.length)).toEqual([]);
    expect(suggest(day, far.length)!.attendees).toBe(2);
  });
});

describe('enlace compartible', () => {
  it('ida y vuelta con acentos y emojis', () => {
    const state = { people: [person('Ñandú 🦤', 'America/Bogota')], date: '2026-11-10', refZone: 'Europe/Madrid', duration: 4 };
    const back = decodeState(encodeState(state))!;
    expect(back.people[0]).toMatchObject({ name: 'Ñandú 🦤', timeZone: 'America/Bogota', workStart: 540, workEnd: 1080 });
    expect(back).toMatchObject({ date: '2026-11-10', refZone: 'Europe/Madrid', duration: 4 });
  });

  it('descarta entradas inválidas o maliciosas', () => {
    const evil = btoa(JSON.stringify({ v: 1, p: [['x', 'Mars/Olympus', 'x', 0, 0], ['y', 'UTC', 'y', 99999, -5]] }));
    const back = decodeState(evil)!;
    expect(back.people).toHaveLength(1);
    expect(back.people[0]).toMatchObject({ workStart: 1439, workEnd: 0 });
    expect(decodeState('basura')).toBeNull();
  });
});

describe('calendario', () => {
  const event = { title: 'Sync; semanal, equipo', start: at('2026-11-10T15:00:00Z'), end: at('2026-11-10T15:30:00Z') };

  it('genera un .ics válido', () => {
    const ics = buildIcs(event, at('2026-11-07T00:00:00Z'));
    expect(ics).toContain('DTSTART:20261110T150000Z');
    expect(ics).toContain('DTEND:20261110T153000Z');
    expect(ics).toContain('SUMMARY:Sync\\; semanal\\, equipo');
    expect(ics.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
  });

  it('genera el enlace de Google Calendar', () => {
    expect(googleCalendarUrl(event)).toContain('dates=20261110T150000Z%2F20261110T153000Z');
  });
});

describe('cobertura mundial', () => {
  const NOW = at('2026-11-10T12:00:00Z');

  it('el catálogo incluye cada zona que conoce el motor de JavaScript', () => {
    const known = new Set(ALL_ZONES);
    const missing = Intl.supportedValuesOf('timeZone').map(canonicalZone).filter((z) => !known.has(z));
    expect(missing).toEqual([]);
    expect(ALL_ZONES.length).toBeGreaterThanOrEqual(418);
  });

  it('cubre todos los desfases del planeta, de UTC−12 a UTC+14', () => {
    const groups = zonesByOffset(NOW);
    expect(groups[0].offset).toBe(-12 * 60);
    expect(groups[groups.length - 1].offset).toBe(14 * 60);
    const engineOffsets = new Set(Intl.supportedValuesOf('timeZone').map((z) => offsetMinutes(z, NOW)));
    for (const off of engineOffsets) expect(groups.some((g) => g.offset === off)).toBe(true);
    // Cada zona aparece exactamente una vez en el explorador.
    const listed = groups.flatMap((g) => g.cities.map((c) => c.timeZone));
    expect(new Set(listed).size).toBe(listed.length);
    expect(listed.length).toBe(ALL_ZONES.length);
  });

  it('todas las zonas tienen nombre y país legibles', () => {
    for (const g of zonesByOffset(NOW)) {
      for (const c of g.cities) {
        expect(c.name, c.timeZone).toMatch(/\S/);
        expect(c.country, c.timeZone).not.toMatch(/^[A-Z]{2}$/);
      }
    }
  });

  it('normaliza los nombres antiguos de zonas', () => {
    expect(canonicalZone('Asia/Calcutta')).toBe('Asia/Kolkata');
    expect(canonicalZone('Europe/Kiev')).toBe('Europe/Kyiv');
    expect(canonicalZone('Europe/Madrid')).toBe('Europe/Madrid');
    const legacy = encodeState({ people: [person('Ravi', 'Asia/Calcutta')] });
    expect(decodeState(legacy)!.people[0].timeZone).toBe('Asia/Kolkata');
  });
});

describe('búsqueda de ciudades', () => {
  const NOW = at('2026-11-10T12:00:00Z');
  const names = (q: string, n = 8) => searchCities(q, n, NOW).map((c) => c.name);

  it('busca por ciudad sin importar acentos', () => {
    expect(names('bogota')[0]).toBe('Bogotá');
    expect(names('sao paulo')[0]).toBe('São Paulo');
  });

  it('busca por país en español', () => {
    expect(names('japon')).toContain('Tokio');
    expect(names('chile', 20)).toEqual(expect.arrayContaining(['Santiago', 'Isla de Pascua']));
  });

  it('busca por desfase', () => {
    expect(names('UTC+5:45')).toContain('Katmandú');
    expect(names('utc−12')).toEqual(['Islas Baker y Howland']);
    expect(names('+14')).toContain('Kiritimati');
    expect(names('gmt-3', 40)).toContain('Buenos Aires');
  });

  it('busca por abreviatura', () => {
    expect(names('EST')[0]).toBe('Nueva York');
    expect(names('jst')[0]).toBe('Tokio');
  });

  it('interpreta desfases escritos de muchas formas', () => {
    expect(parseOffsetQuery('UTC+5:30')).toBe(330);
    expect(parseOffsetQuery('gmt -3')).toBe(-180);
    expect(parseOffsetQuery('+0545')).toBe(345);
    expect(parseOffsetQuery('utc+5.5')).toBe(330);
    expect(parseOffsetQuery('UTC')).toBe(0);
    expect(parseOffsetQuery('+15')).toBeNull();
    expect(parseOffsetQuery('madrid')).toBeNull();
  });
});
