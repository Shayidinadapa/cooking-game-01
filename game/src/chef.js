// chef.js — the chef: walking around the kitchen floor, and everything the
// interact key does at each station: grab, chop, grill, fry, plate, serve,
// trash. One function per station so each interaction reads on its own.

import {
  STATIONS, SERVE, TRASH, FLOOR, CHEF_SPEED, CHEF_RADIUS, CHOP_SECONDS,
  INTERACT_RANGE, INGREDIENTS, freshItem, itemReady, itemLabel,
} from './config.js';
import { addFloater, setToast, serveValue, ticketMatches } from './state.js';
import { moveVector } from './input.js';
import { sfx } from './audio.js';

function clampToFloor(chef) {
  chef.x = Math.max(FLOOR.x + CHEF_RADIUS, Math.min(FLOOR.x + FLOOR.w - CHEF_RADIUS, chef.x));
  chef.y = Math.max(FLOOR.y + CHEF_RADIUS, Math.min(FLOOR.y + FLOOR.h - CHEF_RADIUS, chef.y));
}

export function updateChef(state, input, dt) {
  const chef = state.chef;
  const v = moveVector(input);
  chef.moving = v.x !== 0 || v.y !== 0;
  if (chef.moving) {
    chef.x += v.x * CHEF_SPEED * dt;
    chef.y += v.y * CHEF_SPEED * dt;
    if (v.x !== 0) chef.dir = v.x > 0 ? 1 : -1;
  }
  clampToFloor(chef);
  // Chopping only continues while the key is held and the chef stays put.
  if (chef.chopProgress > 0 && (!input.interactHeld || chef.moving)) {
    chef.chopProgress = 0;
  }
}

function stationFront(s) {
  return { x: s.x + s.w / 2, y: s.y + s.h + 6 };
}

// The nearest station (or serve window / trash) within reach of the chef.
export function nearestStation(state) {
  const chef = state.chef;
  let best = null;
  let bestD = INTERACT_RANGE;
  const targets = [
    ...STATIONS.map((s) => ({ id: s.id, p: stationFront(s) })),
    { id: 'serve', p: { x: SERVE.x + SERVE.w / 2, y: SERVE.y + SERVE.h + 6 } },
    { id: 'trash', p: { x: TRASH.x + TRASH.w / 2, y: TRASH.y + TRASH.h + 6 } },
  ];
  for (const t of targets) {
    const d = Math.hypot(chef.x - t.p.x, chef.y - t.p.y);
    if (d < bestD) { bestD = d; best = t.id; }
  }
  return best;
}

function swapCarrying(state, item) {
  const old = state.chef.carrying;
  state.chef.carrying = item;
  return old;
}

function grabFromBin(state, station) {
  const chef = state.chef;
  if (chef.carrying) { setToast(state, 'Hands full! Plate it, serve it or trash it first.'); return; }
  chef.carrying = freshItem(station.item);
  sfx.pickup();
  addFloater(state, chef.x, chef.y - 40, INGREDIENTS[station.item].emoji + ' ' + INGREDIENTS[station.item].name, '#fff8ea');
}

function chopAtBoard(state, input, dt) {
  const chef = state.chef;
  const item = chef.carrying;
  if (!item) { setToast(state, 'Bring something to chop: tomato or lettuce.'); return; }
  if (!INGREDIENTS[item.id].needsChop) { setToast(state, itemLabel(item) + ' needs no chopping.'); return; }
  if (item.chopped) { setToast(state, 'Already chopped!'); return; }
  chef.chopProgress += dt / CHOP_SECONDS;
  if (Math.random() < dt * 6) sfx.chop();
  if (chef.chopProgress >= 1) {
    item.chopped = true;
    chef.chopProgress = 0;
    sfx.chopDone();
    addFloater(state, chef.x, chef.y - 40, 'Chopped! ' + INGREDIENTS[item.id].emoji, '#7fb069');
  }
}

function cookAt(state, station, slotKey) {
  const chef = state.chef;
  const slot = state[slotKey];
  if (slot) {
    // Pick a finished piece back up.
    if (chef.carrying) { setToast(state, 'Hands full!'); return; }
    if (!slot.item.cooked) { setToast(state, 'Still cooking — wait for the ding!'); return; }
    chef.carrying = slot.item;
    state[slotKey] = null;
    sfx.pickup();
    return;
  }
  // Empty cooker, empty hands: the station supplies its own raw piece
  // straight onto the heat — the grill is its own patty bin, the fryer
  // its own fries basket.
  if (!chef.carrying) {
    state[slotKey] = { item: freshItem(station.item), t: 0 };
    sfx.sizzleStart();
    addFloater(state, chef.x, chef.y - 40, INGREDIENTS[station.item].emoji + ' on the ' + station.label.toLowerCase() + '!', '#f2a541');
    return;
  }
  // Start cooking a raw piece the chef brought over.
  const item = chef.carrying;
  if (item.id !== station.item) { setToast(state, 'The ' + station.label.toLowerCase() + ' only cooks ' + INGREDIENTS[station.item].name.toLowerCase() + '.'); return; }
  if (item.cooked) { setToast(state, 'Already cooked!'); return; }
  state[slotKey] = { item, t: 0 };
  chef.carrying = null;
  sfx.sizzleStart();
  addFloater(state, chef.x, chef.y - 40, 'Sizzling…', '#f2a541');
}

