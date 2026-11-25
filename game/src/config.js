// config.js — every constant that defines Sizzle & Serve: the kitchen layout,
// the ingredients, the recipes on the menu, and the difficulty curve.
// Nothing here moves; the other files read it.

export const VIEW = { w: 1280, h: 800 };

// The kitchen floor: the chef walks in the open area below the counters.
export const FLOOR = { x: 40, y: 300, w: 1200, h: 440 };

// One station = one counter block the chef stands in front of and uses.
export const STATIONS = [
  { id: 'bun',     label: 'BUN BIN',     x: 60,  y: 200, w: 130, h: 84, kind: 'bin',    item: 'bun',     color: '#e8b04b', hint: 'Buns' },
  { id: 'tomato',  label: 'TOMATOES',    x: 210, y: 200, w: 130, h: 84, kind: 'bin',    item: 'tomato',  color: '#e4572e', hint: 'Tomato' },
  { id: 'lettuce', label: 'LETTUCE',     x: 360, y: 200, w: 130, h: 84, kind: 'bin',    item: 'lettuce', color: '#7fb069', hint: 'Lettuce' },
  { id: 'cheese',  label: 'CHEESE',      x: 510, y: 200, w: 130, h: 84, kind: 'bin',    item: 'cheese',  color: '#f2c14e', hint: 'Cheese' },
  { id: 'grill',   label: 'GRILL',       x: 660, y: 200, w: 150, h: 84, kind: 'grill',  item: 'patty',   color: '#5b5b66', hint: 'Grill a patty' },
  { id: 'fryer',   label: 'FRYER',       x: 830, y: 200, w: 150, h: 84, kind: 'fryer',  item: 'fries',   color: '#8a6d3b', hint: 'Fry some fries' },
  { id: 'chop',    label: 'CHOP BOARD',  x: 1000, y: 200, w: 130, h: 84, kind: 'chop',   item: null,      color: '#b08954', hint: 'Chop it here' },
  { id: 'plate',   label: 'PLATING',     x: 1150, y: 200, w: 90,  h: 84, kind: 'plate',  item: null,      color: '#dfe7ef', hint: 'Build the dish' },
];

// The serving window sits on the right wall, above the floor.
export const SERVE = { x: 1150, y: 330, w: 90, h: 120, label: 'SERVE' };
export const TRASH = { x: 60, y: 330, w: 90, h: 60, label: 'TRASH' };

// Ingredients: what the chef can carry, what it looks like, and how it is made.
export const INGREDIENTS = {
  bun:     { name: 'Bun',     emoji: '🍞', needsChop: false, needsCook: false, cookSecs: 0 },
  tomato:  { name: 'Tomato',  emoji: '🍅', needsChop: true,  needsCook: false, cookSecs: 0 },
  lettuce: { name: 'Lettuce', emoji: '🥬', needsChop: true,  needsCook: false, cookSecs: 0 },
  cheese:  { name: 'Cheese',  emoji: '🧀', needsChop: false, needsCook: false, cookSecs: 0 },
  patty:   { name: 'Patty',   emoji: '🥩', needsChop: false, needsCook: true,  cookSecs: 6, burnSecs: 12 },
  fries:   { name: 'Fries',   emoji: '🍟', needsChop: false, needsCook: true,  cookSecs: 5, burnSecs: 11 },
};

// A carried item is { id, chopped, cooked, burnt }.
export function freshItem(id) {
  return { id, chopped: !INGREDIENTS[id].needsChop, cooked: !INGREDIENTS[id].needsCook, burnt: false };
}
export function itemReady(item) {
  return item && item.chopped && item.cooked && !item.burnt;
}
export function itemLabel(item) {
  if (!item) return '';
  const base = INGREDIENTS[item.id].name;
  if (item.burnt) return 'Burnt ' + base;
  if (INGREDIENTS[item.id].needsChop && !item.chopped) return base + ' (whole)';
  if (INGREDIENTS[item.id].needsCook && !item.cooked) return 'Raw ' + base;
  return base;
}

// The menu: each dish is a set of ready ingredients. Same ingredients in
// different combinations make different dishes, so route-planning matters.
export const RECIPES = [
  { id: 'sunny-stack', name: 'Sunny Stack', price: 14, items: ['bun', 'patty', 'cheese'], color: '#f2a541' },
  { id: 'garden-crunch', name: 'Garden Crunch', price: 12, items: ['bun', 'lettuce', 'tomato'], color: '#7fb069' },
  { id: 'double-sizzle', name: 'Double Sizzle', price: 20, items: ['bun', 'patty', 'patty', 'cheese'], color: '#e4572e' },
  { id: 'crispy-side', name: 'Crispy Side', price: 9, items: ['fries'], color: '#e8b04b' },
  { id: 'full-works', name: 'The Full Works', price: 26, items: ['bun', 'patty', 'cheese', 'lettuce', 'tomato'], color: '#c86dd7' },
  { id: 'cheesy-fries', name: 'Cheesy Fries', price: 13, items: ['fries', 'cheese'], color: '#f2c14e' },
  { id: 'green-stack', name: 'Green Stack', price: 15, items: ['bun', 'patty', 'lettuce', 'tomato'], color: '#4e9b47' },
];

export const SHIFT_SECONDS = 150;      // one full shift
export const ORDER_PATIENCE = 45;      // seconds before a ticket walks out
export const MAX_TICKETS = 3;
export const FIRST_ORDER_AT = 2;       // seconds into the shift
export const SPAWN_START = 14;         // seconds between new tickets, early
export const SPAWN_END = 7;            // seconds between new tickets, late rush
export const TIP_MAX = 6;              // extra coins for a fast serve
export const COMBO_BONUS = 2;          // coins per streak step, capped below
export const COMBO_CAP = 10;

export const CHEF_SPEED = 300;         // px per second
export const CHEF_RADIUS = 22;
export const CHOP_SECONDS = 1.6;       // holding E at the board
export const INTERACT_RANGE = 78;      // px from a station's front edge

// Warm kitchen palette.
export const COLORS = {
  wall: '#3a2a1e', floorTileA: '#c9a06a', floorTileB: '#bd9260',
  counterTop: '#8a5a33', counterFront: '#6e4525', board: '#2b2118',
  boardPaper: '#fff3d6', hud: '#241a12', gold: '#ffd166', red: '#e4572e',
  green: '#7fb069', cream: '#fff8ea',
};
