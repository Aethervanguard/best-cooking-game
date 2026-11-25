// Keyboard and pointer input. Number keys drop an ingredient on the plate, Space
// serves the finished dish, P pauses. One-shot presses are queued as bit flags
// and taken once by the loop, so a press between two frames is never lost and
// never counted twice. Pointer clicks are queued with their client coordinates;
// the loop turns them into field coordinates and hit-tests them.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;

const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const INGREDIENT_KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'];

export function createInput(target) {
  let actions = 0;
  let ingredients = [];
  let clicks = [];

  window.addEventListener('keydown', (event) => {
    const ing = INGREDIENT_KEYS.indexOf(event.code);
    if (ing >= 0) {
      if (!event.repeat) ingredients.push(ing);
    } else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else return;
    event.preventDefault();
  });
  target.addEventListener('pointerdown', (event) => {
    clicks.push({ x: event.clientX, y: event.clientY });
  });

  return {
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** Ingredient-bin numbers pressed since the last call, in order. */
    takeIngredients() {
      const taken = ingredients;
      ingredients = [];
      return taken;
    },
    /** Pointer clicks since the last call, in client coordinates. */
    takeClicks() {
      const taken = clicks;
      clicks = [];
      return taken;
    },
  };
}
