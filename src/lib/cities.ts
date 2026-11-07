import catalog from './zones.json';
import { formatOffset, offsetMinutes } from './time';

export interface City {
  name: string;
  country: string;
  timeZone: string;
}

const LEGACY: Record<string, string> = catalog.legacy;
const ZONE_COUNTRY = new Map<string, string>(catalog.zones as [string, string][]);

/** Todas las zonas horarias del mundo (IANA), generadas con `npm run zones`. */
export const ALL_ZONES: string[] = (catalog.zones as [string, string][]).map(([tz]) => tz);

/** Convierte nombres antiguos (Asia/Calcutta) al nombre IANA actual (Asia/Kolkata). */
export function canonicalZone(tz: string): string {
  return LEGACY[tz] ?? tz;
}

/** Ciudades frecuentes con nombre en español. Aparecen primero en las búsquedas. */
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
  { name: 'Nueva York', country: 'Estados Unidos', timeZone: 'America/New_York' },
  { name: 'Miami', country: 'Estados Unidos', timeZone: 'America/New_York' },
  { name: 'Chicago', country: 'Estados Unidos', timeZone: 'America/Chicago' },
  { name: 'Austin', country: 'Estados Unidos', timeZone: 'America/Chicago' },
  { name: 'Denver', country: 'Estados Unidos', timeZone: 'America/Denver' },
  { name: 'Phoenix', country: 'Estados Unidos', timeZone: 'America/Phoenix' },
  { name: 'Los Ángeles', country: 'Estados Unidos', timeZone: 'America/Los_Angeles' },
  { name: 'San Francisco', country: 'Estados Unidos', timeZone: 'America/Los_Angeles' },
  { name: 'Seattle', country: 'Estados Unidos', timeZone: 'America/Los_Angeles' },
  { name: 'Anchorage', country: 'Estados Unidos', timeZone: 'America/Anchorage' },
  { name: 'Honolulu', country: 'Estados Unidos', timeZone: 'Pacific/Honolulu' },
  { name: 'Toronto', country: 'Canadá', timeZone: 'America/Toronto' },
  { name: 'Montreal', country: 'Canadá', timeZone: 'America/Toronto' },
  { name: 'Vancouver', country: 'Canadá', timeZone: 'America/Vancouver' },
  { name: 'San Juan de Terranova', country: 'Canadá', timeZone: 'America/St_Johns' },
  { name: 'Londres', country: 'Reino Unido', timeZone: 'Europe/London' },
  { name: 'Dublín', country: 'Irlanda', timeZone: 'Europe/Dublin' },
  { name: 'Lisboa', country: 'Portugal', timeZone: 'Europe/Lisbon' },
  { name: 'Madrid', country: 'España', timeZone: 'Europe/Madrid' },
  { name: 'Barcelona', country: 'España', timeZone: 'Europe/Madrid' },
  { name: 'Islas Canarias', country: 'España', timeZone: 'Atlantic/Canary' },
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
  { name: 'Ciudad del Cabo', country: 'Sudáfrica', timeZone: 'Africa/Johannesburg' },
  { name: 'Casablanca', country: 'Marruecos', timeZone: 'Africa/Casablanca' },
  { name: 'Dubái', country: 'Emiratos Árabes Unidos', timeZone: 'Asia/Dubai' },
  { name: 'Teherán', country: 'Irán', timeZone: 'Asia/Tehran' },
  { name: 'Karachi', country: 'Pakistán', timeZone: 'Asia/Karachi' },
  { name: 'Bangalore', country: 'India', timeZone: 'Asia/Kolkata' },
  { name: 'Bombay', country: 'India', timeZone: 'Asia/Kolkata' },
  { name: 'Nueva Delhi', country: 'India', timeZone: 'Asia/Kolkata' },
  { name: 'Katmandú', country: 'Nepal', timeZone: 'Asia/Kathmandu' },
  { name: 'Daca', country: 'Bangladés', timeZone: 'Asia/Dhaka' },
  { name: 'Bangkok', country: 'Tailandia', timeZone: 'Asia/Bangkok' },
  { name: 'Yakarta', country: 'Indonesia', timeZone: 'Asia/Jakarta' },
  { name: 'Singapur', country: 'Singapur', timeZone: 'Asia/Singapore' },
  { name: 'Manila', country: 'Filipinas', timeZone: 'Asia/Manila' },
  { name: 'Hong Kong', country: 'China', timeZone: 'Asia/Hong_Kong' },
  { name: 'Pekín', country: 'China', timeZone: 'Asia/Shanghai' },
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
  { name: 'UTC', country: 'Tiempo universal coordinado', timeZone: 'UTC' },
];

