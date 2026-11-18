// String paths per base type, parametrized by arc length.
// viewBox coordinate space: 1000 x 640 (y grows downward).

import type { BaseType } from "../types/beads";

export const VIEW_W = 1000;
export const VIEW_H = 640;

export interface PathData {
  base: BaseType;
  /** uniform arc-length samples, samples[i] sits at s = i * length / (N - 1) */
  samples: { x: number; y: number }[];
  length: number;
  closed: boolean;
  /** SVG path "d" for rendering the string */
  d: string;
}

const N = 720;

type RawPoint = { x: number; y: number };

function cubicBezier(
  p0: RawPoint,
  p1: RawPoint,
  p2: RawPoint,
  p3: RawPoint,
  n: number,
): RawPoint[] {
  const pts: RawPoint[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    pts.push({
      x:
        u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y:
        u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    });
  }
  return pts;
}

function ellipse(cx: number, cy: number, rx: number, ry: number, n: number): RawPoint[] {
  const pts: RawPoint[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    pts.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
  }
  return pts;
}

function buildPath(raw: RawPoint[], closed: boolean, base: BaseType): PathData {
  // cumulative arc length over the raw samples
  const cum: number[] = [0];
  for (let i = 1; i < raw.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(raw[i].x - raw[i - 1].x, raw[i].y - raw[i - 1].y));
  }
  const length = cum[cum.length - 1];

  // resample uniformly by arc length
  const samples: RawPoint[] = [];
  let j = 0;
  for (let i = 0; i < N; i++) {
    const target = (length * i) / (N - 1);
    while (j < cum.length - 2 && cum[j + 1] < target) j++;
    const seg = cum[j + 1] - cum[j] || 1;
    const t = (target - cum[j]) / seg;
    samples.push({
      x: raw[j].x + (raw[j + 1].x - raw[j].x) * t,
      y: raw[j].y + (raw[j + 1].y - raw[j].y) * t,
    });
  }

  const d =
    `M${samples[0].x.toFixed(1)},${samples[0].y.toFixed(1)} ` +
    samples
      .filter((_, i) => i > 0 && i % 4 === 0)
      .map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ") +
    (closed ? " Z" : "");

  return { base, samples, length, closed, d };
}

const cache = new Map<BaseType, PathData>();

export function getPath(base: BaseType): PathData {
  const hit = cache.get(base);
  if (hit) return hit;

  let path: PathData;
  if (base === "kalung") {
    // Open U-curve: both ends pinned high, sagging middle
    const raw = cubicBezier(
      { x: 200, y: 96 },
      { x: 320, y: 600 },
      { x: 680, y: 600 },
      { x: 800, y: 96 },
      1200,
    );
    path = buildPath(raw, false, base);
  } else if (base === "gelang") {
    path = buildPath(ellipse(500, 320, 250, 235, 1200), true, base);
  } else {
    // strap: tall oval loop
    path = buildPath(ellipse(500, 330, 185, 262, 1200), true, base);
  }
  cache.set(base, path);
  return path;
}

/** point on path at arc-length position s */
export function pointAt(path: PathData, s: number): RawPoint {
  const max = path.length;
  let clamped = s;
  if (path.closed) {
    clamped = ((s % max) + max) % max;
  } else {
    clamped = Math.min(Math.max(s, 0), max);
  }
  const f = (clamped / max) * (path.samples.length - 1);
  const i = Math.min(Math.floor(f), path.samples.length - 2);
  const t = f - i;
  const a = path.samples[i];
  const b = path.samples[i + 1];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** unit tangent at s (direction of increasing s) */
export function tangentAt(path: PathData, s: number): RawPoint {
  const ds = 2;
  const p1 = pointAt(path, s - ds);
  const p2 = pointAt(path, s + ds);
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

/** nearest arc-length position to a canvas point */
export function nearestS(path: PathData, x: number, y: number): number {
  let best = 0;
  let bestD = Infinity;
  const samples = path.samples;
  for (let i = 0; i < samples.length; i += 3) {
    const dx = samples[i].x - x;
    const dy = samples[i].y - y;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  // refine around best
  const lo = Math.max(0, best - 3);
  const hi = Math.min(samples.length - 1, best + 3);
  for (let i = lo; i <= hi; i++) {
    const dx = samples[i].x - x;
    const dy = samples[i].y - y;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return (best / (samples.length - 1)) * path.length;
}

/** topmost (smallest y) point on the path — used for click-to-add fallback */
export function topS(path: PathData): number {
  let best = 0;
  let minY = Infinity;
  path.samples.forEach((p, i) => {
    if (p.y < minY) {
      minY = p.y;
      best = i;
    }
  });
  return (best / (path.samples.length - 1)) * path.length;
}