function plateAtCounter(state) {
  const chef = state.chef;
  const item = chef.carrying;
  if (!item) {
    if (state.plate.length === 0) { setToast(state, 'The plate is empty. Bring an ingredient.'); return; }
    // Take the last item back off the plate.
    chef.carrying = state.plate.pop();
    sfx.pickup();
    return;
  }
  if (!itemReady(item)) {
    setToast(state, itemLabel(item) + ' is not ready yet — chop or cook it first.');
    return;
  }
  state.plate.push(item);
  chef.carrying = null;
  sfx.plate();
  addFloater(state, chef.x, chef.y - 40, INGREDIENTS[item.id].emoji + ' plated', '#ffd166');
}

function serveAtWindow(state) {
  const chef = state.chef;
  if (state.plate.length === 0) { setToast(state, 'Nothing on the plate to serve.'); return; }
  const plate = state.plate;
  const match = state.tickets.find((t) => ticketMatches(t, plate));
  if (!match) {
    state.streak = 0;
    state.plate = [];
    sfx.serveBad();
    setToast(state, 'Wrong dish! No ticket matches that plate.', 2.6);
    addFloater(state, 1195, 400, 'WRONG ORDER', '#e4572e');
    return;
  }
  const value = serveValue(state, match);
  state.coins += value.total;
  state.served += 1;
  state.streak += 1;
  state.bestStreak = Math.max(state.bestStreak, state.streak);
  state.tickets = state.tickets.filter((t) => t.id !== match.id);
  state.plate = [];
  sfx.serveGood();
  addFloater(state, 1120, 400, '+' + value.total + ' coins', '#ffd166');
  addFloater(state, 1120, 428, match.recipe.name + ' served!', '#fff8ea');
  if (state.streak >= 3) {
    setToast(state, 'Streak x' + state.streak + '! The kitchen is on fire (in a good way).');
  }
}

function trashCarrying(state) {
  const chef = state.chef;
  if (!chef.carrying && state.plate.length === 0) { setToast(state, 'Nothing to throw away.'); return; }
  if (chef.carrying) { chef.carrying = null; sfx.drop(); }
  else { state.plate.pop(); sfx.drop(); }
  setToast(state, 'Tossed it. Fresh start!');
}

// Advance the grill and fryer timers; ding when done, burn when neglected.
export function updateCooking(state, dt) {
  for (const key of ['grill', 'fryer']) {
    const slot = state[key];
    if (!slot) continue;
    slot.t += dt;
    const spec = INGREDIENTS[slot.item.id];
    if (!slot.item.cooked && slot.t >= spec.cookSecs) {
      slot.item.cooked = true;
      sfx.cooked();
      addFloater(state, key === 'grill' ? 735 : 905, 190, 'Ready! ' + spec.emoji, '#7fb069');
    } else if (slot.item.cooked && !slot.item.burnt && slot.t >= spec.burnSecs) {
      slot.item.burnt = true;
      sfx.burnt();
      addFloater(state, key === 'grill' ? 735 : 905, 190, 'Burnt!', '#e4572e');
    }
  }
}

export function interact(state, input, dt) {
  const stationId = nearestStation(state);
  if (!stationId) {
    if (input.interactPressed) setToast(state, 'Step up to a counter to use it.');
    return;
  }
  const station = STATIONS.find((s) => s.id === stationId);
  if (stationId === 'chop') {
    if (input.interactHeld) chopAtBoard(state, input, dt);
    return;
  }
  if (!input.interactPressed) return;
  if (stationId === 'serve') { serveAtWindow(state); return; }
  if (stationId === 'trash') { trashCarrying(state); return; }
  if (!station) return;
  if (station.kind === 'bin') grabFromBin(state, station);
  else if (station.kind === 'grill') cookAt(state, station, 'grill');
  else if (station.kind === 'fryer') cookAt(state, station, 'fryer');
  else if (station.kind === 'plate') plateAtCounter(state);
}