/** Nombre en español de la ciudad que da nombre a la zona, cuando difiere del nombre IANA. */
const EXONYMS: Record<string, string> = {
  'Africa/Abidjan': 'Abiyán', 'Africa/Accra': 'Acra', 'Africa/Addis_Ababa': 'Adís Abeba', 'Africa/Algiers': 'Argel',
  'Africa/Dar_es_Salaam': 'Dar es-Salam', 'Africa/Djibouti': 'Yibuti', 'Africa/Khartoum': 'Jartum', 'Africa/Kinshasa': 'Kinsasa',
  'Africa/Mogadishu': 'Mogadiscio', 'Africa/Tripoli': 'Trípoli', 'Africa/Tunis': 'Túnez', 'Africa/El_Aaiun': 'El Aaiún',
  'Africa/Ndjamena': 'Yamena', 'Africa/Sao_Tome': 'Santo Tomé', 'Africa/Porto-Novo': 'Porto Novo',
  'America/Argentina/Cordoba': 'Córdoba', 'America/Argentina/Tucuman': 'Tucumán', 'America/Asuncion': 'Asunción',
  'America/Belize': 'Belice', 'America/Bogota': 'Bogotá', 'America/Cancun': 'Cancún', 'America/Cayman': 'Islas Caimán',
  'America/Ciudad_Juarez': 'Ciudad Juárez', 'America/El_Salvador': 'San Salvador', 'America/Havana': 'La Habana',
  'America/Jamaica': 'Kingston', 'America/Manaus': 'Manaos', 'America/Martinique': 'Martinica', 'America/Mazatlan': 'Mazatlán',
  'America/Merida': 'Mérida', 'America/Mexico_City': 'Ciudad de México', 'America/Noronha': 'Fernando de Noronha',
  'America/Panama': 'Ciudad de Panamá', 'America/Port-au-Prince': 'Puerto Príncipe', 'America/Port_of_Spain': 'Puerto España',
  'America/Bahia_Banderas': 'Bahía de Banderas', 'America/Belem': 'Belém', 'America/Cuiaba': 'Cuiabá',
  'America/Guatemala': 'Ciudad de Guatemala', 'America/Sao_Paulo': 'São Paulo', 'America/St_Johns': 'San Juan de Terranova',
  'America/Costa_Rica': 'San José', 'America/Guayaquil': 'Guayaquil', 'America/Puerto_Rico': 'San Juan',
  'America/Santo_Domingo': 'Santo Domingo', 'America/Los_Angeles': 'Los Ángeles', 'America/New_York': 'Nueva York',
  'America/Thule': 'Pituffik', 'America/Grand_Turk': 'Islas Turcas y Caicos',
  'Asia/Amman': 'Amán', 'Asia/Almaty': 'Almatý', 'Asia/Baghdad': 'Bagdad', 'Asia/Baku': 'Bakú', 'Asia/Beirut': 'Beirut',
  'Asia/Damascus': 'Damasco', 'Asia/Dhaka': 'Daca', 'Asia/Dubai': 'Dubái', 'Asia/Ho_Chi_Minh': 'Ciudad Ho Chi Minh',
  'Asia/Jerusalem': 'Jerusalén', 'Asia/Kathmandu': 'Katmandú', 'Asia/Kolkata': 'Calcuta', 'Asia/Muscat': 'Mascate',
  'Asia/Pyongyang': 'Pionyang', 'Asia/Qatar': 'Doha', 'Asia/Riyadh': 'Riad', 'Asia/Seoul': 'Seúl', 'Asia/Shanghai': 'Shanghái',
  'Asia/Singapore': 'Singapur', 'Asia/Taipei': 'Taipéi', 'Asia/Tashkent': 'Taskent', 'Asia/Tbilisi': 'Tiflis',
  'Asia/Tehran': 'Teherán', 'Asia/Thimphu': 'Timbu', 'Asia/Tokyo': 'Tokio', 'Asia/Ulaanbaatar': 'Ulán Bator',
  'Asia/Yangon': 'Rangún', 'Asia/Yekaterinburg': 'Ekaterimburgo', 'Asia/Yerevan': 'Ereván', 'Asia/Jakarta': 'Yakarta',
  'Asia/Kabul': 'Kabul', 'Asia/Kuwait': 'Kuwait', 'Asia/Bahrain': 'Baréin', 'Asia/Aden': 'Adén', 'Asia/Nicosia': 'Nicosia',
  'Asia/Dili': 'Dili', 'Asia/Macau': 'Macao', 'Asia/Brunei': 'Brunéi', 'Asia/Phnom_Penh': 'Nom Pen', 'Asia/Vientiane': 'Vientián',
  'Atlantic/Azores': 'Azores', 'Atlantic/Canary': 'Islas Canarias', 'Atlantic/Cape_Verde': 'Cabo Verde',
  'Atlantic/Faroe': 'Islas Feroe', 'Atlantic/Reykjavik': 'Reikiavik', 'Atlantic/South_Georgia': 'Georgias del Sur',
  'Atlantic/St_Helena': 'Santa Elena', 'Atlantic/Bermuda': 'Bermudas',
  'Australia/Adelaide': 'Adelaida', 'Australia/Lord_Howe': 'Isla Lord Howe', 'Australia/Sydney': 'Sídney',
  'Europe/Amsterdam': 'Ámsterdam', 'Europe/Athens': 'Atenas', 'Europe/Belgrade': 'Belgrado', 'Europe/Berlin': 'Berlín',
  'Europe/Brussels': 'Bruselas', 'Europe/Bucharest': 'Bucarest', 'Europe/Chisinau': 'Chisináu', 'Europe/Copenhagen': 'Copenhague',
  'Europe/Dublin': 'Dublín', 'Europe/Istanbul': 'Estambul', 'Europe/Kyiv': 'Kiev', 'Europe/Lisbon': 'Lisboa',
  'Europe/London': 'Londres', 'Europe/Luxembourg': 'Luxemburgo', 'Europe/Monaco': 'Mónaco', 'Europe/Moscow': 'Moscú',
  'Europe/Paris': 'París', 'Europe/Prague': 'Praga', 'Europe/Rome': 'Roma', 'Europe/Sofia': 'Sofía', 'Europe/Stockholm': 'Estocolmo',
  'Europe/Tallinn': 'Tallin', 'Europe/Vatican': 'Ciudad del Vaticano', 'Europe/Vienna': 'Viena', 'Europe/Vilnius': 'Vilna',
  'Europe/Warsaw': 'Varsovia', 'Europe/Zurich': 'Zúrich', 'Europe/Tirane': 'Tirana', 'Europe/San_Marino': 'San Marino',
  'Europe/Gibraltar': 'Gibraltar', 'Europe/Kaliningrad': 'Kaliningrado', 'Europe/Samara': 'Samara', 'Europe/Volgograd': 'Volgogrado',
  'Indian/Maldives': 'Maldivas', 'Indian/Mauritius': 'Mauricio', 'Indian/Reunion': 'Reunión', 'Indian/Christmas': 'Isla de Navidad',
  'Indian/Cocos': 'Islas Cocos', 'Indian/Comoro': 'Comoras', 'Indian/Mahe': 'Seychelles', 'Indian/Kerguelen': 'Islas Kerguelen',
  'Pacific/Easter': 'Isla de Pascua', 'Pacific/Fiji': 'Fiyi', 'Pacific/Galapagos': 'Galápagos', 'Pacific/Marquesas': 'Islas Marquesas',
  'Pacific/Noumea': 'Numea', 'Pacific/Norfolk': 'Isla Norfolk', 'Pacific/Tahiti': 'Tahití', 'Pacific/Pitcairn': 'Islas Pitcairn',
  'Pacific/Chatham': 'Islas Chatham', 'Pacific/Gambier': 'Islas Gambier', 'Pacific/Kanton': 'Isla Kanton',
  'Pacific/Kiritimati': 'Kiritimati', 'Pacific/Wake': 'Isla Wake', 'Pacific/Midway': 'Midway', 'Pacific/Niue': 'Niue',
  'Etc/GMT+12': 'Islas Baker y Howland', UTC: 'UTC',
};

