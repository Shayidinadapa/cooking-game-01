// state.js — the whole game state in one place: the shift clock, the tickets
// on the order board, the coins and streak, and the cooking slots on the
// grill and fryer. Pure logic; rendering lives in render.js.

import {
  RECIPES, SHIFT_SECONDS, ORDER_PATIENCE, MAX_TICKETS, FIRST_ORDER_AT,
  SPAWN_START, SPAWN_END, TIP_MAX, COMBO_BONUS, COMBO_CAP,
} from './config.js';

export function createState(seed = 1) {
  return {
    seed,
    randState: (seed * 2654435761) >>> 0,
    phase: 'title', // title | playing | over
    time: 0,        // seconds since the shift started
    shiftLeft: SHIFT_SECONDS,
    coins: 0,
    served: 0,
    lost: 0,
    streak: 0,
    bestStreak: 0,
    tickets: [],    // { id, recipe, patience, maxPatience, flash }
    nextTicketId: 1,
    spawnIn: FIRST_ORDER_AT,
    chef: { x: 640, y: 560, dir: 1, moving: false, carrying: null, chopProgress: 0 },
    plate: [],      // items currently on the plating counter
    grill: null,    // { item, t } cooking slot
    fryer: null,    // { item, t } cooking slot
    floaters: [],   // { x, y, text, color, life } pop-up feedback
    toast: '', toastLife: 0,
    lastTickSecond: -1,
    overReason: '',
  };
}

// Small deterministic PRNG so a seeded run plays the same every time.
export function rand(state) {
  state.randState = (state.randState * 1664525 + 1013904223) >>> 0;
  return state.randState / 4294967296;
}
export function pickRecipe(state) {
  const idx = Math.floor(rand(state) * RECIPES.length);
  return RECIPES[idx];
}

export function spawnTicket(state) {
  if (state.tickets.length >= MAX_TICKETS) return false;
  const recipe = pickRecipe(state);
  state.tickets.push({
    id: state.nextTicketId++,
    recipe,
    patience: ORDER_PATIENCE,
    maxPatience: ORDER_PATIENCE,
    flash: 0,
  });
  return true;
}

// How fast new tickets arrive: the rush grows as the shift goes on.
export function spawnInterval(state) {
  const progress = 1 - state.shiftLeft / SHIFT_SECONDS;
  return SPAWN_START + (SPAWN_END - SPAWN_START) * progress;
}

export function addFloater(state, x, y, text, color) {
  state.floaters.push({ x, y, text, color, life: 1.4 });
}

export function setToast(state, text, seconds = 2.2) {
  state.toast = text;
  state.toastLife = seconds;
}

// Score a served dish: menu price + a speed tip + a streak bonus.
export function serveValue(state, ticket) {
  const speed = ticket.patience / ticket.maxPatience;
  const tip = Math.round(TIP_MAX * speed);
  const combo = Math.min(state.streak * COMBO_BONUS, COMBO_CAP);
  return { price: ticket.recipe.price, tip, combo, total: ticket.recipe.price + tip + combo };
}

export function ticketMatches(ticket, plate) {
  const want = [...ticket.recipe.items].sort();
  const have = plate.map((i) => i.id).sort();
  if (want.length !== have.length) return false;
  return want.every((w, i) => w === have[i]);
}

// Tick the clock, patience, spawn timer and floaters. Returns events the
// caller turns into sounds: 'new-order', 'walkout', 'tick', 'shift-end'.
export function updateState(state, dt) {
  const events = [];
  if (state.phase !== 'playing') return events;

  state.time += dt;
  state.shiftLeft = Math.max(0, SHIFT_SECONDS - state.time);

  const whole = Math.floor(state.shiftLeft);
  if (whole !== state.lastTickSecond) {
    state.lastTickSecond = whole;
    if (whole <= 10 && whole > 0) events.push('tick');
  }

  state.spawnIn -= dt;
  if (state.spawnIn <= 0) {
    if (spawnTicket(state)) events.push('new-order');
    state.spawnIn = spawnInterval(state);
  }

  for (const t of state.tickets) {
    t.patience -= dt;
    if (t.patience < 8) t.flash = (t.flash + dt) % 0.5;
  }
  const before = state.tickets.length;
  state.tickets = state.tickets.filter((t) => t.patience > 0);
  if (state.tickets.length < before) {
    state.lost += 1;
    state.streak = 0;
    events.push('walkout');
    setToast(state, 'A customer walked out! Streak lost.', 2.4);
  }

  for (const f of state.floaters) { f.y -= 34 * dt; f.life -= dt; }
  state.floaters = state.floaters.filter((f) => f.life > 0);
  if (state.toastLife > 0) state.toastLife -= dt;

  if (state.shiftLeft <= 0) {
    state.phase = 'over';
    state.overReason = 'Shift complete!';
    events.push('shift-end');
  }
  return events;
}
