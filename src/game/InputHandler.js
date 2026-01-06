import { CONTROLS } from '../config.js';

export class InputHandler {
  constructor() {
    // Current key states
    this.keys = {};

    // Keys pressed this frame (for one-shot actions)
    this.justPressed = {};

    // Set up event listeners
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    // Prevent default for game keys
    window.addEventListener('keydown', (e) => {
      if (this.isGameKey(e.code)) {
        e.preventDefault();
      }
    });
  }

  isGameKey(code) {
    for (const action in CONTROLS) {
      if (CONTROLS[action].includes(code)) {
        return true;
      }
    }
    return false;
  }

  onKeyDown(event) {
    const code = event.code;

    // Mark as just pressed if not already down
    if (!this.keys[code]) {
      this.justPressed[code] = true;
    }

    this.keys[code] = true;
  }

  onKeyUp(event) {
    this.keys[event.code] = false;
  }

  // Check if action is currently pressed (held down)
  isPressed(action) {
    const codes = CONTROLS[action];
    if (!codes) return false;
    return codes.some(code => this.keys[code]);
  }

  // Check if action was just pressed this frame
  wasJustPressed(action) {
    const codes = CONTROLS[action];
    if (!codes) return false;
    return codes.some(code => this.justPressed[code]);
  }

  // Clear just pressed states (call at end of frame)
  update() {
    this.justPressed = {};
  }

  // Get raw key state
  isKeyDown(code) {
    return !!this.keys[code];
  }

  // Get raw just pressed state
  wasKeyJustPressed(code) {
    return !!this.justPressed[code];
  }

  // Dispose listeners
  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