const regionNames = (() => {
  try {
    return new Intl.DisplayNames('es', { type: 'region' });
  } catch {
    return null;
  }
})();

function countryName(tz: string): string {
  const cc = ZONE_COUNTRY.get(tz);
  if (tz === 'UTC') return 'Tiempo universal coordinado';
  if (!cc) return tz.split('/')[0];
  return regionNames?.of(cc) ?? cc;
}

function zoneCity(tz: string): string {
  return EXONYMS[tz] ?? tz.split('/').pop()!.replace(/_/g, ' ');
}

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** Una entrada por zona del catálogo, más las ciudades populares en español. */
let catalogCache: City[] | null = null;
export function allCities(): City[] {
  if (catalogCache) return catalogCache;
  const covered = new Set(CITIES.map((c) => `${c.timeZone}|${normalize(c.name)}`));
  const zones = ALL_ZONES.map((tz) => ({ name: zoneCity(tz), country: countryName(tz), timeZone: tz })).filter(
    (c) => !covered.has(`${c.timeZone}|${normalize(c.name)}`),
  );
  catalogCache = [...CITIES, ...zones];
  return catalogCache;
}

const genericCache = new Map<string, string>();
/** Nombre genérico de la zona en español, p. ej. «hora de Europa central». */
export function genericName(tz: string): string {
  let name = genericCache.get(tz);
  if (name === undefined) {
    try {
      name =
        new Intl.DateTimeFormat('es', { timeZone: tz, timeZoneName: 'longGeneric' })
          .formatToParts(new Date())
          .find((p) => p.type === 'timeZoneName')?.value ?? '';
    } catch {
      name = '';
    }
    genericCache.set(tz, name);
  }
  return name;
}

