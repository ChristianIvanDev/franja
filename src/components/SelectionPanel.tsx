import { useState } from 'react';
import { buildIcs, googleCalendarUrl } from '../lib/calendar';
import { availabilityAt, type Availability, type DaySchedule, type Person, type Range } from '../lib/schedule';
import { dayShift, formatDate, formatTime } from '../lib/time';
import { Avatar } from './Avatar';

interface Props {
  people: Person[];
  day: DaySchedule;
  range: Range;
  refZone: string;
  ymd: string;
  includeWeekends: boolean;
  isSuggestion: boolean;
  onCopyLink: () => void;
}

const STATUS: Record<Availability, string> = {
  work: 'En jornada',
  edge: 'Al límite',
  off: 'Fuera de horario',
  weekend: 'Fin de semana',
};

const RANK: Record<Availability, number> = { weekend: 0, off: 1, edge: 2, work: 3 };

export function SelectionPanel({ people, day, range, refZone, ymd, includeWeekends, isSuggestion, onCopyLink }: Props) {
  const [title, setTitle] = useState('Reunión de equipo');
  const start = day.slots[range.from].start;
  const end = day.slots[range.to - 1].end;
  const minutes = Math.round((end - start) / 60_000);

  // El peor estado de cada persona durante toda la reunión.
  const rows = people.map((p) => {
    let worst: Availability = 'work';
    for (let i = range.from; i < range.to; i++) {
      const a = availabilityAt(p, day.slots[i].start, includeWeekends);
      if (RANK[a] < RANK[worst]) worst = a;
    }
    return { p, worst, shift: dayShift(p.timeZone, start, ymd) };
  });
  const ok = rows.filter((r) => r.worst === 'work').length;

  const description = [
    'Horario por persona:',
    ...rows.map((r) => `• ${r.p.name} (${r.p.city}): ${formatTime(r.p.timeZone, start)}–${formatTime(r.p.timeZone, end)}`),
    '',
    `Planificado con Franja: ${location.href}`,
  ].join('\n');
  const event = { title, start, end, description };

  const downloadIcs = () => {
    const blob = new Blob([buildIcs(event)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase() || 'reunion'}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="card selection" aria-live="polite">
      <div className="selection-head">
        <div>
          <span className="eyebrow">{isSuggestion ? 'Mejor horario sugerido' : 'Horario seleccionado'}</span>
          <h2 className="selection-time mono">
            {formatTime(refZone, start)}–{formatTime(refZone, end)}
          </h2>
          <p className="muted">
            {formatDate(refZone, start, { weekday: 'long', day: 'numeric', month: 'long' })} · {minutes} min ·{' '}
            <strong className={ok === people.length ? 'good' : 'warn'}>
              {ok === people.length ? 'todos en jornada' : `${ok} de ${people.length} en jornada`}
            </strong>
          </p>
        </div>
      </div>

      <ul className="selection-list">
        {rows.map(({ p, worst, shift }) => (
          <li key={p.id}>
            <Avatar name={p.name} size={28} />
            <span className="sel-name">
              {p.name}
              <span className="muted"> · {p.city}</span>
            </span>
            <span className="sel-time mono">
              {formatTime(p.timeZone, start)}–{formatTime(p.timeZone, end)}
              {shift !== 0 && <span className="day-badge">{shift > 0 ? 'día siguiente' : 'día anterior'}</span>}
            </span>
            <span className={`status status-${worst}`}>{STATUS[worst]}</span>
          </li>
        ))}
      </ul>

      <div className="selection-actions">
        <label className="field grow">
          <span>Título del evento</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
        </label>
        <div className="btn-row">
          <button className="btn btn-primary" onClick={downloadIcs}>
            Descargar .ics
          </button>
          <a className="btn" href={googleCalendarUrl(event)} target="_blank" rel="noreferrer noopener">
            Google Calendar
          </a>
          <button className="btn" onClick={onCopyLink}>
            Copiar enlace
          </button>
        </div>
      </div>
    </section>
  );
}
