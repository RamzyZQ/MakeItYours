// Bead-on-string physics: 1-D gravity simulation along an arc-length
// parametrized path, with pairwise stacking constraints (PBD-style).

import { useCallback, useEffect, useRef, useState } from "react";
import { tangentAt, type PathData } from "./paths";
import { getBead } from "./beads";

export interface SimBead {
  id: string;
  type: string;
  /** arc-length position along the path */
  s: number;
  /** velocity along the path (units / second) */
  v: number;
  /** collision radius (viewBox units) */
  r: number;
  /** insertion order, for stable undo */
  seq: number;
}

const G = 2700; // gravity px/s^2 in viewBox units
const AIR_DRAG = 2.4;
const REST_GAP = 3.5; // visual gap between resting beads
const FIXED_DT = 1 / 120;

let idCounter = 0;
const nextId = () => `b${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

// Cute pastel sound synthesizer using Web Audio API
class ChimeSound {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playPop(pitchModifier = 1) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      // Soft cute bubble/bell tone
      const baseFreq = 540 * pitchModifier;
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // Audio autoplay may be prevented, safe fallback
    }
  }

  playRemove() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.1);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Safe fallback
    }
  }
}

export const chime = new ChimeSound();

export function useStringSim(path: PathData) {
  const [beads, setBeads] = useState<SimBead[]>([]);
  const simRef = useRef<SimBead[]>([]);
  const undoRef = useRef<string[]>([]);
  const seqRef = useRef(0);
  const [canUndo, setCanUndo] = useState(false);

  // keep the loop seeing the latest path
  const pathRef = useRef(path);
  pathRef.current = path;

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const step = (dt: number) => {
      const p = pathRef.current;
      const arr = simRef.current;
      if (arr.length === 0) return;

      // gravity projected on the tangent (screen y grows downward)
      for (const b of arr) {
        const tan = tangentAt(p, b.s);
        b.v += G * tan.y * dt;
        b.v *= Math.exp(-AIR_DRAG * dt);
        b.s += b.v * dt;
      }

      // boundary conditions for open paths
      if (!p.closed) {
        for (const b of arr) {
          const lo = b.r + 4;
          const hi = p.length - b.r - 4;
          if (b.s < lo) {
            b.s = lo;
            b.v = Math.max(0, b.v);
          } else if (b.s > hi) {
            b.s = hi;
            b.v = Math.min(0, b.v);
          }
        }
      } else {
        for (const b of arr) {
          b.s = ((b.s % p.length) + p.length) % p.length;
        }
      }

      // stacking constraints: sort along path, push overlapping pairs apart
      const sorted = [...arr].sort((a, b) => a.s - b.s);
      for (let iter = 0; iter < 8; iter++) {
        for (let i = 0; i < sorted.length - 1; i++) {
          const a = sorted[i];
          const b = sorted[i + 1];
          const minD = a.r + b.r + REST_GAP;
          const ds = b.s - a.s;
          if (ds < minD) {
            const push = (minD - ds) / 2;
            a.s -= push;
            b.s += push;
            const avg = (a.v + b.v) * 0.25;
            a.v = avg;
            b.v = avg;
          }
        }
        if (p.closed && sorted.length > 2) {
          const first = sorted[0];
          const last = sorted[sorted.length - 1];
          const minD = first.r + last.r + REST_GAP;
          const ds = first.s + p.length - last.s;
          if (ds < minD) {
            const push = (minD - ds) / 2;
            first.s += push;
            last.s -= push;
            const avg = (first.v + last.v) * 0.25;
            first.v = avg;
            last.v = avg;
          }
        }
        if (!p.closed) {
          for (const b of sorted) {
            b.s = Math.min(Math.max(b.s, b.r + 4), p.length - b.r - 4);
          }
        }
      }
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      acc += Math.min((now - last) / 1000, 0.1);
      last = now;
      while (acc >= FIXED_DT) {
        step(FIXED_DT);
        acc -= FIXED_DT;
      }
      if (simRef.current.length > 0) {
        setBeads([...simRef.current]);
      }
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const addBead = useCallback((type: string, s: number) => {
    const def = getBead(type);
    const bead: SimBead = {
      id: nextId(),
      type: def.id,
      s,
      v: 0,
      r: def.r,
      seq: seqRef.current++,
    };
    simRef.current = [...simRef.current, bead];
    undoRef.current = [...undoRef.current, bead.id];
    setBeads([...simRef.current]);
    setCanUndo(true);

    const pitchModifier = 0.85 + (Math.random() * 0.4);
    chime.playPop(pitchModifier);
  }, []);

  const removeBead = useCallback((id: string) => {
    simRef.current = simRef.current.filter((b) => b.id !== id);
    undoRef.current = undoRef.current.filter((x) => x !== id);
    setBeads([...simRef.current]);
    setCanUndo(undoRef.current.length > 0);
    chime.playRemove();
  }, []);

  const undo = useCallback(() => {
    const lastId = undoRef.current[undoRef.current.length - 1];
    if (!lastId) return;
    removeBead(lastId);
  }, [removeBead]);

  const clear = useCallback(() => {
    simRef.current = [];
    undoRef.current = [];
    setBeads([]);
    setCanUndo(false);
  }, []);

  const loadBeads = useCallback((records: { type: string; s: number }[]) => {
    simRef.current = [];
    undoRef.current = [];
    seqRef.current = 0;
    for (const rec of records) {
      const def = getBead(rec.type);
      const bead: SimBead = {
        id: nextId(),
        type: def.id,
        s: rec.s,
        v: 0,
        r: def.r,
        seq: seqRef.current++,
      };
      simRef.current.push(bead);
      undoRef.current.push(bead.id);
    }
    setBeads([...simRef.current]);
    setCanUndo(undoRef.current.length > 0);
  }, []);

  return { beads, addBead, removeBead, undo, clear, loadBeads, canUndo };
}