/** Abreviaturas comunes → zona representativa. Se muestran también las zonas con el mismo desfase. */
const ABBREVIATIONS: Record<string, string> = {
  est: 'America/New_York', edt: 'America/New_York', cst: 'America/Chicago', cdt: 'America/Chicago',
  mst: 'America/Denver', mdt: 'America/Denver', pst: 'America/Los_Angeles', pdt: 'America/Los_Angeles',
  akst: 'America/Anchorage', hst: 'Pacific/Honolulu', ast: 'America/Puerto_Rico', nst: 'America/St_Johns',
  gmt: 'Europe/London', bst: 'Europe/London', wet: 'Europe/Lisbon', cet: 'Europe/Paris', cest: 'Europe/Paris',
  eet: 'Europe/Athens', eest: 'Europe/Athens', msk: 'Europe/Moscow', sast: 'Africa/Johannesburg',
  wat: 'Africa/Lagos', cat: 'Africa/Maputo', eat: 'Africa/Nairobi', gst: 'Asia/Dubai', pkt: 'Asia/Karachi',
  ist: 'Asia/Kolkata', npt: 'Asia/Kathmandu', ict: 'Asia/Bangkok', wib: 'Asia/Jakarta', sgt: 'Asia/Singapore',
  hkt: 'Asia/Hong_Kong', pht: 'Asia/Manila', jst: 'Asia/Tokyo', kst: 'Asia/Seoul', awst: 'Australia/Perth',
  acst: 'Australia/Adelaide', aest: 'Australia/Sydney', aedt: 'Australia/Sydney', nzst: 'Pacific/Auckland',
  nzdt: 'Pacific/Auckland', art: 'America/Argentina/Buenos_Aires', brt: 'America/Sao_Paulo', clt: 'America/Santiago',
  cot: 'America/Bogota', pet: 'America/Lima', vet: 'America/Caracas', ect: 'America/Guayaquil', bot: 'America/La_Paz',
  pyt: 'America/Asuncion', uyt: 'America/Montevideo',
};

