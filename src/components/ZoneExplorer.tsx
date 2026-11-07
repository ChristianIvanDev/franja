import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ALL_ZONES, parseOffsetQuery, zonesByOffset, type City } from '../lib/cities';
import { formatTime } from '../lib/time';

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (city: City) => void;
}

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** Explorador de todas las zonas horarias del mundo, agrupadas por desfase de UTC−12 a UTC+14. */
export function ZoneExplorer({ open, onClose, onPick }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState('');
  // La hora se fija al abrir: así las agrupaciones no cambian mientras se navega la lista.
  const now = useMemo(() => Date.now(), [open]);
  const groups = useMemo(() => (open ? zonesByOffset(now) : []), [open, now]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) {
      setFilter('');
      d.showModal();
    }
    if (!open && d.open) d.close();
  }, [open]);

  const visible = useMemo(() => {
    const q = normalize(filter);
    if (!q) return groups;
    const offset = parseOffsetQuery(filter);
    if (offset !== null) return groups.filter((g) => g.offset === offset);
    return groups
      .map((g) => ({
        ...g,
        cities: g.cities.filter((c) => normalize(`${c.name} ${c.country} ${c.timeZone}`).includes(q)),
      }))
      .filter((g) => g.cities.length > 0);
  }, [groups, filter]);

  const countries = useMemo(() => new Set(groups.flatMap((g) => g.cities.map((c) => c.country))).size, [groups]);

  const jump = (offset: number) => {
    setFilter('');
    requestAnimationFrame(() => {
      listRef.current?.querySelector(`[data-offset="${offset}"]`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      className="explorer"
      aria-labelledby="explorer-title"
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      // El diálogo se monta en <body>, pero en React sus eventos siguen subiendo hasta el formulario.
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="explorer-inner">
        <header className="explorer-head">
          <div>
            <h2 id="explorer-title">Todas las zonas horarias del mundo</h2>
            <p className="muted">
              {ALL_ZONES.length} zonas · {groups.length} desfases · {countries} países y territorios
            </p>
          </div>
          <button type="button" className="btn btn-ghost icon-btn" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </header>

        <div className="explorer-strip" role="list" aria-label="Saltar a un desfase">
          {groups.map((g) => (
            <button type="button"
              key={g.offset}
              role="listitem"
              className="strip-chip"
              onClick={() => jump(g.offset)}
              title={`${g.label} · ${formatTime(g.cities[0].timeZone, now)} · ${g.cities.length} zonas`}
              style={{ ['--h' as string]: Math.min(1, g.cities.length / 40) }}
            >
              <span className="strip-bar" />
              <span className="strip-label mono">{g.label.replace('UTC', '')}</span>
            </button>
          ))}
        </div>

        <input
          className="explorer-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtra por ciudad, país o desfase (p. ej. «Chile» o «UTC+5:45»)"
          aria-label="Filtrar zonas"
          autoFocus
        />

        <div className="explorer-list" ref={listRef}>
          {visible.length === 0 && <p className="muted explorer-empty">Ninguna zona coincide con «{filter}».</p>}
          {visible.map((g) => (
            <section key={g.offset} data-offset={g.offset} className="explorer-group">
              <h3 className="explorer-group-head">
                <span className="mono">{g.label}</span>
                <span className="mono muted">{formatTime(g.cities[0].timeZone, now)}</span>
                <span className="muted">{g.cities.length} {g.cities.length === 1 ? 'zona' : 'zonas'}</span>
              </h3>
              <ul>
                {g.cities.map((c) => (
                  <li key={c.timeZone}>
                    <button type="button" onClick={() => onPick(c)} title={c.timeZone}>
                      <span className="ex-name">{c.name}</span>
                      <span className="ex-country muted">{c.country}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
