// Dapur Kilat rules, with no drawing and no browser in them: orders arriving and
// losing patience, the plate, the stove, serving, coins, combo, hearts and the
// shift timer. step() advances one fixed step and returns what happened as bit
// flags, so the caller can react without the world knowing about screens or sound.
// Nothing here allocates after createWorld returns.
import {
  COOK_SECONDS, DISHES, FIELD, INGREDIENTS, LEVEL, LIVES, PATIENCE,
  SHIFT_SECONDS, SPAWN,
} from './config.js';

export const EVENT_SERVE = 1;
export const EVENT_WRONG = 2;
export const EVENT_MISS = 4;
export const EVENT_OVER = 8;
export const EVENT_COOK = 16;

/** The dish whose recipe exactly matches the ingredients on the plate, or null. */
export function dishFor(plate) {
  if (plate.length !== 3) return null;
  const sorted = [...plate].sort().join(',');
  for (const dish of DISHES) {
    if ([...dish.needs].sort().join(',') === sorted) return dish;
  }
  return null;
}

function patienceFor(level) {
  return Math.max(PATIENCE.min, PATIENCE.base + PATIENCE.perLevel * (level - 1));
}

function spawnInterval(level) {
  return Math.max(SPAWN.min, SPAWN.base + SPAWN.perLevel * (level - 1));
}

