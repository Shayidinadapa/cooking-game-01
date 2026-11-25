// main.js — the entry point: wires input, state, chef, cooking and rendering
// together and runs the frame loop. Nothing else lives here.

import { createState, updateState, spawnTicket } from './state.js';
import { createInput, consumeFrame } from './input.js';
import { updateChef, interact, nearestStation, updateCooking } from './chef.js';
import { render } from './render.js';
import { applyScene } from './scenes.js';
import { sfx, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || '1') || 1;
const shot = params.get('shot') || '';

const state = createState(seed);
const input = createInput(canvas);

// A screenshot scene sets up a fixed kitchen; otherwise the title shows.
const isScene = applyScene(state, shot);

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (state.phase === 'title' && input.interactPressed) {
    state.phase = 'playing';
    spawnTicket(state);
    sfx.newOrder();
  }

  if (state.phase === 'playing') {
    updateChef(state, input, dt);
    if (input.interactHeld || input.interactPressed) interact(state, input, dt);
    updateCooking(state, dt);
    const events = updateState(state, dt);
    for (const e of events) {
      if (e === 'new-order') sfx.newOrder();
      else if (e === 'walkout') sfx.walkout();
      else if (e === 'tick') sfx.tick();
      else if (e === 'shift-end') sfx.shiftEnd();
    }
  }

  const highlight = state.phase === 'playing' ? nearestStation(state) : null;
  render(ctx, state, highlight);
  consumeFrame(input);
  requestAnimationFrame(frame);
}

// Keyboard shortcuts that are not movement.
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyM') toggleMute();
  if (e.code === 'KeyR') {
    const fresh = createState(seed);
    Object.assign(state, fresh);
    if (isScene) applyScene(state, shot);
    else state.phase = 'title';
  }
});

requestAnimationFrame(frame);
