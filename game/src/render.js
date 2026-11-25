// Drawing only: the world's state and the current screen in, pixels out. The
// 1280x720 playfield is scaled to fit the window and centred, the margin filled
// with the backdrop colour. Everything is drawn with canvas shapes and text —
// no image files, no network. Text that holds a number is rebuilt only when the
// number changes, so a frame allocates nothing.
import { DISHES, FIELD, FONT, INGREDIENTS, LIVES, PALETTE, SHIFT_SECONDS } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

/** Ingredient bins: 3 columns, 2 rows. */
const BINS = { x: [28, 228, 428], y: [196, 290], w: 190, h: 84 };
/** The assembly plate in the middle of the counter. */
const PLATE = { cx: 780, cy: 292, rx: 118, ry: 74 };
/** The stove on the right, and the serving shelf under it. */
const STOVE = { x: 928, y: 196, w: 324, h: 104, burners: [[1012, 248], [1172, 248]] };
const SERVE = { x: 928, y: 312, w: 324, h: 108, cx: 1090, cy: 378 };
/** The three order tickets on the board. */
const TICKETS = { x: [28, 444, 860], y: 76, w: 392, h: 88 };
/** The cook standing on the floor, bottom left. */
const CHEF = { x: 90, y: 486 };

function cachedLabel(prefix) {
  let value = -1;
  let text = '';
  return function label(next) {
    if (next !== value) {
      value = next;
      text = prefix + next;
    }
    return text;
  };
}

