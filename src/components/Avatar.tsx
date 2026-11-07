const HUES = [18, 42, 150, 190, 215, 265, 300, 340];

function hash(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return h;
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const hue = HUES[hash(name) % HUES.length];
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => Array.from(w)[0] ?? '')
    .join('')
    .toUpperCase();
  return (
    <span className="avatar" style={{ ['--hue' as string]: hue, width: size, height: size }} aria-hidden>
      {initials || '?'}
    </span>
  );
}
