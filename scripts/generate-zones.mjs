// Genera src/lib/zones.json: todas las zonas horarias IANA con su país (código ISO 3166).
//
// Se usa el propio Intl de Node (ICU) en lugar de descargar tzdata:
//   - Intl.supportedValuesOf('timeZone') da la lista de zonas.
//   - Intl.Locale('und-XX').getTimeZones() dice qué zonas tiene cada país.
// ICU todavía usa algunos nombres antiguos (Asia/Calcutta); aquí se normalizan a los actuales.
//
// Uso: node scripts/generate-zones.mjs

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Nombres antiguos de ICU → nombre IANA actual. Los navegadores aceptan ambos. */
export const LEGACY = {
  'Asia/Calcutta': 'Asia/Kolkata',
  'Asia/Katmandu': 'Asia/Kathmandu',
  'Asia/Saigon': 'Asia/Ho_Chi_Minh',
  'Asia/Rangoon': 'Asia/Yangon',
  'Europe/Kiev': 'Europe/Kyiv',
  'America/Godthab': 'America/Nuuk',
  'America/Buenos_Aires': 'America/Argentina/Buenos_Aires',
  'America/Catamarca': 'America/Argentina/Catamarca',
  'America/Cordoba': 'America/Argentina/Cordoba',
  'America/Jujuy': 'America/Argentina/Jujuy',
  'America/Mendoza': 'America/Argentina/Mendoza',
  'America/Indianapolis': 'America/Indiana/Indianapolis',
  'America/Louisville': 'America/Kentucky/Louisville',
  'Atlantic/Faeroe': 'Atlantic/Faroe',
  'Pacific/Enderbury': 'Pacific/Kanton',
  'Pacific/Ponape': 'Pacific/Pohnpei',
  'Pacific/Truk': 'Pacific/Chuuk',
  'Africa/Asmera': 'Africa/Asmara',
  'America/Coral_Harbour': 'America/Atikokan',
};

const zones = Intl.supportedValuesOf('timeZone');
// ICU conserva códigos ISO retirados (JT para la isla Johnston, CT para Cantón y Enderbury…).
// Solo cuentan los códigos que tienen nombre de país; así gana siempre el código vigente.
const regionName = new Intl.DisplayNames('es', { type: 'region', fallback: 'none' });
const country = new Map();
for (let a = 65; a <= 90; a++) {
  for (let b = 65; b <= 90; b++) {
    const code = String.fromCharCode(a, b);
    if (!regionName.of(code)) continue;
    let list;
    try {
      list = new Intl.Locale(`und-${code}`).getTimeZones?.();
    } catch {
      continue;
    }
    for (const tz of list ?? []) if (!country.has(tz)) country.set(tz, code);
  }
}

const missing = zones.filter((z) => !country.has(z));
if (missing.length) throw new Error(`Zonas sin país: ${missing.join(', ')}`);

const rows = zones
  .map((z) => [LEGACY[z] ?? z, country.get(z)])
  // Zonas sin país: UTC y UTC−12, el único desfase del planeta sin zona habitada (islas Baker y Howland).
  .concat([
    ['UTC', ''],
    ['Etc/GMT+12', 'UM'],
  ])
  .sort((x, y) => x[0].localeCompare(y[0]));

const out = fileURLToPath(new URL('../src/lib/zones.json', import.meta.url));
writeFileSync(out, JSON.stringify({ legacy: LEGACY, zones: rows }) + '\n');
console.log(`${rows.length} zonas en ${new Set(rows.map((r) => r[1]).filter(Boolean)).size} países y territorios → src/lib/zones.json`);
