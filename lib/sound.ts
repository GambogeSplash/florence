"use client";

// Web Audio synthesized cues — no audio files required.
// All sounds are short, calm, and roll off in <0.5s so they never overlap speech.

let _ctx: AudioContext | null = null;
let _muted = false;

const MUTE_KEY = "florence.muted";

if (typeof window !== "undefined") {
  try {
    _muted = window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    /* noop */
  }
}

export function isMuted(): boolean {
  return _muted;
}

export function setMuted(value: boolean): void {
  _muted = value;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(MUTE_KEY, value ? "1" : "0");
    } catch {
      /* noop */
    }
  }
  if (value) stopHum();
}

function muted(): boolean {
  return _muted;
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (_ctx) return _ctx;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  try {
    _ctx = new Ctx();
  } catch {
    return null;
  }
  return _ctx;
}

/**
 * Resume the audio context — must be called from a user gesture before any
 * sounds will play. Safe to call multiple times.
 */
export function unlockSound(): void {
  const c = getCtx();
  if (c && c.state === "suspended") {
    c.resume().catch(() => {
      /* noop */
    });
  }
}

/**
 * "Pop" — short two-tone pluck. Used when the payment card arrives.
 * Reads as "something good just landed."
 */
export function playPop(): void {
  if (muted()) return;
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(560, now);
  osc.frequency.exponentialRampToValueAtTime(960, now + 0.09);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.16, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.25);
}

/**
 * "Connect" — soft two-note ascending arpeggio. Used when the call connects.
 * Quiet, warm; reads as "we're on."
 */
export function playConnect(): void {
  if (muted()) return;
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const notes = [392, 587]; // G4 → D5

  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + i * 0.11);
    gain.gain.setValueAtTime(0, now + i * 0.11);
    gain.gain.linearRampToValueAtTime(0.11, now + i * 0.11 + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.11 + 0.42);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now + i * 0.11);
    osc.stop(now + i * 0.11 + 0.5);
  });
}

/**
 * "Ring" — classic dual-tone phone ring (450Hz + 480Hz, ~0.5s).
 * Plays once when the user taps "Call Florence" — like the dial tone you'd hear
 * waiting for the other side to pick up.
 */
export function playRing(): void {
  if (muted()) return;
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;

  // Two-tone ring pattern: brrring … brrring (two short bursts ~0.45s each
  // separated by 0.15s of silence). Classic North American telephone cadence.
  const bursts = [0, 0.6];
  bursts.forEach((offset) => {
    [450, 480].forEach((freq) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + offset);
      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.07, now + offset + 0.05);
      gain.gain.setValueAtTime(0.07, now + offset + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.5);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.55);
    });
  });
}

let _humStop: (() => void) | null = null;

/**
 * "Hum" — soft brown-noise ambient room tone that loops while the call is
 * connected. Cheap trick that makes a browser call feel like an actual phone
 * call. Starts faded in, fades out on stop.
 */
export function startHum(): void {
  if (muted()) return;
  const c = getCtx();
  if (!c || _humStop) return;

  // Pre-render a 4-second brown noise buffer (loops without click)
  const sampleRate = c.sampleRate;
  const buffer = c.createBuffer(1, sampleRate * 4, sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }

  const src = c.createBufferSource();
  src.buffer = buffer;
  src.loop = true;

  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 600;

  const gain = c.createGain();
  gain.gain.setValueAtTime(0, c.currentTime);
  gain.gain.linearRampToValueAtTime(0.012, c.currentTime + 0.6);

  src.connect(lp).connect(gain).connect(c.destination);
  src.start();

  _humStop = () => {
    try {
      const now = c.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
      setTimeout(() => {
        try {
          src.stop();
        } catch {
          /* noop */
        }
      }, 450);
    } catch {
      /* noop */
    }
    _humStop = null;
  };
}

export function stopHum(): void {
  _humStop?.();
}

/**
 * "Hangup" — single soft descending tone. Used when the call ends.
 */
export function playHangup(): void {
  if (muted()) return;
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(523, now);
  osc.frequency.exponentialRampToValueAtTime(330, now + 0.22);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.09, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.36);
}
