// render.js — everything the player sees: the kitchen, the order board, the
// counters and their food, the chef, the HUD and the title / game-over
// screens. All drawing is plain canvas 2D, no images.

import {
  VIEW, FLOOR, STATIONS, SERVE, TRASH, INGREDIENTS, COLORS, CHEF_RADIUS,
} from './config.js';
import { itemLabel } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function drawIngredient(ctx, id, x, y, size, chopped, cooked, burnt) {
  const emoji = INGREDIENTS[id].emoji;
  ctx.font = size + 'px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (burnt) {
    ctx.globalAlpha = 0.85;
    ctx.fillText('🔥', x, y - size * 0.28);
    ctx.globalAlpha = 1;
  }
  ctx.fillText(emoji, x, y);
  if (chopped) {
    ctx.strokeStyle = '#fff8ea';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.42, y + size * 0.34);
    ctx.lineTo(x + size * 0.42, y + size * 0.34);
    ctx.stroke();
  }
  if (cooked && !burnt) {
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold ' + Math.round(size * 0.32) + 'px "Trebuchet MS", sans-serif';
    ctx.fillText('✓', x + size * 0.42, y - size * 0.36);
  }
}

function drawPlate(ctx, x, y, items, scale = 1) {
  ctx.fillStyle = '#f4f6f8';
  ctx.beginPath();
  ctx.ellipse(x, y, 52 * scale, 34 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b9c4cf';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#e3e9ee';
  ctx.beginPath();
  ctx.ellipse(x, y, 38 * scale, 24 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  items.forEach((item, i) => {
    const spread = items.length > 1 ? (i - (items.length - 1) / 2) * 26 * scale : 0;
    drawIngredient(ctx, item.id, x + spread, y - 6 * scale, 30 * scale, item.chopped, item.cooked, item.burnt);
  });
}

function drawOrderBoard(ctx, state) {
  ctx.fillStyle = COLORS.board;
  roundRect(ctx, 40, 24, 1200, 150, 14);
  ctx.fill();
  ctx.fillStyle = '#4a3421';
  roundRect(ctx, 48, 32, 1200 - 16, 150 - 16, 10);
  ctx.fill();
  text(ctx, '🍳  SIZZLE & SERVE — ORDER BOARD', 640, 52, 22, '#ffd166');
  text(ctx, 'serve the ticket before its patience runs out', 640, 76, 13, '#d8c3a5', 'center', 'normal');

  const slotW = 380;
  for (let i = 0; i < 3; i++) {
    const x = 70 + i * 400;
    const y = 92;
    const ticket = state.tickets[i];
    ctx.fillStyle = ticket ? COLORS.boardPaper : 'rgba(255,243,214,0.14)';
    roundRect(ctx, x, y, slotW, 66, 10);
    ctx.fill();
    if (!ticket) {
      text(ctx, '— empty —', x + slotW / 2, y + 33, 14, '#b7a586', 'center', 'normal');
      continue;
    }
    const urgent = ticket.patience < 8;
    const flashOn = urgent && ticket.flash < 0.25;
    if (flashOn) {
      ctx.fillStyle = 'rgba(228,87,46,0.25)';
      roundRect(ctx, x, y, slotW, 66, 10);
      ctx.fill();
    }
    ctx.fillStyle = ticket.recipe.color;
    ctx.beginPath();
    ctx.arc(x + 28, y + 22, 13, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, '#' + ticket.id, x + 28, y + 22, 11, '#fff', 'center', 'bold');
    text(ctx, ticket.recipe.name, x + 52, y + 20, 17, '#3a2a1e', 'left');
    text(ctx, '$' + ticket.recipe.price, x + slotW - 14, y + 20, 17, '#3a2a1e', 'right');
    // The recipe, as ingredient emoji.
    const items = ticket.recipe.items;
    items.forEach((id, j) => {
      ctx.font = '20px serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(INGREDIENTS[id].emoji, x + 52 + j * 28, y + 46);
    });
    // Patience bar.
    const frac = Math.max(0, ticket.patience / ticket.maxPatience);
    ctx.fillStyle = '#d8c3a5';
    roundRect(ctx, x + 52 + items.length * 28 + 8, y + 40, 150, 12, 6);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#7fb069' : frac > 0.25 ? '#f2a541' : '#e4572e';
    if (frac > 0) {
      roundRect(ctx, x + 52 + items.length * 28 + 8, y + 40, 150 * frac, 12, 6);
      ctx.fill();
    }
    text(ctx, Math.ceil(ticket.patience) + 's', x + slotW - 14, y + 46, 12, '#3a2a1e', 'right');
  }
}

function drawStation(ctx, state, s, highlight) {
  ctx.fillStyle = COLORS.counterFront;
  roundRect(ctx, s.x, s.y + 10, s.w, s.h, 8);
  ctx.fill();
  ctx.fillStyle = COLORS.counterTop;
  roundRect(ctx, s.x, s.y, s.w, s.h - 6, 8);
  ctx.fill();

  if (highlight) {
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 4;
    roundRect(ctx, s.x - 4, s.y - 4, s.w + 8, s.h + 6, 10);
    ctx.stroke();
  }

  const cx = s.x + s.w / 2;
  const cy = s.y + s.h / 2 - 8;
  if (s.kind === 'bin') {
    drawIngredient(ctx, s.item, cx, cy - 4, 34, false, false, false);
    text(ctx, s.label, cx, s.y + s.h - 16, 12, '#fff8ea');
  } else if (s.kind === 'grill') {
    ctx.fillStyle = '#2e2e33';
    roundRect(ctx, s.x + 12, s.y + 8, s.w - 24, 44, 6);
    ctx.fill();
    ctx.strokeStyle = '#8a8a94';
    ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(s.x + 12 + i * (s.w - 24) / 4, s.y + 10);
      ctx.lineTo(s.x + 12 + i * (s.w - 24) / 4, s.y + 50);
      ctx.stroke();
    }
    if (state.grill) {
      const spec = INGREDIENTS.patty;
      const frac = Math.min(1, state.grill.t / spec.cookSecs);
      drawIngredient(ctx, 'patty', cx, cy - 2, 34, false, state.grill.item.cooked, state.grill.item.burnt);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(s.x + 16, s.y + 56, (s.w - 32) * frac, 5);
      if (state.grill.item.cooked && !state.grill.item.burnt) text(ctx, 'READY!', cx, s.y - 12, 13, '#7fb069');
      if (state.grill.item.burnt) text(ctx, 'BURNT!', cx, s.y - 12, 13, '#e4572e');
    }
    text(ctx, s.label, cx, s.y + s.h - 16, 12, '#fff8ea');
  } else if (s.kind === 'fryer') {
    ctx.fillStyle = '#3d2c17';
    roundRect(ctx, s.x + 12, s.y + 8, s.w - 24, 44, 6);
    ctx.fill();
    ctx.fillStyle = '#e8a83c';
    roundRect(ctx, s.x + 16, s.y + 12, s.w - 32, 36, 5);
    ctx.fill();
    if (state.fryer) {
      const spec = INGREDIENTS.fries;
      const frac = Math.min(1, state.fryer.t / spec.cookSecs);
      drawIngredient(ctx, 'fries', cx, cy - 2, 34, false, state.fryer.item.cooked, state.fryer.item.burnt);
      ctx.fillStyle = '#fff8ea';
      ctx.fillRect(s.x + 16, s.y + 56, (s.w - 32) * frac, 5);
      if (state.fryer.item.cooked && !state.fryer.item.burnt) text(ctx, 'READY!', cx, s.y - 12, 13, '#7fb069');
      if (state.fryer.item.burnt) text(ctx, 'BURNT!', cx, s.y - 12, 13, '#e4572e');
    }
    text(ctx, s.label, cx, s.y + s.h - 16, 12, '#fff8ea');
  } else if (s.kind === 'chop') {
    ctx.fillStyle = '#d9b380';
    roundRect(ctx, s.x + 14, s.y + 10, s.w - 28, 40, 6);
    ctx.fill();
    const chef = state.chef;
    if (chef.chopProgress > 0) {
      ctx.fillStyle = '#7fb069';
      ctx.fillRect(s.x + 18, s.y + 54, (s.w - 36) * chef.chopProgress, 6);
      text(ctx, 'CHOPPING…', cx, s.y - 12, 13, '#ffd166');
    }
    text(ctx, s.label, cx, s.y + s.h - 16, 12, '#fff8ea');
  } else if (s.kind === 'plate') {
    if (state.plate.length > 0) drawPlate(ctx, cx, cy + 2, state.plate, 0.62);
    else {
      ctx.fillStyle = '#f4f6f8';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2, 30, 19, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b9c4cf';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    text(ctx, s.label, cx, s.y + s.h - 16, 12, '#fff8ea');
  }
}

function drawServeWindow(ctx, state, highlight) {
  ctx.fillStyle = '#5b3a22';
  roundRect(ctx, SERVE.x, SERVE.y, SERVE.w, SERVE.h, 8);
  ctx.fill();
  ctx.fillStyle = '#1d130c';
  roundRect(ctx, SERVE.x + 8, SERVE.y + 8, SERVE.w - 16, SERVE.h - 16, 6);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SERVE', SERVE.x + SERVE.w / 2, SERVE.y + 26);
  ctx.fillStyle = '#fff8ea';
  ctx.font = '26px serif';
  ctx.fillText('🛎️', SERVE.x + SERVE.w / 2, SERVE.y + 62);
  ctx.fillStyle = '#d8c3a5';
  ctx.font = '11px "Trebuchet MS", sans-serif';
  ctx.fillText('ring the bell', SERVE.x + SERVE.w / 2, SERVE.y + 92);
  ctx.fillText('with a full plate', SERVE.x + SERVE.w / 2, SERVE.y + 108);
  if (highlight) {
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 4;
    roundRect(ctx, SERVE.x - 4, SERVE.y - 4, SERVE.w + 8, SERVE.h + 8, 10);
    ctx.stroke();
  }
}

function drawTrash(ctx, highlight) {
  ctx.fillStyle = '#4a4a52';
  roundRect(ctx, TRASH.x, TRASH.y, TRASH.w, TRASH.h, 8);
  ctx.fill();
  ctx.font = '26px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🗑️', TRASH.x + TRASH.w / 2, TRASH.y + TRASH.h / 2 - 6);
  text(ctx, TRASH.label, TRASH.x + TRASH.w / 2, TRASH.y + TRASH.h - 12, 11, '#fff8ea');
  if (highlight) {
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 4;
    roundRect(ctx, TRASH.x - 4, TRASH.y - 4, TRASH.w + 8, TRASH.h + 8, 10);
    ctx.stroke();
  }
}

function drawChef(ctx, state) {
  const chef = state.chef;
  const bob = chef.moving ? Math.sin(state.time * 14) * 3 : 0;
  const headY = chef.y + bob - 10;
  const bodyY = chef.y + bob + 14;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(chef.x, chef.y + CHEF_RADIUS + 4, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body (white chef coat) with a red apron on its lower half.
  ctx.fillStyle = '#f4f6f8';
  ctx.beginPath();
  ctx.arc(chef.x, bodyY, 19, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c8ccd2';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#e4572e';
  roundRect(ctx, chef.x - 11, bodyY + 2, 22, 13, 5);
  ctx.fill();
  // Head, separate from the body so the apron never reads as a mouth.
  ctx.fillStyle = '#ffd9b3';
  ctx.beginPath();
  ctx.arc(chef.x, headY, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8b98a';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(chef.x - 9, headY - 14, 9, 0, Math.PI * 2);
  ctx.arc(chef.x + 9, headY - 14, 9, 0, Math.PI * 2);
  ctx.arc(chef.x, headY - 20, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(chef.x - 16, headY - 14, 32, 8);
  // Eyes look in the walking direction; a small smile underneath.
  ctx.fillStyle = '#241a12';
  ctx.beginPath();
  ctx.arc(chef.x - 6 + chef.dir * 3, headY - 2, 2.6, 0, Math.PI * 2);
  ctx.arc(chef.x + 6 + chef.dir * 3, headY - 2, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#241a12';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(chef.x + chef.dir * 2, headY + 5, 5, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // Carried item floats above the hat, with a dark pill behind its label.
  if (chef.carrying) {
    const item = chef.carrying;
    const label = itemLabel(item);
    ctx.font = 'bold 12px "Trebuchet MS", Verdana, sans-serif';
    const w = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    roundRect(ctx, chef.x - w / 2 - 8, headY - 66, w + 16, 20, 9);
    ctx.fill();
    drawIngredient(ctx, item.id, chef.x, headY - 40, 30, item.chopped, item.cooked, item.burnt);
    text(ctx, label, chef.x, headY - 56, 12, '#fff8ea');
  }
  // Chopping progress ring.
  if (chef.chopProgress > 0) {
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(chef.x, chef.y + bob, CHEF_RADIUS + 8, -Math.PI / 2, -Math.PI / 2 + chef.chopProgress * Math.PI * 2);
    ctx.stroke();
  }
}

function drawHud(ctx, state) {
  ctx.fillStyle = COLORS.hud;
  roundRect(ctx, 40, 716, 1200, 64, 12);
  ctx.fill();
  const mins = Math.floor(state.shiftLeft / 60);
  const secs = Math.floor(state.shiftLeft % 60);
  const clock = mins + ':' + String(secs).padStart(2, '0');
  const urgent = state.shiftLeft <= 30;
  text(ctx, '⏱ ' + clock, 120, 748, 26, urgent ? '#e4572e' : '#ffd166', 'left');
  text(ctx, 'SHIFT', 120, 768, 11, '#d8c3a5', 'left', 'normal');
  // Shift progress bar.
  ctx.fillStyle = '#4a3421';
  roundRect(ctx, 220, 740, 180, 14, 7);
  ctx.fill();
  ctx.fillStyle = urgent ? '#e4572e' : '#7fb069';
  const frac = state.shiftLeft / 150;
  if (frac > 0) { roundRect(ctx, 220, 740, 180 * frac, 14, 7); ctx.fill(); }

  text(ctx, '🪙 ' + state.coins, 480, 748, 24, '#ffd166', 'left');
  text(ctx, 'COINS', 480, 768, 11, '#d8c3a5', 'left', 'normal');
  text(ctx, '✅ ' + state.served + ' served', 640, 748, 20, '#fff8ea', 'left');
  text(ctx, '❌ ' + state.lost + ' walked out', 640, 768, 12, '#d8c3a5', 'left', 'normal');
  text(ctx, state.streak >= 2 ? '🔥 streak x' + state.streak : 'streak —', 900, 748, 20, state.streak >= 2 ? '#f2a541' : '#d8c3a5', 'left');
  text(ctx, 'best x' + state.bestStreak, 900, 768, 12, '#d8c3a5', 'left', 'normal');
  const plateText = state.plate.length
    ? 'Plate: ' + state.plate.map((i) => INGREDIENTS[i.id].emoji).join(' ')
    : 'Plate: empty';
  text(ctx, plateText, 1220, 748, 16, '#fff8ea', 'right');
  text(ctx, 'E: use · R: restart', 1220, 768, 11, '#d8c3a5', 'right', 'normal');
}

function drawFloaters(ctx, state) {
  for (const f of state.floaters) {
    ctx.globalAlpha = Math.min(1, f.life);
    text(ctx, f.text, f.x, f.y, 18, f.color);
    ctx.globalAlpha = 1;
  }
}

function drawToast(ctx, state) {
  if (state.toastLife <= 0 || !state.toast) return;
  ctx.globalAlpha = Math.min(1, state.toastLife);
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  roundRect(ctx, 640 - 260, 668, 520, 34, 10);
  ctx.fill();
  text(ctx, state.toast, 640, 686, 15, '#fff8ea');
  ctx.globalAlpha = 1;
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(20,12,6,0.72)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  text(ctx, '🍳', 640, 220, 90, '#fff');
  text(ctx, 'SIZZLE & SERVE', 640, 320, 64, '#ffd166');
  text(ctx, 'a tiny kitchen rush — cook it, plate it, serve it before they walk out', 640, 368, 20, '#fff8ea', 'center', 'normal');
  text(ctx, 'WASD / arrows to move · E or click to grab, chop, grill, plate & serve', 640, 420, 18, '#d8c3a5', 'center', 'normal');
  text(ctx, 'Match every ticket exactly. Fast serves pay tips, streaks pay bonuses.', 640, 448, 18, '#d8c3a5', 'center', 'normal');
  text(ctx, 'Press E or click anywhere to start the shift', 640, 520, 22, '#7fb069');
  text(ctx, '7 dishes on the menu · 150-second shift · the rush grows', 640, 560, 15, '#d8c3a5', 'center', 'normal');
}

function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(20,12,6,0.78)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  text(ctx, '🎉  SHIFT COMPLETE!', 640, 260, 52, '#ffd166');
  text(ctx, state.overReason, 640, 312, 20, '#fff8ea', 'center', 'normal');
  text(ctx, '🪙 ' + state.coins + ' coins', 640, 390, 34, '#ffd166');
  text(ctx, '✅ ' + state.served + ' dishes served   ·   ❌ ' + state.lost + ' customers walked out', 640, 440, 20, '#fff8ea', 'center', 'normal');
  text(ctx, 'Best streak: x' + state.bestStreak, 640, 478, 20, '#f2a541', 'center', 'normal');
  const verdict = state.coins >= 120 ? 'Head chef material. The kitchen is yours.'
    : state.coins >= 60 ? 'A solid shift — the regulars are happy.'
    : 'A quiet shift. The grill is still warm for another go.';
  text(ctx, verdict, 640, 530, 18, '#d8c3a5', 'center', 'normal');
  text(ctx, 'Press R to run it back', 640, 590, 20, '#7fb069');
}

export function render(ctx, state, highlightId) {
  // Walls and floor.
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  const tile = 60;
  for (let y = FLOOR.y; y < FLOOR.y + FLOOR.h; y += tile) {
    for (let x = FLOOR.x; x < FLOOR.x + FLOOR.w; x += tile) {
      const even = ((x - FLOOR.x) / tile + (y - FLOOR.y) / tile) % 2 === 0;
      ctx.fillStyle = even ? COLORS.floorTileA : COLORS.floorTileB;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 2;
  ctx.strokeRect(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h);

  // A worn rug in the middle of the floor and two potted plants, so the
  // kitchen reads as a place someone works in, not an empty grid.
  ctx.fillStyle = '#a34d3f';
  roundRect(ctx, 480, 470, 320, 130, 12);
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 3;
  roundRect(ctx, 494, 484, 292, 102, 8);
  ctx.stroke();
  text(ctx, '🍳', 640, 535, 40, '#fff');
  for (const px of [70, 1180]) {
    ctx.fillStyle = '#b0613f';
    roundRect(ctx, px, 680, 44, 34, 6);
    ctx.fill();
    ctx.font = '34px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌿', px + 22, 668);
  }

  drawOrderBoard(ctx, state);
  for (const s of STATIONS) drawStation(ctx, state, s, highlightId === s.id);
  drawServeWindow(ctx, state, highlightId === 'serve');
  drawTrash(ctx, highlightId === 'trash');

  // The plated dish waiting on the counter reads as "plate ready to serve".
  if (state.plate.length > 0) {
    text(ctx, '🍽️ ready to serve!', 1170, 312, 13, '#ffd166');
  }
  drawChef(ctx, state);
  drawFloaters(ctx, state);
  drawToast(ctx, state);
  drawHud(ctx, state);
  if (state.phase === 'title') drawTitle(ctx, state);
  if (state.phase === 'over') drawGameOver(ctx, state);
}
