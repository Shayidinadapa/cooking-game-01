// input.js — keyboard and mouse, nothing else. The game reads a plain
// snapshot each frame: which move keys are held, whether interact was just
// pressed or is held, and where the mouse clicked.

export function createInput(canvas) {
  const input = {
    up: false, down: false, left: false, right: false,
    interactHeld: false,
    interactPressed: false, // consumed by the game each frame
    click: null,            // { x, y } in canvas pixels, consumed each frame
    mouse: { x: 0, y: 0 },
  };

  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
  };

  window.addEventListener('keydown', (e) => {
    if (KEYMAP[e.code] !== undefined) {
      input[KEYMAP[e.code]] = true;
      e.preventDefault();
    }
    if (e.code === 'KeyE' || e.code === 'Space') {
      if (!e.repeat) input.interactPressed = true;
      input.interactHeld = true;
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => {
    if (KEYMAP[e.code] !== undefined) input[KEYMAP[e.code]] = false;
    if (e.code === 'KeyE' || e.code === 'Space') input.interactHeld = false;
  });

  function canvasPoint(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }
  canvas.addEventListener('mousemove', (e) => {
    input.mouse = canvasPoint(e);
  });
  canvas.addEventListener('mousedown', (e) => {
    const p = canvasPoint(e);
    input.mouse = p;
    input.click = p;
    input.interactPressed = true;
    input.interactHeld = true;
  });
  canvas.addEventListener('mouseup', () => { input.interactHeld = false; });
  canvas.addEventListener('mouseleave', () => { input.interactHeld = false; });

  return input;
}

// Read the movement direction as a unit vector (0,0 when idle).
export function moveVector(input) {
  let x = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let y = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
  return { x, y };
}

export function consumeFrame(input) {
  input.interactPressed = false;
  input.click = null;
}