function ingredientById(id) {
  for (const ing of INGREDIENTS) if (ing.id === id) return ing;
  return INGREDIENTS[0];
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const coinsLabel = cachedLabel('KOIN ');
  const levelLabel = cachedLabel('LV ');
  const comboLabel = cachedLabel('COMBO x');
  const finalLabel = cachedLabel('Skor ');
  const bestLabel = cachedLabel('Terbaik ');
  const servedLabel = cachedLabel('Hidangan diantar ');

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align, bold) {
    if (!fonts.has(size + (bold ? 'b' : ''))) fonts.set(size + (bold ? 'b' : ''), `${bold ? '700 ' : ''}${size}px ${FONT}`);
    context.font = fonts.get(size + (bold ? 'b' : ''));
    context.fillStyle = color;
    context.textAlign = align;
    context.textBaseline = 'alphabetic';
    context.fillText(value, x, y);
  }

  function roundRect(x, y, w, h, r) {
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + w, y, x + w, y + h, r);
    context.arcTo(x + w, y + h, x, y + h, r);
    context.arcTo(x, y + h, x, y, r);
    context.arcTo(x, y, x + w, y, r);
    context.closePath();
  }

  function ellipse(cx, cy, rx, ry) {
    context.beginPath();
    context.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  }

  /** A small vector icon for one ingredient, centred at (cx, cy) with radius r. */
  function drawIngredientIcon(id, cx, cy, r) {
    if (id === 'nasi') {
      context.fillStyle = '#f5efdd';
      ellipse(cx, cy + r * 0.25, r, r * 0.62);
      context.fill();
      ellipse(cx, cy - r * 0.25, r * 0.62, r * 0.5);
      context.fill();
      context.strokeStyle = '#c9bd9a';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(cx - r * 0.4, cy - r * 0.9);
      context.quadraticCurveTo(cx - r * 0.55, cy - r * 1.2, cx - r * 0.35, cy - r * 1.4);
      context.moveTo(cx + r * 0.3, cy - r * 0.9);
      context.quadraticCurveTo(cx + r * 0.45, cy - r * 1.2, cx + r * 0.25, cy - r * 1.4);
      context.stroke();
    } else if (id === 'mie') {
      context.strokeStyle = '#f2c94c';
      context.lineWidth = r * 0.28;
      context.lineCap = 'round';
      for (let i = -1; i <= 1; i += 1) {
        context.beginPath();
        context.moveTo(cx - r * 0.85, cy + i * r * 0.45);
        context.quadraticCurveTo(cx - r * 0.3, cy + i * r * 0.45 - r * 0.4, cx + r * 0.2, cy + i * r * 0.45);
        context.quadraticCurveTo(cx + r * 0.6, cy + i * r * 0.45 + r * 0.4, cx + r * 0.9, cy + i * r * 0.45);
        context.stroke();
      }
    } else if (id === 'ayam') {
      context.fillStyle = '#e8a06a';
      context.beginPath();
      context.arc(cx - r * 0.1, cy, r * 0.72, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = '#f5efdd';
      context.lineWidth = r * 0.22;
      context.beginPath();
      context.moveTo(cx + r * 0.5, cy + r * 0.3);
      context.lineTo(cx + r * 1.05, cy + r * 0.75);
      context.stroke();
      context.fillStyle = '#f5efdd';
      context.beginPath();
      context.arc(cx + r * 1.05, cy + r * 0.62, r * 0.2, 0, Math.PI * 2);
      context.arc(cx + r * 1.2, cy + r * 0.88, r * 0.2, 0, Math.PI * 2);
      context.fill();
    } else if (id === 'telur') {
      context.fillStyle = '#fffdf6';
      ellipse(cx, cy, r * 0.95, r * 0.7);
      context.fill();
      context.fillStyle = '#f2a93b';
      context.beginPath();
      context.arc(cx, cy, r * 0.42, 0, Math.PI * 2);
      context.fill();
    } else if (id === 'sayur') {
      context.fillStyle = '#7bc47f';
      for (let i = -1; i <= 1; i += 1) {
        context.save();
        context.translate(cx + i * r * 0.45, cy);
        context.rotate(i * 0.5);
        ellipse(0, 0, r * 0.32, r * 0.62);
        context.fill();
        context.restore();
      }
      context.strokeStyle = '#3e7d44';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(cx, cy + r * 0.6);
      context.lineTo(cx, cy + r);
      context.stroke();
    } else if (id === 'sambal') {
      context.fillStyle = '#e5534b';
      context.beginPath();
      context.moveTo(cx - r * 0.9, cy - r * 0.3);
      context.quadraticCurveTo(cx, cy - r * 1.1, cx + r * 0.9, cy + r * 0.1);
      context.quadraticCurveTo(cx + r * 0.7, cy + r * 0.7, cx, cy + r * 0.55);
      context.quadraticCurveTo(cx - r * 0.7, cy + r * 0.4, cx - r * 0.9, cy - r * 0.3);
      context.fill();
      context.strokeStyle = '#3e7d44';
      context.lineWidth = r * 0.18;
      context.beginPath();
      context.moveTo(cx + r * 0.85, cy + r * 0.05);
      context.lineTo(cx + r * 1.15, cy - r * 0.25);
      context.stroke();
    }
  }

  function drawHeart(cx, cy, r, filled) {
    context.fillStyle = filled ? PALETTE.red : '#5a4632';
    context.beginPath();
    context.arc(cx - r * 0.45, cy - r * 0.2, r * 0.5, 0, Math.PI * 2);
    context.arc(cx + r * 0.45, cy - r * 0.2, r * 0.5, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.moveTo(cx - r * 0.95, cy);
    context.lineTo(cx + r * 0.95, cy);
    context.lineTo(cx, cy + r * 1.05);
    context.closePath();
    context.fill();
  }

  function drawTicket(order, slot) {
    const x = TICKETS.x[slot];
    const y = TICKETS.y;
    const w = TICKETS.w;
    const h = TICKETS.h;
    const ratio = Math.max(0, order.patience / order.maxPatience);
    context.save();
    context.shadowColor = 'rgba(0,0,0,0.35)';
    context.shadowBlur = 8;
    context.shadowOffsetY = 3;
    context.fillStyle = PALETTE.ticket;
    roundRect(x, y, w, h, 10);
    context.fill();
    context.restore();
    // Dish icon: a small plate with the dish colour.
    context.fillStyle = PALETTE.plateEdge;
    context.beginPath();
    context.arc(x + 44, y + 34, 26, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = order.dish.color;
    context.beginPath();
    context.arc(x + 44, y + 34, 18, 0, Math.PI * 2);
    context.fill();
    text(order.dish.name, x + 80, y + 32, 24, PALETTE.text, 'left', true);
    text(`${order.dish.price} koin`, x + w - 16, y + 32, 20, '#8a6d1f', 'right', true);
    // The three ingredients, as coloured dots with names.
    let dx = x + 80;
    for (const need of order.dish.needs) {
      const ing = ingredientById(need);
      context.fillStyle = ing.color;
      context.strokeStyle = ing.dark;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(dx + 8, y + 60, 8, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      text(ing.name, dx + 22, y + 67, 16, PALETTE.text, 'left');
      dx += 22 + context.measureText(ing.name).width + 22;
    }
    // Patience bar along the bottom of the ticket.
    context.fillStyle = '#e8ddc0';
    roundRect(x + 12, y + h - 14, w - 24, 8, 4);
    context.fill();
    context.fillStyle = ratio > 0.5 ? PALETTE.green : ratio > 0.25 ? PALETTE.gold : PALETTE.red;
    if (ratio > 0) {
      roundRect(x + 12, y + h - 14, (w - 24) * ratio, 8, 4);
      context.fill();
    }
  }

  function drawBin(index) {
    const ing = INGREDIENTS[index];
    const x = BINS.x[index % 3];
    const y = BINS.y[Math.floor(index / 3)];
    context.fillStyle = '#f7ead0';
    context.strokeStyle = '#b98d54';
    context.lineWidth = 3;
    roundRect(x, y, BINS.w, BINS.h, 12);
    context.fill();
    context.stroke();
    drawIngredientIcon(ing.id, x + 44, y + BINS.h / 2, 26);
    text(ing.name, x + 84, y + 38, 21, PALETTE.text, 'left', true);
    text(`tombol ${ing.key}`, x + 84, y + 64, 15, '#8a7f5c', 'left');
    context.fillStyle = PALETTE.board;
    context.beginPath();
    context.arc(x + BINS.w - 20, y + BINS.h - 20, 13, 0, Math.PI * 2);
    context.fill();
    text(ing.key, x + BINS.w - 20, y + BINS.h - 15, 15, PALETTE.textLight, 'center', true);
  }

  function drawPlate(state) {
    const { cx, cy, rx, ry } = PLATE;
    context.fillStyle = '#d8c49a';
    ellipse(cx, cy + 8, rx + 14, ry + 10);
    context.fill();
    context.fillStyle = PALETTE.plate;
    ellipse(cx, cy, rx, ry);
    context.fill();
    context.strokeStyle = PALETTE.plateEdge;
    context.lineWidth = 3;
    ellipse(cx, cy, rx - 12, ry - 10);
    context.stroke();
    // The ingredients already on the plate.
    for (let i = 0; i < state.plate.length; i += 1) {
      const ing = ingredientById(state.plate[i]);
      drawIngredientIcon(ing.id, cx - 44 + i * 44, cy - 6, 24);
    }
    if (state.plate.length === 0 && !state.cooking) {
      text('PIRING', cx, cy - 2, 22, '#a89a7c', 'center');
      text('klik bahan 1-6', cx, cy + 26, 16, '#a89a7c', 'center');
    }
    if (state.cooking) {
      text(state.cooking.dish.name, cx, cy - ry - 14, 20, PALETTE.textLight, 'center', true);
    }
  }

  function drawStove(state) {
    context.fillStyle = PALETTE.stove;
    roundRect(STOVE.x, STOVE.y, STOVE.w, STOVE.h, 12);
    context.fill();
    context.fillStyle = PALETTE.stoveTop;
    roundRect(STOVE.x + 10, STOVE.y + 10, STOVE.w - 20, STOVE.h - 20, 8);
    context.fill();
    for (const [bx, by] of STOVE.burners) {
      context.fillStyle = '#15161c';
      context.beginPath();
      context.arc(bx, by, 52, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = '#4a4d55';
      context.lineWidth = 3;
      context.beginPath();
      context.arc(bx, by, 40, 0, Math.PI * 2);
      context.stroke();
    }
    if (state.cooking) {
      const [bx, by] = STOVE.burners[0];
      const ratio = Math.min(1, state.cooking.t / state.cooking.total);
      context.fillStyle = '#2c2c34';
      context.beginPath();
      context.arc(bx, by, 46, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = state.cooking.dish.color;
      context.beginPath();
      context.moveTo(bx, by);
      context.arc(bx, by, 46, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2);
      context.closePath();
      context.fill();
      drawIngredientIcon(state.cooking.dish.needs[0], bx, by, 20);
      text('MEMASAK...', bx, by + 66, 15, PALETTE.textLight, 'center', true);
    }
    text('KOMPOR', STOVE.x + 16, STOVE.y + 24, 15, '#8b93a3', 'left', true);
  }

  function drawServe(state) {
    context.fillStyle = '#f7ead0';
    context.strokeStyle = '#b98d54';
    context.lineWidth = 3;
    roundRect(SERVE.x, SERVE.y, SERVE.w, SERVE.h, 12);
    context.fill();
    context.stroke();
    text('SIAP DIANTAR', SERVE.cx, SERVE.y + 20, 15, '#8a7f5c', 'center', true);
    if (state.serving) {
      const dish = state.serving.dish;
      context.fillStyle = PALETTE.plate;
      ellipse(SERVE.cx, SERVE.cy, 62, 34);
      context.fill();
      context.strokeStyle = PALETTE.plateEdge;
      context.lineWidth = 2;
      ellipse(SERVE.cx, SERVE.cy, 52, 27);
      context.stroke();
      context.fillStyle = dish.color;
      ellipse(SERVE.cx, SERVE.cy - 4, 40, 20);
      context.fill();
      drawIngredientIcon(dish.needs[0], SERVE.cx - 20, SERVE.cy - 6, 13);
      drawIngredientIcon(dish.needs[1], SERVE.cx + 4, SERVE.cy - 8, 13);
      drawIngredientIcon(dish.needs[2], SERVE.cx + 24, SERVE.cy - 4, 13);
      // Steam curls above the hot dish, short enough to stay clear of the header.
      context.strokeStyle = 'rgba(120,110,90,0.7)';
      context.lineWidth = 2;
      for (let i = -1; i <= 1; i += 1) {
        context.beginPath();
        context.moveTo(SERVE.cx + i * 22, SERVE.cy - 28);
        context.quadraticCurveTo(SERVE.cx + i * 22 - 6, SERVE.cy - 38, SERVE.cx + i * 22, SERVE.cy - 46);
        context.stroke();
      }
      const pulse = 0.5 + 0.5 * Math.sin(state.elapsed * 5);
      context.fillStyle = `rgba(123,196,127,${0.55 + 0.45 * pulse})`;
      roundRect(SERVE.cx - 58, SERVE.y + SERVE.h - 30, 116, 22, 11);
      context.fill();
      text('KLIK TIKET!', SERVE.cx, SERVE.y + SERVE.h - 14, 14, '#1d3a20', 'center', true);
    } else {
      text('belum ada hidangan', SERVE.cx, SERVE.cy + 6, 16, '#a89a7c', 'center');
    }
  }

  function drawChef(state) {
    const x = CHEF.x;
    const y = CHEF.y;
    const bob = Math.sin(state.elapsed * 2) * 3;
    // Body and apron.
    context.fillStyle = '#fdfdf8';
    roundRect(x - 58, y + 66 + bob, 116, 118, 24);
    context.fill();
    context.fillStyle = '#7bc47f';
    roundRect(x - 40, y + 96 + bob, 80, 88, 14);
    context.fill();
    // Arms: one holds a wooden spoon toward the plate.
    context.strokeStyle = '#f2c9a0';
    context.lineWidth = 16;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(x - 52, y + 84 + bob);
    context.lineTo(x - 92, y + 40 + bob);
    context.stroke();
    context.beginPath();
    context.moveTo(x + 52, y + 84 + bob);
    context.lineTo(x + 96, y + 30 + bob);
    context.stroke();
    context.strokeStyle = '#8a5a33';
    context.lineWidth = 8;
    context.beginPath();
    context.moveTo(x + 96, y + 30 + bob);
    context.lineTo(x + 118, y - 6 + bob);
    context.stroke();
    // Head and smile.
    context.fillStyle = '#f2c9a0';
    context.beginPath();
    context.arc(x, y + 30 + bob, 46, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#2b2118';
    context.beginPath();
    context.arc(x - 16, y + 24 + bob, 5, 0, Math.PI * 2);
    context.arc(x + 16, y + 24 + bob, 5, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#2b2118';
    context.lineWidth = 3;
    context.beginPath();
    context.arc(x, y + 34 + bob, 18, 0.15 * Math.PI, 0.85 * Math.PI);
    context.stroke();
    // Tall chef hat.
    context.fillStyle = '#fdfdf8';
    roundRect(x - 44, y - 46 + bob, 88, 52, 20);
    context.fill();
    context.beginPath();
    context.arc(x - 28, y - 44 + bob, 20, 0, Math.PI * 2);
    context.arc(x, y - 54 + bob, 22, 0, Math.PI * 2);
    context.arc(x + 28, y - 44 + bob, 20, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#e8a33d';
    context.fillRect(x - 44, y + 2 + bob, 88, 8);
  }

  function drawKitchen(state) {
    // Wall and floor.
    context.fillStyle = PALETTE.wall;
    context.fillRect(0, 0, FIELD.width, 470);
    context.fillStyle = PALETTE.wallTrim;
    context.fillRect(0, 452, FIELD.width, 18);
    context.fillStyle = PALETTE.floor;
    context.fillRect(0, 470, FIELD.width, FIELD.height - 470);
    context.fillStyle = PALETTE.floorDark;
    for (let y = 500; y < FIELD.height; y += 44) context.fillRect(0, y, FIELD.width, 3);
    // Wall tiles behind the counter.
    context.fillStyle = 'rgba(217,179,128,0.35)';
    for (let x = 0; x < FIELD.width; x += 64) {
      for (let y = 170; y < 452; y += 64) context.fillRect(x + 2, y + 2, 60, 60);
    }
    // Order board.
    context.fillStyle = PALETTE.boardFrame;
    roundRect(16, 68, FIELD.width - 32, 104, 14);
    context.fill();
    context.fillStyle = PALETTE.board;
    roundRect(24, 76, FIELD.width - 48, 88, 10);
    context.fill();
    text('PAPAN PESANAN', 44, 100, 15, '#d9b380', 'left', true);
    for (let i = 0; i < state.orders.length; i += 1) drawTicket(state.orders[i], i);
    if (state.orders.length === 0) {
      text('Belum ada pesanan — pelanggan segera datang...', FIELD.width / 2, 128, 20, '#d9b380', 'center');
    }
    // Counter stations.
    for (let i = 0; i < INGREDIENTS.length; i += 1) drawBin(i);
    drawPlate(state);
    drawStove(state);
    drawServe(state);
    // Counter top strip.
    context.fillStyle = PALETTE.counterTop;
    context.fillRect(0, 420, FIELD.width, 32);
    context.fillStyle = PALETTE.counter;
    context.fillRect(0, 444, FIELD.width, 8);
    drawChef(state);
    // Floating score texts.
    for (const f of state.floats) {
      const alpha = Math.max(0, 1 - f.t / f.life);
      context.globalAlpha = alpha;
      text(f.text, f.x, f.y - f.t * 40, 26, f.color, 'center', true);
      context.globalAlpha = 1;
    }
    // Hint line at the bottom.
    text('Klik bahan (1-6) untuk meracik  •  klik tiket pesanan untuk mengantar  •  Spasi antar otomatis  •  P jeda', 640, 706, 17, '#d9b380', 'center');
  }

  function drawHud(state) {
    context.fillStyle = PALETTE.panel;
    context.fillRect(0, 0, FIELD.width, 56);
    text(coinsLabel(state.score), 24, 38, 28, PALETTE.gold, 'left', true);
    if (state.combo >= 2) text(comboLabel(state.combo), 220, 38, 22, '#ff9d5c', 'left', true);
    text(levelLabel(state.level), 380, 38, 22, PALETTE.textLight, 'left', true);
    // Shift timer, centre.
    const ratio = Math.max(0, state.timeLeft / SHIFT_SECONDS);
    const mm = Math.floor(state.timeLeft / 60);
    const ss = Math.floor(state.timeLeft % 60).toString().padStart(2, '0');
    context.fillStyle = '#171310';
    roundRect(440, 16, 400, 24, 12);
    context.fill();
    context.fillStyle = ratio > 0.5 ? PALETTE.green : ratio > 0.25 ? PALETTE.gold : PALETTE.red;
    if (ratio > 0) {
      roundRect(440, 16, 400 * ratio, 24, 12);
      context.fill();
    }
    text(`${mm}:${ss}`, 640, 35, 20, PALETTE.textLight, 'center', true);
    // Hearts, right.
    for (let i = 0; i < LIVES; i += 1) drawHeart(1180 - i * 44, 28, 15, i < state.lives);
    text('NYAWA', 1090, 36, 16, '#d9b380', 'right', true);
  }

  function drawPanel(title, lines, prompt) {
    const width = 640;
    const height = 150 + lines.length * 34 + 70;
    const x = (FIELD.width - width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = 'rgba(20,14,8,0.55)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.panel;
    roundRect(x, y, width, height, 18);
    context.fill();
    context.strokeStyle = PALETTE.gold;
    context.lineWidth = 3;
    roundRect(x, y, width, height, 18);
    context.stroke();
    text(title, FIELD.width / 2, y + 72, 46, PALETTE.gold, 'center', true);
    for (let i = 0; i < lines.length; i += 1) {
      text(lines[i], FIELD.width / 2, y + 122 + i * 34, 21, PALETTE.textLight, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 36, 23, PALETTE.gold, 'center', true);
  }

  const TITLE_LINES = ['Racik pesanan, masak di kompor, antar sebelum pelanggan kabur.', 'Setiap hidangan butuh 3 bahan yang tepat.', ''];
  const PAUSED_LINES = ['Kompor menunggu, pelanggan menunggu.'];
  const OVER_LINES = ['', '', ''];

  /** Paint one frame: the kitchen, then the HUD or a panel for the screen. */
  function draw(state, screen, best) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    // Deterministic shake: a wobble from elapsed time, never Math.random.
    const shakeX = state.shake > 0 ? Math.sin(state.elapsed * 47) * 5 * state.shake : 0;
    const shakeY = state.shake > 0 ? Math.cos(state.elapsed * 39) * 4 * state.shake : 0;
    context.setTransform(view.scale, 0, 0, view.scale, view.x + shakeX * view.scale, view.y + shakeY * view.scale);
    drawKitchen(state);
    if (screen === SCREEN_TITLE) {
      TITLE_LINES[2] = bestLabel(best);
      drawPanel('DAPUR KILAT', TITLE_LINES, 'Tekan Spasi atau klik untuk mulai');
      return;
    }
    drawHud(state);
    if (screen === SCREEN_PAUSED) drawPanel('Jeda', PAUSED_LINES, 'Tekan P untuk lanjut');
    else if (screen === SCREEN_OVER) {
      OVER_LINES[0] = finalLabel(state.score);
      OVER_LINES[1] = servedLabel(state.served);
      OVER_LINES[2] = bestLabel(best);
      drawPanel(state.win ? 'Shift Selesai!' : 'Dapur Tutup!', OVER_LINES, 'Tekan Spasi atau klik untuk main lagi');
    }
  }

  /** Turn a client-space pointer position into field coordinates. */
  function toField(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) * (canvas.width / rect.width) - view.x) / view.scale,
      y: ((clientY - rect.top) * (canvas.height / rect.height) - view.y) / view.scale,
    };
  }

  /** What a click at field coordinates hits: a bin, a ticket, the plate, or nothing. */
  function hitTest(x, y) {
    for (let i = 0; i < INGREDIENTS.length; i += 1) {
      const bx = BINS.x[i % 3];
      const by = BINS.y[Math.floor(i / 3)];
      if (x >= bx && x < bx + BINS.w && y >= by && y < by + BINS.h) return { type: 'ingredient', index: i };
    }
    for (let i = 0; i < 3; i += 1) {
      const tx = TICKETS.x[i];
      if (x >= tx && x < tx + TICKETS.w && y >= TICKETS.y && y < TICKETS.y + TICKETS.h) return { type: 'ticket', index: i };
    }
    const dx = x - PLATE.cx;
    const dy = y - PLATE.cy;
    if ((dx * dx) / (PLATE.rx * PLATE.rx) + (dy * dy) / (PLATE.ry * PLATE.ry) <= 1) return { type: 'plate' };
    if (x >= SERVE.x && x < SERVE.x + SERVE.w && y >= SERVE.y && y < SERVE.y + SERVE.h) return { type: 'serve' };
    return null;
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw, toField, hitTest };
}
