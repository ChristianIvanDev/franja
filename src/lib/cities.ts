export interface City {
  name: string;
  country: string;
  timeZone: string;
}

/** Ciudades frecuentes con nombre en español. Cualquier zona IANA también se puede buscar. */
export const CITIES: City[] = [
  { name: 'Ciudad de México', country: 'México', timeZone: 'America/Mexico_City' },
  { name: 'Guadalajara', country: 'México', timeZone: 'America/Mexico_City' },
  { name: 'Monterrey', country: 'México', timeZone: 'America/Monterrey' },
  { name: 'Tijuana', country: 'México', timeZone: 'America/Tijuana' },
  { name: 'Cancún', country: 'México', timeZone: 'America/Cancun' },
  { name: 'Hermosillo', country: 'México', timeZone: 'America/Hermosillo' },
  { name: 'Bogotá', country: 'Colombia', timeZone: 'America/Bogota' },
  { name: 'Medellín', country: 'Colombia', timeZone: 'America/Bogota' },
  { name: 'Lima', country: 'Perú', timeZone: 'America/Lima' },
  { name: 'Quito', country: 'Ecuador', timeZone: 'America/Guayaquil' },
  { name: 'Caracas', country: 'Venezuela', timeZone: 'America/Caracas' },
  { name: 'Santiago', country: 'Chile', timeZone: 'America/Santiago' },
  { name: 'Buenos Aires', country: 'Argentina', timeZone: 'America/Argentina/Buenos_Aires' },
  { name: 'Montevideo', country: 'Uruguay', timeZone: 'America/Montevideo' },
  { name: 'Asunción', country: 'Paraguay', timeZone: 'America/Asuncion' },
  { name: 'La Paz', country: 'Bolivia', timeZone: 'America/La_Paz' },
  { name: 'São Paulo', country: 'Brasil', timeZone: 'America/Sao_Paulo' },
  { name: 'Ciudad de Guatemala', country: 'Guatemala', timeZone: 'America/Guatemala' },
  { name: 'San José', country: 'Costa Rica', timeZone: 'America/Costa_Rica' },
  { name: 'Ciudad de Panamá', country: 'Panamá', timeZone: 'America/Panama' },
  { name: 'Santo Domingo', country: 'República Dominicana', timeZone: 'America/Santo_Domingo' },
  { name: 'San Juan', country: 'Puerto Rico', timeZone: 'America/Puerto_Rico' },
  { name: 'La Habana', country: 'Cuba', timeZone: 'America/Havana' },
  { name: 'Nueva York', country: 'EE. UU.', timeZone: 'America/New_York' },
  { name: 'Miami', country: 'EE. UU.', timeZone: 'America/New_York' },
  { name: 'Chicago', country: 'EE. UU.', timeZone: 'America/Chicago' },
  { name: 'Austin', country: 'EE. UU.', timeZone: 'America/Chicago' },
  { name: 'Denver', country: 'EE. UU.', timeZone: 'America/Denver' },
  { name: 'Phoenix', country: 'EE. UU.', timeZone: 'America/Phoenix' },
  { name: 'Los Ángeles', country: 'EE. UU.', timeZone: 'America/Los_Angeles' },
  { name: 'San Francisco', country: 'EE. UU.', timeZone: 'America/Los_Angeles' },
  { name: 'Seattle', country: 'EE. UU.', timeZone: 'America/Los_Angeles' },
  { name: 'Anchorage', country: 'EE. UU.', timeZone: 'America/Anchorage' },
  { name: 'Honolulu', country: 'EE. UU.', timeZone: 'Pacific/Honolulu' },
  { name: 'Toronto', country: 'Canadá', timeZone: 'America/Toronto' },
  { name: 'Vancouver', country: 'Canadá', timeZone: 'America/Vancouver' },
  { name: 'San Juan de Terranova', country: 'Canadá', timeZone: 'America/St_Johns' },
  { name: 'Londres', country: 'Reino Unido', timeZone: 'Europe/London' },
  { name: 'Dublín', country: 'Irlanda', timeZone: 'Europe/Dublin' },
  { name: 'Lisboa', country: 'Portugal', timeZone: 'Europe/Lisbon' },
  { name: 'Madrid', country: 'España', timeZone: 'Europe/Madrid' },
  { name: 'Barcelona', country: 'España', timeZone: 'Europe/Madrid' },
  { name: 'Canarias', country: 'España', timeZone: 'Atlantic/Canary' },
  { name: 'París', country: 'Francia', timeZone: 'Europe/Paris' },
  { name: 'Berlín', country: 'Alemania', timeZone: 'Europe/Berlin' },
  { name: 'Ámsterdam', country: 'Países Bajos', timeZone: 'Europe/Amsterdam' },
  { name: 'Roma', country: 'Italia', timeZone: 'Europe/Rome' },
  { name: 'Zúrich', country: 'Suiza', timeZone: 'Europe/Zurich' },
  { name: 'Estocolmo', country: 'Suecia', timeZone: 'Europe/Stockholm' },
  { name: 'Varsovia', country: 'Polonia', timeZone: 'Europe/Warsaw' },
  { name: 'Atenas', country: 'Grecia', timeZone: 'Europe/Athens' },
  { name: 'Kiev', country: 'Ucrania', timeZone: 'Europe/Kyiv' },
  { name: 'Estambul', country: 'Turquía', timeZone: 'Europe/Istanbul' },
  { name: 'Moscú', country: 'Rusia', timeZone: 'Europe/Moscow' },
  { name: 'El Cairo', country: 'Egipto', timeZone: 'Africa/Cairo' },
  { name: 'Lagos', country: 'Nigeria', timeZone: 'Africa/Lagos' },
  { name: 'Nairobi', country: 'Kenia', timeZone: 'Africa/Nairobi' },
  { name: 'Johannesburgo', country: 'Sudáfrica', timeZone: 'Africa/Johannesburg' },
  { name: 'Casablanca', country: 'Marruecos', timeZone: 'Africa/Casablanca' },
  { name: 'Dubái', country: 'Emiratos Árabes', timeZone: 'Asia/Dubai' },
  { name: 'Teherán', country: 'Irán', timeZone: 'Asia/Tehran' },
  { name: 'Karachi', country: 'Pakistán', timeZone: 'Asia/Karachi' },
  { name: 'Bangalore', country: 'India', timeZone: 'Asia/Kolkata' },
  { name: 'Bombay', country: 'India', timeZone: 'Asia/Kolkata' },
  { name: 'Katmandú', country: 'Nepal', timeZone: 'Asia/Kathmandu' },
  { name: 'Daca', country: 'Bangladés', timeZone: 'Asia/Dhaka' },
  { name: 'Bangkok', country: 'Tailandia', timeZone: 'Asia/Bangkok' },
  { name: 'Yakarta', country: 'Indonesia', timeZone: 'Asia/Jakarta' },
  { name: 'Singapur', country: 'Singapur', timeZone: 'Asia/Singapore' },
  { name: 'Manila', country: 'Filipinas', timeZone: 'Asia/Manila' },
  { name: 'Hong Kong', country: 'China', timeZone: 'Asia/Hong_Kong' },
  { name: 'Shanghái', country: 'China', timeZone: 'Asia/Shanghai' },
  { name: 'Taipéi', country: 'Taiwán', timeZone: 'Asia/Taipei' },
  { name: 'Seúl', country: 'Corea del Sur', timeZone: 'Asia/Seoul' },
  { name: 'Tokio', country: 'Japón', timeZone: 'Asia/Tokyo' },
  { name: 'Adelaida', country: 'Australia', timeZone: 'Australia/Adelaide' },
  { name: 'Sídney', country: 'Australia', timeZone: 'Australia/Sydney' },
  { name: 'Melbourne', country: 'Australia', timeZone: 'Australia/Melbourne' },
  { name: 'Brisbane', country: 'Australia', timeZone: 'Australia/Brisbane' },
  { name: 'Perth', country: 'Australia', timeZone: 'Australia/Perth' },
  { name: 'Auckland', country: 'Nueva Zelanda', timeZone: 'Pacific/Auckland' },
  { name: 'Islas Chatham', country: 'Nueva Zelanda', timeZone: 'Pacific/Chatham' },
  { name: 'UTC', country: 'Tiempo universal', timeZone: 'UTC' },
];

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function allZones(): City[] {
  const zones: string[] = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
  const known = new Set(CITIES.map((c) => c.timeZone));
  const knownNames = new Set(CITIES.map((c) => normalize(c.name)));
  return zones
    .filter((z) => !known.has(z))
    .map((z) => {
      const parts = z.split('/');
      return { name: parts[parts.length - 1].replace(/_/g, ' '), country: parts[0], timeZone: z };
    })
    // Evita duplicados como «Katmandu» (alias IANA) junto a «Katmandú».
    .filter((c) => !knownNames.has(normalize(c.name)));
}

let zoneCache: City[] | null = null;

export function searchCities(query: string, limit = 8): City[] {
  const q = normalize(query);
  if (!q) return CITIES.slice(0, limit);
  zoneCache ??= allZones();
  const score = (c: City) => {
    const n = normalize(c.name);
    if (n.startsWith(q)) return 0;
    if (n.includes(q)) return 1;
    if (normalize(c.country).startsWith(q)) return 2;
    if (normalize(c.timeZone).includes(q.replace(/ /g, '_'))) return 3;
    return 9;
  };
  return [...CITIES, ...zoneCache]
    .map((c) => ({ c, s: score(c) }))
    .filter((x) => x.s < 9)
    .sort((a, b) => a.s - b.s)
    .slice(0, limit)
    .map((x) => x.c);
}

export function cityForZone(timeZone: string): City {
  return (
    CITIES.find((c) => c.timeZone === timeZone) ?? {
      name: timeZone.split('/').pop()!.replace(/_/g, ' '),
      country: timeZone.split('/')[0],
      timeZone,
    }
  );
}
