// The screenshot scenes behind ?shot=start|play|serve|end. Each one plays the
// real rules forward from a fresh world for a fixed number of steps, steered by
// a simple autopilot (build the oldest order's dish, serve it when it is ready),
// so the frame is what a short game really looks like and the same seed always
// gives the same frame.
import { STEP } from './config.js';
import { EVENT_OVER } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 90;
const SERVE_LIMIT_SECONDS = 120;
const END_LIMIT_SECONDS = 600;
const SAMPLE = 1 / 30;
/** Seconds the autopilot waits between two ingredient picks: slow enough that the play scene often catches a dish mid-assembly. */
const PICK_GAP = 0.8;

/** The autopilot: one action at a time, paced so the plate is often half full. */
function createAutopilot() {
  let lastPick = -10;
  return function autopilot(state) {
    if (state.serving) {
      for (let i = 0; i < state.orders.length; i += 1) {
        if (state.orders[i].dish.id === state.serving.id) return { kind: 'serve', order: i };
      }
      return null;
    }
    if (state.cooking) return null;
    if (state.orders.length === 0) return null;
    const dish = state.orders[0].dish;
    if (state.elapsed - lastPick < PICK_GAP) return null;
    for (const need of dish.needs) {
      if (!state.plate.includes(need)) {
        lastPick = state.elapsed;
        return { kind: 'ingredient', index: ['nasi', 'mie', 'ayam', 'telur', 'sayur', 'sambal'].indexOf(need) };
      }
    }
    return null;
  };
}

/**
 * Set `world` to the named scene (start, play, serve or end; any other name is
 * start) and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  const pilot = createAutopilot();
  world.reset();
  if (name !== 'play' && name !== 'serve' && name !== 'end') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) world.step(STEP, null, true);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'serve') {
    // Wait until a dish is ready on the counter after at least one serve,
    // so the shot shows a real score and a plate ready to serve.
    for (let index = 0; index < SERVE_LIMIT_SECONDS / STEP; index += 1) {
      world.step(STEP, pilot(world.state), false);
      if (world.state.serving && world.state.score > 0) break;
    }
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'end') {
    // An idle player: no orders are ever served, so hearts run out and the
    // shift ends the way a real abandoned game ends.
    for (let index = 0; index < END_LIMIT_SECONDS / STEP; index += 1) {
      if (world.step(STEP, null, false) & EVENT_OVER) break;
    }
    const over = world.state.over;
    return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
  }
  // Play until the scene is busy: a score on the board, an order waiting and
  // a dish mid-assembly on the plate (or the cap, whatever comes first).
  for (let index = 0; index < PLAY_SECONDS / STEP; index += 1) {
    if (world.step(STEP, pilot(world.state), false) & EVENT_OVER) break;
    const s = world.state;
    if (s.score > 0 && s.plate.length >= 1 && s.orders.length >= 1) break;
  }
  const over = world.state.over;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
}
