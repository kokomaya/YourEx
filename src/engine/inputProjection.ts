import type { InputProjection } from '../types';

/**
 * Apply an InputProjection to raw input lines.
 *
 * Order of operations:
 *   1. lineRange       — pick a slice of lines (0-based, end-exclusive).
 *   2. columnRanges    — per-line, concatenate the listed column slices.
 *   3. trimEachSegment — optional trim per produced line.
 *   4. decode          — if 'hex-bytes', parse each /[0-9A-Fa-f]{2}/ token to a char.
 *   5. mergeLines      — when true, return a single-element array joined by `joiner`.
 *
 * Always returns an array of strings (length 1 when mergeLines=true).
 */
export function projectInput(input: string[], source: InputProjection): string[] {
  const lineRange = source.lineRange;
  const start = clampInt(lineRange?.start ?? 0, 0, input.length);
  const end = clampInt(lineRange?.end ?? input.length, start, input.length);
  let lines = input.slice(start, end);

  const columnRanges = source.columnRanges;
  if (columnRanges && columnRanges.length > 0) {
    lines = lines.map(line => {
      const segments = columnRanges.map(r => {
        const s = clampInt(r.start, 0, line.length);
        const e = clampInt(r.end ?? line.length, s, line.length);
        const seg = line.slice(s, e);
        return source.trimEachSegment ? seg.trim() : seg;
      });
      return segments.join('');
    });
  } else if (source.trimEachSegment) {
    lines = lines.map(l => l.trim());
  }

  if (source.decode === 'hex-bytes') {
    lines = lines.map(decodeHexBytes);
  }

  if (source.mergeLines) {
    const joiner = source.joiner ?? '';
    return [lines.join(joiner)];
  }

  return lines;
}

function decodeHexBytes(s: string): string {
  const tokens = s.match(/[0-9A-Fa-f]{2}/g);
  if (!tokens) return '';
  let out = '';
  for (const t of tokens) {
    out += String.fromCharCode(parseInt(t, 16));
  }
  return out;
}

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  const i = Math.trunc(n);
  if (i < min) return min;
  if (i > max) return max;
  return i;
}
