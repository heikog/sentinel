// The Sentinel - Configuration
// Amstrad CPC 464 Style

// CPC 27-color palette (RGB hex values)
export const CPC_PALETTE = {
  BLACK: 0x040404,
  GRAY: 0x808080,
  WHITE: 0xffffff,
  DARK_RED: 0x800000,
  RED: 0xff0000,
  LIGHT_RED: 0xff8080,
  ORANGE: 0xff7f00,
  LIGHT_YELLOW: 0xffff80,
  YELLOW: 0xffff00,
  DARK_YELLOW: 0x808000,
  DARK_GREEN: 0x008000,
  GREEN: 0x01ff00,
  LIME: 0x80ff00,
  LIGHT_GREEN: 0x80ff80,
  SEA_GREEN: 0x01ff80,
  DARK_CYAN: 0x008080,
  CYAN: 0x01ffff,
  LIGHT_CYAN: 0x80ffff,
  SKY_BLUE: 0x0080ff,
  BLUE: 0x0000ff,
  DARK_BLUE: 0x00007f,
  PURPLE: 0x7f00ff,
  LIGHT_BLUE: 0x8080ff,
  PINK: 0xff80ff,
  MAGENTA: 0xff00ff,
  ROSE: 0xff0080,
  DARK_MAGENTA: 0x800080
};

// Palette as array for indexed access
export const CPC_PALETTE_ARRAY = [
  0x040404, 0x808080, 0xffffff, 0x800000, 0xff0000, 0xff8080,
  0xff7f00, 0xffff80, 0xffff00, 0x808000, 0x008000, 0x01ff00,
  0x80ff00, 0x80ff80, 0x01ff80, 0x008080, 0x01ffff, 0x80ffff,
  0x0080ff, 0x0000ff, 0x00007f, 0x7f00ff, 0x8080ff, 0xff80ff,
  0xff00ff, 0xff0080, 0x800080
];

// Game colors (CPC style assignments)
export const COLORS = {
  SKY: CPC_PALETTE.DARK_BLUE,
  GROUND_LIGHT: CPC_PALETTE.DARK_CYAN,
  GROUND_DARK: CPC_PALETTE.DARK_GREEN,
  TREE: CPC_PALETTE.GREEN,
  BOULDER: CPC_PALETTE.GRAY,
  ROBOT: CPC_PALETTE.CYAN,
  ROBOT_PLAYER: CPC_PALETTE.LIGHT_CYAN,
  SENTINEL: CPC_PALETTE.RED,
  SENTRY: CPC_PALETTE.DARK_RED,
  MEANIE: CPC_PALETTE.MAGENTA,
  PEDESTAL: CPC_PALETTE.DARK_YELLOW,
  UI_TEXT: CPC_PALETTE.GREEN,
  UI_ENERGY: CPC_PALETTE.YELLOW,
  UI_WARNING: CPC_PALETTE.RED
};

// Energy values
export const ENERGY = {
  TREE: 1,
  BOULDER: 2,
  ROBOT: 3,
  SENTINEL: 4,
  SENTRY: 3,
  HYPERSPACE_COST: 3,
  STARTING_ENERGY: 10
};

// Landscape settings
export const LANDSCAPE = {
  GRID_SIZE: 32,          // 32x32 grid
  MAX_HEIGHT: 15,         // Maximum height level
  SQUARE_SIZE: 1.0,       // World units per square
  HEIGHT_UNIT: 0.5        // World units per height level
};

// Rendering settings
export const RENDER = {
  FOV: 60,
  NEAR: 0.1,
  FAR: 100,
  ASPECT_RATIO: 4 / 3,    // CPC aspect ratio
  TARGET_WIDTH: 320,      // CPC Mode 0 effective resolution
  TARGET_HEIGHT: 200
};

// Game timing
export const TIMING = {
  SENTINEL_ROTATION_SPEED: 0.025,  // Radians per second (very slow scan)
  SENTRY_ROTATION_SPEED: 0.04,
  MEANIE_ROTATION_SPEED: 2.0,     // Fast spin
  ABSORPTION_RATE: 1.0,           // Energy per second when detected
  DETECTION_GRACE_PERIOD: 5.0     // Seconds before drain starts
};

// Controls mapping
export const CONTROLS = {
  PAN_LEFT: ['KeyS', 'ArrowLeft'],
  PAN_RIGHT: ['KeyD', 'ArrowRight'],
  PAN_UP: ['KeyK', 'ArrowUp'],
  PAN_DOWN: ['KeyM', 'ArrowDown'],
  SIGHTS: ['Space'],
  CREATE_TREE: ['KeyT'],
  CREATE_BOULDER: ['KeyB'],
  CREATE_ROBOT: ['KeyR'],
  ABSORB: ['KeyA'],
  TRANSFER: ['KeyQ'],
  HYPERSPACE: ['KeyH'],
  U_TURN: ['KeyU'],
  PAUSE: ['KeyP'],
  SOUND_TOGGLE: ['KeyZ']
};

// Camera settings
export const CAMERA = {
  PAN_SPEED: 1.5,           // Radians per second
  MIN_PITCH: -Math.PI / 3,  // Look down limit
  MAX_PITCH: Math.PI / 4,   // Look up limit
  EYE_HEIGHT: 0.8           // Height above standing surface
};

// Level generation
export const LEVELS = {
  TOTAL_LEVELS: 10000,
  TREES_MIN: 20,
  TREES_MAX: 50,
  SENTRIES_BASE: 0,
  SENTRIES_PER_1000_LEVELS: 1  // Add a sentry every 1000 levels
};