/** Interpreta «UTC+5:30», «gmt-3», «+0545», «utc +9», «UTC−12» como desfase en minutos. */
export function parseOffsetQuery(query: string): number | null {
  const q = normalize(query).replace(/\s+/g, '').replace(/[−–]/g, '-');
  if (q === 'utc' || q === 'gmt' || q === 'z') return 0;
  const m = q.match(/^(?:utc|gmt)?([+-])(\d{1,2})(?::?(\d{2})|[.,](\d{1,2}))?$/);
  if (!m) return null;
  const hours = Number(m[2]);
  let minutes = 0;
  if (m[3]) minutes = Number(m[3]);
  else if (m[4]) minutes = Math.round(Number(`0.${m[4]}`) * 60);
  if (hours > 14 || minutes >= 60) return null;
  return (m[1] === '-' ? -1 : 1) * (hours * 60 + minutes);
}

export function searchCities(query: string, limit = 8, now = Date.now()): City[] {
  const q = normalize(query);
  if (!q) return CITIES.slice(0, limit);
  const all = allCities();

  const offset = parseOffsetQuery(query);
  if (offset !== null) {
    // Por desfase: primero las ciudades conocidas, luego el resto de zonas.
    return all.filter((c) => offsetMinutes(c.timeZone, now) === offset).slice(0, limit);
  }

  const abbr = ABBREVIATIONS[q];
  if (abbr) {
    const target = offsetMinutes(abbr, now);
    const head = all.filter((c) => c.timeZone === abbr);
    const rest = all.filter((c) => c.timeZone !== abbr && offsetMinutes(c.timeZone, now) === target);
    return [...head, ...rest].slice(0, limit);
  }

  const zoneQuery = q.replace(/ /g, '_');
  const score = (c: City) => {
    const n = normalize(c.name);
    const country = normalize(c.country);
    if (n === q) return 0;
    if (n.startsWith(q)) return 1;
    if (n.split(/[\s-]/).some((w) => w.startsWith(q))) return 2;
    if (country.startsWith(q)) return 3;
    if (n.includes(q)) return 4;
    if (country.includes(q)) return 5;
    if (normalize(c.timeZone).includes(zoneQuery)) return 6;
    if (q.length >= 4 && normalize(genericName(c.timeZone)).includes(q)) return 7;
    return 99;
  };
  return all
    .map((c, i) => ({ c, s: score(c), i }))
    .filter((x) => x.s < 99)
    .sort((a, b) => a.s - b.s || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.c);
}

export function cityForZone(timeZone: string): City {
  const tz = canonicalZone(timeZone);
  return CITIES.find((c) => c.timeZone === tz) ?? { name: zoneCity(tz), country: countryName(tz), timeZone: tz };
}

export interface OffsetGroup {
  offset: number;
  label: string;
  cities: City[];
}

/** Todas las zonas agrupadas por su desfase actual, de UTC−12 a UTC+14. */
export function zonesByOffset(now = Date.now()): OffsetGroup[] {
  const groups = new Map<number, City[]>();
  const seen = new Set<string>();
  for (const c of allCities()) {
    // Una entrada por zona en el explorador: la ciudad en español si existe, si no el nombre IANA.
    if (seen.has(c.timeZone)) continue;
    seen.add(c.timeZone);
    const off = offsetMinutes(c.timeZone, now);
    if (!groups.has(off)) groups.set(off, []);
    groups.get(off)!.push(c);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([offset, cities]) => ({
      offset,
      label: formatOffset(offset),
      cities: cities.sort((a, b) => a.name.localeCompare(b.name, 'es')),
    }));
}
