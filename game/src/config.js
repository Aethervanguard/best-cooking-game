// Dapur Kilat — all tuning, recipes and colours in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display rate. */
export const STEP = 1 / 60;

/** One shift lasts this long; when the timer hits zero the shift is complete. */
export const SHIFT_SECONDS = 150;

export const LIVES = 3;

/** How long a customer waits, in seconds; shorter as the level rises. */
export const PATIENCE = { base: 26, perLevel: -2, min: 16 };

/** Seconds between new orders arriving; shorter as the level rises. */
export const SPAWN = { base: 6, perLevel: -0.5, min: 3.5 };

/** Seconds a dish spends on the stove once its recipe is complete. */
export const COOK_SECONDS = 2.5;

/** Seconds of play per level, and the last level: pace stops growing there. */
export const LEVEL = { seconds: 30, max: 5 };

/** The six ingredient bins on the counter, in key order. */
export const INGREDIENTS = [
  { id: 'nasi', name: 'Nasi', key: '1', color: '#f5efdd', dark: '#8a7f5c' },
  { id: 'mie', name: 'Mie', key: '2', color: '#f2c94c', dark: '#9a7d1e' },
  { id: 'ayam', name: 'Ayam', key: '3', color: '#e8a06a', dark: '#96522a' },
  { id: 'telur', name: 'Telur', key: '4', color: '#fff8e7', dark: '#b09a5e' },
  { id: 'sayur', name: 'Sayur', key: '5', color: '#7bc47f', dark: '#3e7d44' },
  { id: 'sambal', name: 'Sambal', key: '6', color: '#e5534b', dark: '#8f231d' },
];

/** The four dishes on the menu: each needs exactly three ingredients. */
export const DISHES = [
  { id: 'nasi-goreng', name: 'Nasi Goreng', needs: ['nasi', 'telur', 'sambal'], price: 100, color: '#e8a33d' },
  { id: 'mie-ayam', name: 'Mie Ayam', needs: ['mie', 'ayam', 'sayur'], price: 120, color: '#f2c94c' },
  { id: 'nasi-geprek', name: 'Ayam Geprek', needs: ['nasi', 'ayam', 'sambal'], price: 130, color: '#e5534b' },
  { id: 'mie-telur', name: 'Mie Telur', needs: ['mie', 'telur', 'sayur'], price: 110, color: '#f2a65a' },
];

export const PALETTE = {
  backdrop: '#241a12',
  wall: '#f3e3c2',
  wallTrim: '#d9b380',
  floor: '#8a5a33',
  floorDark: '#744a29',
  board: '#3a2c1e',
  boardFrame: '#6b4a26',
  ticket: '#fff8e7',
  ticketEdge: '#e0cfa8',
  counter: '#a9713f',
  counterTop: '#c98d54',
  stove: '#3c3f46',
  stoveTop: '#22242a',
  plate: '#fdfdf8',
  plateEdge: '#cfc9b8',
  text: '#2b2118',
  textLight: '#fff8e7',
  muted: '#8b93a3',
  gold: '#f2c94c',
  red: '#e5534b',
  green: '#7bc47f',
  panel: '#2b2118',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'dapur-kilat.best';
