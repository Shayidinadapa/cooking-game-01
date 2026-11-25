// audio.js — every sound in Sizzle & Serve is synthesised live with WebAudio:
// no audio files, no network, just short oscillator blips. M toggles mute.

let ctx = null;
let muted = false;

export function isMuted() { return muted; }
export function toggleMute() { muted = !muted; return muted; }

function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function blip(freq, dur, type, vol, when = 0, slideTo = 0) {
  if (muted) return;
  const ac = audioCtx();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noiseBurst(dur, vol, when = 0, lowpass = 1200) {
  if (muted) return;
  const ac = audioCtx();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t0);
}

// Named sounds, one function each, so the game calls what it means.
export const sfx = {
  pickup() { blip(520, 0.08, 'triangle', 0.18, 0, 760); },
  drop() { blip(300, 0.07, 'triangle', 0.14, 0, 210); },
  chop() { noiseBurst(0.09, 0.25, 0, 2400); blip(180, 0.06, 'square', 0.08); },
  chopDone() { blip(660, 0.1, 'triangle', 0.2, 0, 990); },
  sizzleStart() { noiseBurst(0.5, 0.06, 0, 900); },
  cooked() { blip(740, 0.09, 'sine', 0.22); blip(988, 0.12, 'sine', 0.2, 0.09); },
  burnt() { blip(220, 0.25, 'sawtooth', 0.12, 0, 110); },
  plate() { blip(440, 0.07, 'triangle', 0.16); blip(587, 0.09, 'triangle', 0.16, 0.07); },
  serveGood() {
    blip(523, 0.1, 'triangle', 0.22);
    blip(659, 0.1, 'triangle', 0.22, 0.09);
    blip(784, 0.16, 'triangle', 0.24, 0.18);
  },
  serveBad() { blip(330, 0.14, 'sawtooth', 0.12, 0, 220); blip(220, 0.2, 'sawtooth', 0.12, 0.12, 160); },
  newOrder() { blip(880, 0.08, 'sine', 0.16); blip(1174, 0.1, 'sine', 0.14, 0.08); },
  walkout() { blip(392, 0.16, 'triangle', 0.16, 0, 262); },
  tick() { blip(980, 0.05, 'square', 0.07); },
  click() { blip(700, 0.05, 'triangle', 0.12); },
  shiftEnd() {
    [523, 659, 784, 1046].forEach((f, i) => blip(f, 0.18, 'triangle', 0.2, i * 0.13));
  },
};
