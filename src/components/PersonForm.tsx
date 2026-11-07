import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ALL_ZONES, searchCities, type City } from '../lib/cities';
import { ZoneExplorer } from './ZoneExplorer';
import type { Person } from '../lib/schedule';
import { formatMinutes, formatOffset, formatTime, offsetMinutes } from '../lib/time';

interface Props {
  initial?: Person;
  onSave: (person: Omit<Person, 'id'>) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

const TIMES = Array.from({ length: 48 }, (_, i) => i * 30);

export function PersonForm({ initial, onSave, onDelete, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [city, setCity] = useState<City | null>(initial ? { name: initial.city, country: '', timeZone: initial.timeZone } : null);
  const [query, setQuery] = useState(initial?.city ?? '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [start, setStart] = useState(initial?.workStart ?? 540);
  const [end, setEnd] = useState(initial?.workEnd ?? 1080);
  const [exploring, setExploring] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const results = useMemo(() => searchCities(query), [query]);
  useEffect(() => nameRef.current?.focus(), []);
  useEffect(() => setActive(0), [query]);

  const pick = (c: City) => {
    setCity(c);
    setQuery(c.name);
    setOpen(false);
  };

  const onCityKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && open && results[active]) {
      e.preventDefault();
      pick(results[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city) return;
    onSave({ name: name.trim(), city: city.name, timeZone: city.timeZone, workStart: start, workEnd: end });
  };

  const hours = (end - start + 1440) % 1440 || 1440;

  return (
    <form className="card person-form" onSubmit={submit} onKeyDown={(e) => e.key === 'Escape' && !open && onCancel()}>
      <div className="form-head">
        <h2>{initial ? `Editar a ${initial.name}` : 'Agregar persona'}</h2>
      </div>
      <div className="form-grid">
        <label className="field">
          <span>Nombre</span>
          <input ref={nameRef} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Ana" required />
        </label>

        <div className="field combo">
          <label htmlFor={`${listId}-input`}>Ciudad</label>
          <input
            id={`${listId}-input`}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-activedescendant={open ? `${listId}-${active}` : undefined}
            autoComplete="off"
            value={query}
            placeholder="Ciudad, país, UTC+5:30 o EST"
            onChange={(e) => {
              setQuery(e.target.value);
              setCity(null);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={onCityKey}
            required
          />
          {open && results.length > 0 && (
            <ul className="combo-list" role="listbox" id={listId}>
              {results.map((c, i) => (
                <li
                  key={c.timeZone + c.name}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(c);
                  }}
                  onMouseEnter={() => setActive(i)}
                >
                  <span>
                    <strong>{c.name}</strong> <span className="muted">{c.country}</span>
                  </span>
                  <span className="mono muted">
                    {formatTime(c.timeZone, Date.now())} · {formatOffset(offsetMinutes(c.timeZone, Date.now()))}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {open && query.trim() && results.length === 0 && (
            <div className="combo-list combo-empty">Sin resultados. Prueba con el país o con el desfase, como «UTC−3».</div>
          )}
          <button type="button" className="link-btn" onClick={() => setExploring(true)}>
            Explorar las {ALL_ZONES.length} zonas del mundo
          </button>
          <ZoneExplorer
            open={exploring}
            onClose={() => setExploring(false)}
            onPick={(c) => {
              pick(c);
              setExploring(false);
            }}
          />
        </div>

        <label className="field">
          <span>Empieza</span>
          <select value={start} onChange={(e) => setStart(Number(e.target.value))}>
            {TIMES.map((t) => (
              <option key={t} value={t}>{formatMinutes(t)}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Termina</span>
          <select value={end} onChange={(e) => setEnd(Number(e.target.value))}>
            {TIMES.map((t) => (
              <option key={t} value={t}>{formatMinutes(t)}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="hint">
        Jornada de {hours / 60} h{start > end ? ', cruza la medianoche' : ''}. Las horas son las locales de la persona.
      </p>
      <div className="form-actions">
        {onDelete && (
          <button type="button" className="btn btn-danger" onClick={onDelete}>
            Quitar del equipo
          </button>
        )}
        <span className="spacer" />
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={!name.trim() || !city}>
          {initial ? 'Guardar' : 'Agregar'}
        </button>
      </div>
    </form>
  );
}
