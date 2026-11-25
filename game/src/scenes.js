// scenes.js — screenshot scenes. The game reads ?shot=<name> from the URL
// and sets up a fixed, deterministic kitchen state for that shot, so the
// screenshots are genuine renders of the game itself. Playing normally
// (no ?shot=) starts at the title screen instead.

import { RECIPES, ORDER_PATIENCE } from './config.js';
import { freshItem } from './config.js';

function ticketFor(state, recipeId, patience) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  const ticket = {
    id: state.nextTicketId++,
    recipe,
    patience,
    maxPatience: ORDER_PATIENCE,
    flash: 0,
  };
  state.tickets.push(ticket);
  return ticket;
}

function startShift(state) {
  state.phase = 'playing';
  state.time = 0;
  state.shiftLeft = 150;
  state.spawnIn = 12;
}

// Cover: the full kitchen at its best — three tickets, ingredients out,
// a cooked patty on the grill, a plated dish ready to serve.
export function applyCoverScene(state) {
  startShift(state);
  state.time = 42;
  state.shiftLeft = 108;
  state.coins = 47;
  state.served = 4;
  state.streak = 3;
  state.bestStreak = 3;
  ticketFor(state, 'full-works', 34);
  ticketFor(state, 'sunny-stack', 22);
  ticketFor(state, 'crispy-side', 9);
  state.grill = { item: freshItem('patty'), t: 6 };
  state.grill.item.cooked = true;
  state.fryer = { item: freshItem('fries'), t: 5 };
  state.fryer.item.cooked = true;
  const bun = freshItem('bun');
  const patty = freshItem('patty');
  patty.cooked = true;
  const cheese = freshItem('cheese');
  state.plate = [bun, patty, cheese];
  state.chef.x = 1060;
  state.chef.y = 340;
  state.chef.dir = -1;
  state.chef.carrying = null;
}

// Mid-assembly: the chef is at the plating counter building a Garden Crunch,
// tomato mid-chop on the board, one ticket waiting.
export function applyMidAssemblyScene(state) {
  startShift(state);
  state.time = 25;
  state.shiftLeft = 125;
  state.coins = 18;
  state.served = 1;
  state.streak = 1;
  state.bestStreak = 1;
  ticketFor(state, 'garden-crunch', 30);
  ticketFor(state, 'cheesy-fries', 18);
  const bun = freshItem('bun');
  const lettuce = freshItem('lettuce');
  lettuce.chopped = true;
  state.plate = [bun, lettuce];
  const tomato = freshItem('tomato');
  state.chef.carrying = tomato;
  state.chef.chopProgress = 0.55;
  state.chef.x = 1065;
  state.chef.y = 330;
  state.chef.dir = -1;
  state.grill = { item: freshItem('patty'), t: 3 };
}

// Service rush: the board is full, patience is low, the fryer and grill are
// both going, and the chef is sprinting a finished plate to the window.
export function applyRushScene(state) {
  startShift(state);
  state.time = 118;
  state.shiftLeft = 32;
  state.coins = 96;
  state.served = 9;
  state.lost = 2;
  state.streak = 5;
  state.bestStreak = 5;
  ticketFor(state, 'double-sizzle', 7);
  ticketFor(state, 'green-stack', 12);
  ticketFor(state, 'full-works', 26);
  state.grill = { item: freshItem('patty'), t: 6 };
  state.grill.item.cooked = true;
  state.fryer = { item: freshItem('fries'), t: 4 };
  const fries = freshItem('fries');
  fries.cooked = true;
  state.plate = [fries];
  state.chef.x = 1180;
  state.chef.y = 430;
  state.chef.dir = 1;
  state.chef.moving = true;
  state.chef.carrying = null;
}

// Serve moment: a completed Full Works on the plate at the window,
// coins popping, streak high.
export function applyServeScene(state) {
  startShift(state);
  state.time = 88;
  state.shiftLeft = 62;
  state.coins = 74;
  state.served = 7;
  state.streak = 4;
  state.bestStreak = 4;
  ticketFor(state, 'full-works', 28);
  ticketFor(state, 'sunny-stack', 15);
  const bun = freshItem('bun');
  const patty = freshItem('patty');
  patty.cooked = true;
  const cheese = freshItem('cheese');
  const lettuce = freshItem('lettuce');
  lettuce.chopped = true;
  const tomato = freshItem('tomato');
  tomato.chopped = true;
  state.plate = [bun, patty, cheese, lettuce, tomato];
  state.chef.x = 1150;
  state.chef.y = 470;
  state.chef.dir = 1;
  state.floaters.push({ x: 1120, y: 380, text: '+32 coins', color: '#ffd166', life: 1.4 });
  state.floaters.push({ x: 1120, y: 408, text: 'The Full Works served!', color: '#fff8ea', life: 1.4 });
}

export function applyScene(state, name) {
  if (name === 'cover') applyCoverScene(state);
  else if (name === 'mid') applyMidAssemblyScene(state);
  else if (name === 'rush') applyRushScene(state);
  else if (name === 'serve') applyServeScene(state);
  return name === 'cover' || name === 'mid' || name === 'rush' || name === 'serve';
}