export function createWorld(random) {
  const state = {
    score: 0, lives: LIVES, level: 1, elapsed: 0, timeLeft: SHIFT_SECONDS,
    combo: 0, maxCombo: 0, served: 0, missed: 0,
    orders: [], orderTimer: SPAWN.base, orderId: 0,
    plate: [], cooking: null, serving: null,
    floats: [], over: false, win: false, shake: 0, flash: 0,
  };

  function reset() {
    state.score = 0;
    state.lives = LIVES;
    state.level = 1;
    state.elapsed = 0;
    state.timeLeft = SHIFT_SECONDS;
    state.combo = 0;
    state.maxCombo = 0;
    state.served = 0;
    state.missed = 0;
    state.orders.length = 0;
    state.orderTimer = 2.5;
    state.orderId = 0;
    state.plate.length = 0;
    state.cooking = null;
    state.serving = null;
    state.floats.length = 0;
    state.over = false;
    state.win = false;
    state.shake = 0;
    state.flash = 0;
  }

  function addFloat(x, y, text, color) {
    if (state.floats.length > 12) state.floats.shift();
    state.floats.push({ x, y, text, color, t: 0, life: 1.2 });
  }

  function spawnOrder() {
    if (state.orders.length >= 3) return;
    const dish = DISHES[Math.floor(random() * DISHES.length)];
    const patience = patienceFor(state.level);
    state.orders.push({
      id: state.orderId, dish, patience, maxPatience: patience, born: state.elapsed,
    });
    state.orderId += 1;
  }

  function serveOrder(index) {
    const order = state.orders[index];
    if (!order || !state.serving || state.serving.id !== order.dish.id) return 0;
    const patienceBonus = Math.round(50 * (order.patience / order.maxPatience));
    const earned = Math.round((order.dish.price + patienceBonus) * (1 + 0.1 * state.combo));
    state.score += earned;
    state.combo += 1;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.served += 1;
    state.serving = null;
    state.orders.splice(index, 1);
    state.flash = 0.35;
    addFloat(1050, 420, `+${earned}`, '#f2c94c');
    return earned;
  }

  /** Start cooking the completed plate, once the stove and the serving counter are free. */
  function maybeCook() {
    if (state.plate.length !== 3 || state.cooking || state.serving) return 0;
    const dish = dishFor(state.plate);
    if (dish) {
      state.cooking = { dish, t: 0, total: COOK_SECONDS };
      state.plate.length = 0;
      return 0;
    }
    state.plate.length = 0;
    state.combo = 0;
    state.shake = 0.3;
    addFloat(780, 440, 'Resep salah!', '#e5534b');
    return EVENT_WRONG;
  }
  function step(dt, action, harmless) {
    let events = 0;
    if (state.over) return events;
    state.elapsed += dt;
    if (!harmless) state.timeLeft = Math.max(0, state.timeLeft - dt);
    state.level = Math.min(LEVEL.max, 1 + Math.floor(state.elapsed / LEVEL.seconds));
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);
    if (state.flash > 0) state.flash = Math.max(0, state.flash - dt);
    for (let i = state.floats.length - 1; i >= 0; i -= 1) {
      const f = state.floats[i];
      f.t += dt;
      if (f.t >= f.life) state.floats.splice(i, 1);
    }

    // New orders arrive on a timer.
    state.orderTimer -= dt;
    if (state.orderTimer <= 0) {
      spawnOrder();
      state.orderTimer += spawnInterval(state.level);
    }

    // Patience runs out: the customer walks away.
    for (let i = state.orders.length - 1; i >= 0; i -= 1) {
      const order = state.orders[i];
      order.patience -= dt;
      if (order.patience <= 0) {
        state.orders.splice(i, 1);
        state.missed += 1;
        state.combo = 0;
        events |= EVENT_MISS;
        addFloat(640, 440, 'Pesanan hangus!', '#e5534b');
        if (!harmless) {
          state.lives -= 1;
          state.shake = 0.4;
          if (state.lives === 0) {
            state.over = true;
            state.win = false;
            events |= EVENT_OVER;
            return events;
          }
        }
      }
    }

    // The stove finishes a dish: it waits on the serving counter.
    if (state.cooking) {
      state.cooking.t += dt;
      if (state.cooking.t >= state.cooking.total) {
        state.serving = { id: state.cooking.dish.id, dish: state.cooking.dish, t: 0 };
        state.cooking = null;
        events |= EVENT_COOK;
        addFloat(1090, 470, 'Siap diantar!', '#7bc47f');
      }
    }

    // A dish nobody ordered does not block the kitchen forever: after a while
    // on the counter it is thrown away and the stove is free again.
    if (state.serving) {
      state.serving.t += dt;
      if (state.serving.t > 12) {
        state.serving = null;
        addFloat(1090, 470, 'Hidangan dibuang', '#e5534b');
      }
    }

    // The shift ends when the clock runs out.
    if (!harmless && state.timeLeft <= 0) {
      state.over = true;
      state.win = state.lives > 0;
      events |= EVENT_OVER;
      return events;
    }

    if (harmless) return events;
    if (!action) return events | maybeCook();

    if (action.kind === 'ingredient') {
      const ing = INGREDIENTS[action.index];
      if (!ing || state.plate.length >= 3 || state.cooking) return events | maybeCook();
      state.plate.push(ing.id);
    } else if (action.kind === 'serve') {
      const earned = serveOrder(action.order);
      if (earned > 0) events |= EVENT_SERVE;
      else if (state.serving) {
        state.combo = 0;
        events |= EVENT_WRONG;
        addFloat(1050, 420, 'Bukan pesanan ini!', '#e5534b');
      }
    } else if (action.kind === 'serveAuto') {
      if (!state.serving) return events | maybeCook();
      let best = -1;
      for (let i = 0; i < state.orders.length; i += 1) {
        if (state.orders[i].dish.id === state.serving.id) { best = i; break; }
      }
      if (best >= 0) {
        if (serveOrder(best) > 0) events |= EVENT_SERVE;
      } else {
        state.combo = 0;
        events |= EVENT_WRONG;
        addFloat(1050, 420, 'Belum ada yang pesan ini!', '#e5534b');
      }
    } else if (action.kind === 'clear') {
      state.plate.length = 0;
    } else if (action.kind === 'discard') {
      if (state.serving) {
        state.serving = null;
        addFloat(1090, 470, 'Dibuang', '#e5534b');
      }
    }
    return events | maybeCook();
  }

  reset();
  return { state, reset, step };
}

// Re-exported so other modules can ask for the field size without importing config.
export { FIELD };
