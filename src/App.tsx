import { useCallback, useEffect, useMemo, useState } from 'react';
import { PersonForm } from './components/PersonForm';
import { SelectionPanel } from './components/SelectionPanel';
import { Timeline } from './components/Timeline';
import { cityForZone } from './lib/cities';
import { buildDay, overlapRanges, suggest, type Person, type Range } from './lib/schedule';
import { decodeState, encodeState, type ShareState } from './lib/share';
import { SLOT_MINUTES, addDays, formatDate, formatOffset, formatTime, nextOffsetChange, todayIn, zonedToInstant } from './lib/time';

const LOCAL_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const STORAGE_KEY = 'franja:v1';
const DURATIONS = [2, 3, 4, 6]; // en bloques de 15 min

const uid = () => Math.random().toString(36).slice(2, 10);

const SAMPLES: Record<string, Omit<Person, 'id'>[]> = {
  'Equipo remoto': [
    { name: 'Ana Torres', city: 'Ciudad de México', timeZone: 'America/Mexico_City', workStart: 540, workEnd: 1080 },
    { name: 'Leo García', city: 'Madrid', timeZone: 'Europe/Madrid', workStart: 540, workEnd: 1080 },
    { name: 'Sofía Rossi', city: 'Buenos Aires', timeZone: 'America/Argentina/Buenos_Aires', workStart: 600, workEnd: 1140 },
    { name: 'Mark Allen', city: 'Nueva York', timeZone: 'America/New_York', workStart: 540, workEnd: 1050 },
  ],
  'Equipo global': [
    { name: 'Diego Ruiz', city: 'Bogotá', timeZone: 'America/Bogota', workStart: 480, workEnd: 1020 },
    { name: 'Priya Nair', city: 'Bangalore', timeZone: 'Asia/Kolkata', workStart: 600, workEnd: 1140 },
    { name: 'Emma Clarke', city: 'Londres', timeZone: 'Europe/London', workStart: 540, workEnd: 1050 },
    { name: 'Kenji Sato', city: 'Tokio', timeZone: 'Asia/Tokyo', workStart: 600, workEnd: 1140 },
    { name: 'Liam Walsh', city: 'Sídney', timeZone: 'Australia/Sydney', workStart: 480, workEnd: 990 },
  ],
};

function readInitial(): ShareState {
  const fromHash = location.hash.length > 1 ? decodeState(location.hash) : null;
  if (fromHash) return fromHash;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const fromStorage = saved ? decodeState(saved) : null;
    if (fromStorage) return { ...fromStorage, date: undefined };
  } catch {
    /* almacenamiento bloqueado: empezamos vacío */
  }
  return { people: [] };
}

function readTheme(): 'light' | 'dark' | null {
  try {
    const t = localStorage.getItem('franja:theme');
    return t === 'light' || t === 'dark' ? t : null;
  } catch {
    return null;
  }
}

