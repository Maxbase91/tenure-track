// Tiny synthesized sound layer (M6, spec §16 "sound"). No asset files — cues are
// generated with the Web Audio API on the fly. Browser autoplay policy means the
// AudioContext only starts after a user gesture, which all our cues follow.

export type Cue =
  | "click"
  | "experiment"
  | "paperAccepted"
  | "paperRejected"
  | "grantFunded"
  | "grantRejected"
  | "coffee"
  | "event"
  | "win"
  | "loss";

let ctx: AudioContext | null = null;
let muted = false;

if (typeof window !== "undefined") {
  muted = window.localStorage.getItem("tt-muted") === "1";
}

export function isMuted() {
  return muted;
}

export function toggleMute(): boolean {
  muted = !muted;
  if (typeof window !== "undefined") window.localStorage.setItem("tt-muted", muted ? "1" : "0");
  return muted;
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// One note: oscillator → gain envelope.
function note(ac: AudioContext, freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.18) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = ac.currentTime + start;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

const SEQ: Record<Cue, { f: number; t: number; d: number; type?: OscillatorType; g?: number }[]> = {
  click: [{ f: 220, t: 0, d: 0.05, type: "square", g: 0.06 }],
  experiment: [{ f: 330, t: 0, d: 0.08, type: "triangle", g: 0.08 }],
  coffee: [{ f: 180, t: 0, d: 0.06, type: "sine" }, { f: 90, t: 0.05, d: 0.1, type: "sine" }],
  event: [{ f: 520, t: 0, d: 0.1, type: "triangle", g: 0.1 }, { f: 660, t: 0.1, d: 0.12, type: "triangle", g: 0.1 }],
  paperAccepted: [{ f: 523, t: 0, d: 0.12 }, { f: 659, t: 0.1, d: 0.12 }, { f: 784, t: 0.2, d: 0.2 }],
  grantFunded: [{ f: 659, t: 0, d: 0.1, type: "triangle" }, { f: 880, t: 0.09, d: 0.1, type: "triangle" }, { f: 1047, t: 0.18, d: 0.22, type: "triangle" }],
  paperRejected: [{ f: 300, t: 0, d: 0.12, type: "sawtooth", g: 0.1 }, { f: 200, t: 0.1, d: 0.18, type: "sawtooth", g: 0.1 }],
  grantRejected: [{ f: 200, t: 0, d: 0.18, type: "sawtooth", g: 0.1 }, { f: 140, t: 0.14, d: 0.2, type: "sawtooth", g: 0.1 }],
  win: [{ f: 523, t: 0, d: 0.13 }, { f: 659, t: 0.12, d: 0.13 }, { f: 784, t: 0.24, d: 0.13 }, { f: 1047, t: 0.36, d: 0.3 }],
  loss: [{ f: 392, t: 0, d: 0.2, type: "sine" }, { f: 294, t: 0.18, d: 0.25, type: "sine" }, { f: 196, t: 0.4, d: 0.4, type: "sine" }],
};

export function play(cue: Cue) {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  for (const n of SEQ[cue]) note(ac, n.f, n.t, n.d, n.type ?? "sine", n.g ?? 0.18);
}

// Map a log line / outcome to a cue (used by the board to react to state).
export function cueForLog(line: string): Cue | null {
  if (/Paper ACCEPTED/.test(line)) return "paperAccepted";
  if (/Paper REJECTED/.test(line)) return "paperRejected";
  if (/Grant FUNDED/.test(line)) return "grantFunded";
  if (/Grant REJECTED/.test(line)) return "grantRejected";
  if (/Drank coffee/.test(line)) return "coffee";
  if (/Ran experiments|Mentored/.test(line)) return "experiment";
  return null;
}
