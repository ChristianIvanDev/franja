// Genera las capturas del README (modo claro y oscuro) con Chrome sin interfaz.
// Habla con Chrome por el protocolo DevTools usando el WebSocket nativo de Node: no instala nada.
//
// Uso:
//   npm run dev                      # en otra terminal
//   npm run screenshots              # o: node scripts/screenshots.mjs http://localhost:5173/
//   CHROME="/ruta/a/chrome" npm run screenshots

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.argv[2] ?? 'http://localhost:5173/';
const OUT = fileURLToPath(new URL('../docs/', import.meta.url));
const PORT = 9333;
mkdirSync(OUT, { recursive: true });

const CANDIDATES = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const chromePath = CANDIDATES.find((p) => existsSync(p));
if (!chromePath) throw new Error('No encontré Chrome. Indica la ruta con la variable CHROME.');

// Equipo de ejemplo: cinco ciudades con una franja común de 1 h 30 min.
const STATE = {
  v: 1,
  p: [
    ['Ana Torres', 'America/Mexico_City', 'Ciudad de México', 540, 1080],
    ['Leo García', 'Europe/Madrid', 'Madrid', 540, 1080],
    ['Sofía Rossi', 'America/Argentina/Buenos_Aires', 'Buenos Aires', 600, 1140],
    ['Mark Allen', 'America/New_York', 'Nueva York', 540, 1050],
    ['Priya Nair', 'Asia/Kolkata', 'Bangalore', 720, 1320],
  ],
  d: '2026-11-10',
  r: 'America/Mexico_City',
  l: 4,
};
const URL_WITH_TEAM = `${BASE}#${Buffer.from(JSON.stringify(STATE)).toString('base64url')}`;

const SHOTS = [
  { name: 'franja', prepare: null },
  {
    name: 'explorador',
    // Abre el formulario y el explorador de zonas, como lo haría una persona.
    prepare: `(async () => {
      [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Agregar persona')).click();
      await new Promise((r) => setTimeout(r, 200));
      document.querySelector('.link-btn').click();
      await new Promise((r) => setTimeout(r, 600));
    })()`,
  },
];

const profile = mkdtempSync(join(tmpdir(), 'franja-shots-'));
const chrome = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--no-first-run',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  'about:blank',
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      const page = targets.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      /* Chrome todavía está arrancando */
    }
    await sleep(200);
  }
  throw new Error('Chrome no respondió en el puerto de depuración.');
}

const ws = new WebSocket(await connect());
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let nextId = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

try {
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1080, deviceScaleFactor: 2, mobile: false });

  for (const scheme of ['claro', 'oscuro']) {
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-color-scheme', value: scheme === 'oscuro' ? 'dark' : 'light' }],
    });
    for (const shot of SHOTS) {
      await send('Page.navigate', { url: 'about:blank' });
      await send('Page.navigate', { url: URL_WITH_TEAM });
      await sleep(1500); // carga, fuentes y animaciones de entrada
      await send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });
      if (shot.prepare) await send('Runtime.evaluate', { expression: shot.prepare, awaitPromise: true });
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      const file = join(OUT, `${shot.name}-${scheme}.png`);
      writeFileSync(file, Buffer.from(data, 'base64'));
      console.log(`✓ docs/${shot.name}-${scheme}.png`);
    }
  }
} finally {
  await send('Browser.close').catch(() => {});
  ws.close();
  chrome.kill();
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}
