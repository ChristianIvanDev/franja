import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { Availability, DaySchedule, Person, Range } from '../lib/schedule';
import { MINUTE, SLOT_MINUTES, dayShift, formatMinutes, formatOffset, formatTime, minuteOfDay, offsetMinutes } from '../lib/time';
import { Avatar } from './Avatar';

interface Props {
  people: Person[];
  day: DaySchedule;
  refZone: string;
  ymd: string;
  overlaps: Range[];
  selection: Range | null;
  duration: number;
  now: number;
  onSelect: (range: Range) => void;
  onEdit: (person: Person) => void;
}

const LABELS: Record<Availability, string> = {
  work: 'En jornada',
  edge: 'Cerca de su horario',
  off: 'Fuera de horario',
  weekend: 'Fin de semana',
};

interface Segment {
  from: number;
  to: number;
  kind: Availability;
}

function segmentsFor(day: DaySchedule, personIndex: number): Segment[] {
  const out: Segment[] = [];
  day.slots.forEach((slot, i) => {
    const kind = slot.availability[personIndex];
    const last = out[out.length - 1];
    if (last && last.kind === kind) last.to = i + 1;
    else out.push({ from: i, to: i + 1, kind });
  });
  return out;
}

export function Timeline({ people, day, refZone, ymd, overlaps, selection, duration, now, onSelect, onEdit }: Props) {
  const total = day.slots.length;
  const pct = (slot: number) => `${(slot / total) * 100}%`;
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tapRef = useRef<{ x: number; y: number } | null>(null);
  const [drag, setDrag] = useState<{ anchor: number; moved: boolean } | null>(null);

  const hours = useMemo(() => {
    // Una marca por cada hora en punto de la zona de referencia (sirve también en días de 23 o 25 h).
    const marks: { slot: number; label: string }[] = [];
    day.slots.forEach((s, i) => {
      if (minuteOfDay(refZone, s.start) % 60 === 0) marks.push({ slot: i, label: formatTime(refZone, s.start) });
    });
    return marks;
  }, [day, refZone]);

  const slotFromEvent = (e: PointerEvent) => {
    const rect = trackRef.current!.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width - 1);
    return Math.floor((x / rect.width) * total);
  };

  const rangeFromClick = (slot: number): Range => {
    const from = Math.min(Math.max(slot - Math.floor(duration / 2), 0), total - duration);
    return { from, to: from + duration };
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    if (e.pointerType === 'touch') {
      // En pantallas táctiles el gesto horizontal desplaza la línea de tiempo; un toque selecciona.
      tapRef.current = { x: e.clientX, y: e.clientY };
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    const slot = slotFromEvent(e);
    setDrag({ anchor: slot, moved: false });
    onSelect(rangeFromClick(slot));
  };

  const onPointerUp = (e: PointerEvent) => {
    const tap = tapRef.current;
    tapRef.current = null;
    if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 10) onSelect(rangeFromClick(slotFromEvent(e)));
    setDrag(null);
  };

  // Lleva la selección a la vista cuando cambia desde fuera (sugerencia, teclado) y queda oculta.
  useEffect(() => {
    const scroller = scrollRef.current;
    const track = trackRef.current;
    if (!scroller || !track || !selection || drag) return;
    const view = scroller.getBoundingClientRect();
    const rect = track.getBoundingClientRect();
    const left = rect.left + (selection.from / total) * rect.width;
    const right = rect.left + (selection.to / total) * rect.width;
    const peopleCol = (track.previousElementSibling as HTMLElement | null)?.offsetWidth ?? 0;
    if (left < view.left + peopleCol || right > view.right) {
      scroller.scrollBy({ left: (left + right) / 2 - (view.left + peopleCol + (view.width - peopleCol) / 2), behavior: 'smooth' });
    }
  }, [selection?.from, selection?.to, total]);

  const onPointerMove = (e: PointerEvent) => {
    if (!drag) return;
    const slot = slotFromEvent(e);
    if (slot === drag.anchor && !drag.moved) return;
    if (!drag.moved) setDrag({ ...drag, moved: true });
    onSelect({ from: Math.min(drag.anchor, slot), to: Math.max(drag.anchor, slot) + 1 });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const sel = selection ?? { from: 0, to: duration };
    const len = sel.to - sel.from;
    let next: Range | null = null;
    if (e.key === 'ArrowRight') next = e.shiftKey ? { from: sel.from, to: Math.min(total, sel.to + 1) } : { from: Math.min(total - len, sel.from + 1), to: Math.min(total, sel.to + 1) };
    if (e.key === 'ArrowLeft') next = e.shiftKey ? { from: sel.from, to: Math.max(sel.from + 1, sel.to - 1) } : { from: Math.max(0, sel.from - 1), to: Math.max(len, sel.to - 1) };
    if (e.key === 'Home') next = { from: 0, to: len };
    if (e.key === 'End') next = { from: total - len, to: total };
    if (next) {
      e.preventDefault();
      onSelect(next);
    }
  };

  const nowSlot = now >= day.start && now < day.end ? (now - day.start) / (SLOT_MINUTES * MINUTE) : null;
  const selLabel = selection
    ? `${formatTime(refZone, day.slots[selection.from].start)}–${formatTime(refZone, day.slots[selection.to - 1].end)}`
    : '';

  return (
    <div className="timeline" style={{ ['--rows' as string]: people.length }}>
      <div className="timeline-scroll" ref={scrollRef}>
        <div className="timeline-grid">
          <div className="tl-corner">
            <span className="eyebrow">Hora de referencia</span>
            <span className="mono">{formatOffset(offsetMinutes(refZone, day.start))}</span>
          </div>
          <div className="tl-ruler" aria-hidden>
            {hours.map((h) => (
              <span key={h.slot} className="tl-hour" style={{ left: pct(h.slot) }} data-major={h.label.endsWith(':00') && Number(h.label.slice(0, 2)) % 3 === 0}>
                {h.label.slice(0, 2)}
              </span>
            ))}
          </div>

          <div className="tl-people">
            {people.map((p) => {
              const localNow = formatTime(p.timeZone, now);
              const off = offsetMinutes(p.timeZone, day.start + (day.end - day.start) / 2);
              return (
                <button key={p.id} className="tl-person" onClick={() => onEdit(p)} title={`Editar a ${p.name}`}>
                  <Avatar name={p.name} />
                  <span className="tl-person-text">
                    <span className="tl-name">{p.name}</span>
                    <span className="tl-meta">
                      {p.city} · <span className="mono">{localNow}</span>
                      <span className="tl-offset mono"> {formatOffset(off)}</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div
            className="tl-tracks"
            ref={trackRef}
            role="slider"
            tabIndex={0}
            aria-label="Horario de la reunión. Usa las flechas para moverla y Mayús + flechas para cambiar la duración."
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={selection?.from ?? 0}
            aria-valuetext={selLabel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => {
              tapRef.current = null;
              setDrag(null);
            }}
            onKeyDown={onKeyDown}
          >
            {hours.map((h) => (
              <span key={h.slot} className="tl-gridline" style={{ left: pct(h.slot) }} />
            ))}

            {overlaps.map((r) => (
              <span key={r.from} className="tl-overlap" style={{ left: pct(r.from), width: pct(r.to - r.from) }} />
            ))}

            {people.map((p, pi) => (
              <div key={p.id} className="tl-row">
                {segmentsFor(day, pi).map((s) => (
                  <span
                    key={s.from}
                    className={`tl-seg tl-${s.kind}`}
                    style={{ left: pct(s.from), width: pct(s.to - s.from) }}
                    title={`${LABELS[s.kind]} · ${formatTime(p.timeZone, day.slots[s.from].start)}–${formatTime(p.timeZone, day.slots[s.to - 1].end)} (${p.city})`}
                  />
                ))}
                <LocalTicks person={p} day={day} ymd={ymd} pct={pct} />
              </div>
            ))}

            {nowSlot !== null && (
              <span className="tl-now" style={{ left: pct(nowSlot) }}>
                <span className="tl-now-dot" />
              </span>
            )}

            {selection && (
              <span className="tl-selection" style={{ left: pct(selection.from), width: pct(selection.to - selection.from) }}>
                <span className="tl-selection-label mono">{selLabel}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Hora local de cada persona cada 3 horas de referencia: hace visible el desfase sin leer números. */
function LocalTicks({ person, day, ymd, pct }: { person: Person; day: DaySchedule; ymd: string; pct: (n: number) => string }) {
  const ticks: { slot: number; label: string; shift: number }[] = [];
  for (let i = 0; i < day.slots.length; i += 12) {
    const t = day.slots[i].start;
    ticks.push({ slot: i, label: formatMinutes(minuteOfDay(person.timeZone, t)), shift: dayShift(person.timeZone, t, ymd) });
  }
  return (
    <>
      {ticks.map((t) => (
        <span key={t.slot} className="tl-tick mono" style={{ left: pct(t.slot) }}>
          {t.label}
          {t.shift !== 0 && <sup>{t.shift > 0 ? '+1' : '−1'}</sup>}
        </span>
      ))}
    </>
  );
}