export default function App() {
  const initial = useMemo(readInitial, []);
  const [people, setPeople] = useState<Person[]>(initial.people);
  const [refZone, setRefZone] = useState(initial.refZone ?? LOCAL_ZONE);
  // Si hoy es fin de semana, abrimos en el siguiente día laborable: un sábado vacío no ayuda a nadie.
  const [ymd, setYmd] = useState(initial.date ?? nextWorkday(todayIn(initial.refZone ?? LOCAL_ZONE)));
  const [duration, setDuration] = useState(initial.duration ?? 2);
  const [includeWeekends, setIncludeWeekends] = useState(false);
  const [manual, setManual] = useState<Range | null>(null);
  const [editing, setEditing] = useState<Person | 'new' | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [theme, setTheme] = useState(readTheme);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
    try {
      if (theme) localStorage.setItem('franja:theme', theme);
      else localStorage.removeItem('franja:theme');
    } catch {
      /* sin almacenamiento */
    }
  }, [theme]);

  // La URL siempre refleja el estado: copiarla es compartir el equipo.
  const encoded = useMemo(
    () => (people.length ? encodeState({ people, date: ymd, refZone, duration }) : ''),
    [people, ymd, refZone, duration],
  );
  useEffect(() => {
    history.replaceState(null, '', encoded ? `#${encoded}` : location.pathname + location.search);
    try {
      if (encoded) localStorage.setItem(STORAGE_KEY, encoded);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* sin almacenamiento */
    }
  }, [encoded]);

  useEffect(() => setManual(null), [people, ymd, refZone, duration, includeWeekends]);

  const day = useMemo(() => buildDay(people, refZone, ymd, includeWeekends), [people, refZone, ymd, includeWeekends]);
  const overlaps = useMemo(() => overlapRanges(day, people.length), [day, people.length]);
  const suggestion = useMemo(() => suggest(day, people.length, duration, people), [day, people, duration]);
  const selection = manual ?? suggestion?.range ?? null;
  const overlapMinutes = overlaps.reduce((sum, r) => sum + (r.to - r.from) * SLOT_MINUTES, 0);

  const dstChanges = useMemo(() => {
    const zones = [...new Set([refZone, ...people.map((p) => p.timeZone)])];
    return zones
      .map((z) => nextOffsetChange(z, day.start, 30))
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => a.instant - b.instant);
  }, [people, refZone, day.start]);

  const refOptions = useMemo(() => {
    const zones = [...new Set([LOCAL_ZONE, refZone, ...people.map((p) => p.timeZone), 'UTC'])];
    return zones.map((z) => {
      const person = people.find((p) => p.timeZone === z);
      const name = z === 'UTC' ? 'UTC' : person?.city ?? cityForZone(z).name;
      return { z, label: z === LOCAL_ZONE ? `${name} (tu zona)` : name };
    });
  }, [people, refZone]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      flash('Enlace copiado: quien lo abra verá este mismo equipo');
    } catch {
      flash('No se pudo copiar; copia la dirección del navegador');
    }
  }, []);

  const savePerson = (data: Omit<Person, 'id'>) => {
    if (editing && editing !== 'new') setPeople((ps) => ps.map((p) => (p.id === editing.id ? { ...data, id: p.id } : p)));
    else setPeople((ps) => [...ps, { ...data, id: uid() }]);
    setEditing(null);
  };

  const loadSample = (key: string) => {
    setPeople(SAMPLES[key].map((p) => ({ ...p, id: uid() })));
    setRefZone(SAMPLES[key][0].timeZone);
    setYmd(nextWeekday(todayIn(SAMPLES[key][0].timeZone)));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('input, select, textarea, [role="slider"]') || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'n') {
        e.preventDefault();
        setEditing('new');
      } else if (e.key === 't') setYmd(todayIn(refZone));
      else if (e.key === '[') setYmd((d) => addDays(d, -1));
      else if (e.key === ']') setYmd((d) => addDays(d, 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [refZone]);

  const isToday = ymd === todayIn(refZone, now);
  const dateInstant = zonedToInstant(refZone, ymd, 720);

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href={import.meta.env.BASE_URL} aria-label="Franja, inicio">
          <Logo />
          <span>Franja</span>
        </a>
        <div className="topbar-actions">
          {people.length > 0 && (
            <button className="btn btn-ghost" onClick={copyLink}>
              Compartir
            </button>
          )}
          <button
            className="btn btn-ghost icon-btn"
            aria-label="Cambiar tema"
            onClick={() => setTheme(document.documentElement.matches('[data-theme="dark"]') || (!theme && matchMedia('(prefers-color-scheme: dark)').matches) ? 'light' : 'dark')}
          >
            <ThemeIcon />
          </button>
          <a className="btn btn-ghost icon-btn" href="https://github.com/ChristianIvanDev/franja" target="_blank" rel="noreferrer" aria-label="Código en GitHub">
            <GitHubIcon />
          </a>
        </div>
      </header>

      <main>
        {people.length === 0 && !editing ? (
          <section className="hero">
            <h1>Encuentra la hora en la que todo tu equipo coincide.</h1>
            <p className="lead">
              Agrega a cada persona con su ciudad y su horario. Franja calcula la franja común, tiene en cuenta los cambios de
              horario y te deja enviar la invitación en un clic. Sin cuentas: todo vive en el enlace.
            </p>
            <div className="btn-row">
              <button className="btn btn-primary btn-lg" onClick={() => setEditing('new')}>
                Agregar la primera persona
              </button>
              {Object.keys(SAMPLES).map((k) => (
                <button key={k} className="btn btn-lg" onClick={() => loadSample(k)}>
                  Probar con «{k}»
                </button>
              ))}
            </div>
            <HeroArt />
          </section>
        ) : (
          <>
            <section className="toolbar" aria-label="Opciones">
              <div className="date-nav">
                <button className="btn btn-ghost icon-btn" onClick={() => setYmd(addDays(ymd, -1))} aria-label="Día anterior">
                  ‹
                </button>
                <label className="date-label">
                  <span className="date-text">{formatDate(refZone, dateInstant, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                  <input type="date" value={ymd} onChange={(e) => e.target.value && setYmd(e.target.value)} aria-label="Fecha" />
                </label>
                <button className="btn btn-ghost icon-btn" onClick={() => setYmd(addDays(ymd, 1))} aria-label="Día siguiente">
                  ›
                </button>
                {!isToday && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setYmd(todayIn(refZone))}>
                    Hoy
                  </button>
                )}
              </div>

              <label className="field inline">
                <span>Ver horas de</span>
                <select value={refZone} onChange={(e) => setRefZone(e.target.value)}>
                  {refOptions.map((o) => (
                    <option key={o.z} value={o.z}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="field inline">
                <span id="dur-label">Duración</span>
                <div className="segmented" role="radiogroup" aria-labelledby="dur-label">
                  {DURATIONS.map((d) => (
                    <button key={d} role="radio" aria-checked={duration === d} onClick={() => setDuration(d)}>
                      {d * SLOT_MINUTES < 60 ? `${d * SLOT_MINUTES} min` : `${(d * SLOT_MINUTES) / 60} h`}
                    </button>
                  ))}
                </div>
              </div>

              <label className="switch">
                <input type="checkbox" checked={includeWeekends} onChange={(e) => setIncludeWeekends(e.target.checked)} />
                <span>Contar fines de semana</span>
              </label>
            </section>

            {people.length > 0 && (
              <p className="summary">
                {overlapMinutes > 0 ? (
                  <>
                    <span className="summary-dot good" />
                    Coinciden <strong>{formatDuration(overlapMinutes)}</strong>:{' '}
                    {overlaps.map((r, i) => (
                      <span key={r.from} className="mono">
                        {i > 0 && ', '}
                        {formatTime(refZone, day.slots[r.from].start)}–{formatTime(refZone, day.slots[r.to - 1].end)}
                      </span>
                    ))}{' '}
                    <span className="muted">({refOptions.find((o) => o.z === refZone)?.label.replace(' (tu zona)', '')})</span>
                  </>
                ) : (
                  <>
                    <span className="summary-dot warn" />
                    {people.length === 1
                      ? 'Agrega a alguien más para buscar la franja común.'
                      : suggestion
                        ? `No hay una hora en la que coincidan los ${people.length}. La mejor opción reúne a ${suggestion.attendees}.`
                        : 'Nadie está en jornada este día. Prueba con otra fecha o cuenta los fines de semana.'}
                  </>
                )}
              </p>
            )}

            {people.length > 0 && (
              <Timeline
                people={people}
                day={day}
                refZone={refZone}
                ymd={ymd}
                overlaps={overlaps}
                selection={selection}
                duration={duration}
                now={now}
                onSelect={setManual}
                onEdit={setEditing}
              />
            )}

            <div className="below">
              {editing ? (
                <PersonForm
                  key={editing === 'new' ? 'new' : editing.id}
                  initial={editing === 'new' ? undefined : editing}
                  onSave={savePerson}
                  onCancel={() => setEditing(null)}
                  onDelete={
                    editing !== 'new'
                      ? () => {
                          setPeople((ps) => ps.filter((p) => p.id !== editing.id));
                          setEditing(null);
                        }
                      : undefined
                  }
                />
              ) : (
                <div className="legend-row">
                  <button className="btn" onClick={() => setEditing('new')}>
                    + Agregar persona <kbd>N</kbd>
                  </button>
                  <ul className="legend" aria-label="Leyenda">
                    <li><span className="sw sw-work" />En jornada</li>
                    <li><span className="sw sw-edge" />Una hora antes o después</li>
                    <li><span className="sw sw-weekend" />Fin de semana</li>
                    <li><span className="sw sw-overlap" />Todos coinciden</li>
                  </ul>
                </div>
              )}

              {selection && people.length > 0 && (
                <SelectionPanel
                  people={people}
                  day={day}
                  range={selection}
                  refZone={refZone}
                  ymd={ymd}
                  includeWeekends={includeWeekends}
                  isSuggestion={!manual}
                  onCopyLink={copyLink}
                />
              )}

              {dstChanges.length > 0 && (
                <section className="card dst" aria-label="Próximos cambios de horario">
                  <span className="eyebrow">Cambios de horario en los próximos 30 días</span>
                  <ul>
                    {dstChanges.map((c) => (
                      <li key={c.timeZone}>
                        <strong>{people.find((p) => p.timeZone === c.timeZone)?.city ?? cityForZone(c.timeZone).name}</strong> pasa de{' '}
                        <span className="mono">{formatOffset(c.from)}</span> a <span className="mono">{formatOffset(c.to)}</span> el{' '}
                        {formatDate(c.timeZone, c.instant, { weekday: 'long', day: 'numeric', month: 'long' })}. Las reuniones
                        recurrentes con esta zona se moverán {Math.abs(c.to - c.from) / 60} h.
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </>
        )}
      </main>

      <footer className="footer">
        <span>
          Atajos: <kbd>N</kbd> persona · <kbd>[</kbd> <kbd>]</kbd> día · <kbd>T</kbd> hoy · <kbd>←</kbd> <kbd>→</kbd> mover reunión
        </span>
        <span>Tus datos no salen de tu navegador.</span>
      </footer>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} h` : '', m ? `${m} min` : ''].filter(Boolean).join(' ');
}

function nextWorkday(ymd: string): string {
  const wd = new Date(`${ymd}T12:00:00Z`).getUTCDay();
  return wd === 6 ? addDays(ymd, 2) : wd === 0 ? addDays(ymd, 1) : ymd;
}

function nextWeekday(ymd: string): string {
  let d = ymd;
  for (let i = 0; i < 7; i++) {
    const wd = new Date(`${d}T12:00:00Z`).getUTCDay();
    if (wd >= 2 && wd <= 4) return d; // martes a jueves: el ejemplo luce mejor entre semana
    d = addDays(d, 1);
  }
  return ymd;
}

/** Ilustración de la portada: cuatro jornadas desfasadas y la franja donde se cruzan. */
function HeroArt() {
  const rows = [
    { city: 'CDMX', from: 30, to: 66 },
    { city: 'Madrid', from: 4, to: 40 },
    { city: 'Bs. Aires', from: 24, to: 60 },
    { city: 'Nueva York', from: 26, to: 62 },
  ];
  return (
    <div className="hero-art" aria-hidden>
      <span className="hero-band" />
      {rows.map((r) => (
        <div key={r.city} className="hero-row">
          <span className="hero-city">{r.city}</span>
          <span className="hero-track">
            <span className="hero-bar" style={{ left: `${r.from}%`, width: `${r.to - r.from}%` }} />
          </span>
        </div>
      ))}
    </div>
  );
}

function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <rect x="2" y="5" width="20" height="3" rx="1.5" fill="currentColor" opacity=".25" />
      <rect x="2" y="10.5" width="20" height="3" rx="1.5" fill="currentColor" opacity=".25" />
      <rect x="2" y="16" width="20" height="3" rx="1.5" fill="currentColor" opacity=".25" />
      <rect x="9" y="3" width="6" height="18" rx="2" fill="var(--accent)" />
    </svg>
  );
}

function ThemeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
    </svg>
  );
}
