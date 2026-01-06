import { CAMERA } from '../config.js';

// Cursor/Sights system - authentic 8-bit behavior
// When cursor reaches edge, system pans (user blocked during pan)
export class Cursor {
  constructor(screenWidth, screenHeight) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    // Cursor position (normalized 0-1, within safe bounds)
    this.x = 0.5;
    this.y = 0.5;

    // Boundary margins (cursor can't go beyond these)
    this.marginX = 0.08;  // 8% margin on each side
    this.marginY = 0.10;  // 10% margin top/bottom

    // Cursor movement speed
    this.moveSpeed = 0.35;

    // Is cursor/sights visible?
    this.visible = false;

    // PANNING STATE
    this.isPanning = false;
    this.panDirection = null;  // 'left', 'right', 'up', 'down'
    this.panProgress = 0;
    this.panDuration = 0.6;  // seconds per pan step

    // Pan amounts (one discrete step)
    // 21 pans for 360° = ~17.14° per pan = ~0.3 radians
    this.panStepYaw = (Math.PI * 2) / 21;
    this.panStepPitch = (Math.PI * 2) / 28;  // Smaller vertical steps

    // Flash state for visual feedback during panning
    this.flashTimer = 0;
    this.flashVisible = true;
    this.flashRate = 0.1;  // seconds per flash toggle

    // Accumulated pan output (for camera)
    this.outputYaw = 0;
    this.outputPitch = 0;
  }

  // Toggle sights visibility
  toggle() {
    this.visible = !this.visible;
    if (this.visible) {
      // Reset to center when turning on
      this.x = 0.5;
      this.y = 0.5;
      this.isPanning = false;
      this.panDirection = null;
    }
  }

  // Get min/max bounds for cursor
  getMinX() { return this.marginX; }
  getMaxX() { return 1 - this.marginX; }
  getMinY() { return this.marginY; }
  getMaxY() { return 1 - this.marginY; }

  // Update cursor - returns pan amounts for camera
  update(deltaTime, inputLeft, inputRight, inputUp, inputDown) {
    this.outputYaw = 0;
    this.outputPitch = 0;

    if (!this.visible) {
      this.isPanning = false;
      return { panYaw: 0, panPitch: 0, isBlocked: false };
    }

    // If currently panning, process the pan (user blocked)
    if (this.isPanning) {
      return this.processPanning(deltaTime);
    }

    // Not panning - allow cursor movement
    const minX = this.getMinX();
    const maxX = this.getMaxX();
    const minY = this.getMinY();
    const maxY = this.getMaxY();

    // Move cursor based on input
    if (inputLeft) {
      this.x -= this.moveSpeed * deltaTime;
    }
    if (inputRight) {
      this.x += this.moveSpeed * deltaTime;
    }
    if (inputUp) {
      this.y -= this.moveSpeed * deltaTime;
    }
    if (inputDown) {
      this.y += this.moveSpeed * deltaTime;
    }

    // Clamp to bounds
    this.x = Math.max(minX, Math.min(maxX, this.x));
    this.y = Math.max(minY, Math.min(maxY, this.y));

    // Check if cursor hit an edge AND user still pressing - trigger panning
    // Prioritize horizontal over vertical (like original)
    if (this.x <= minX && inputLeft) {
      this.startPanning('left');
    } else if (this.x >= maxX && inputRight) {
      this.startPanning('right');
    } else if (this.y <= minY && inputUp) {
      this.startPanning('up');
    } else if (this.y >= maxY && inputDown) {
      this.startPanning('down');
    }

    return { panYaw: 0, panPitch: 0, isBlocked: false };
  }

  startPanning(direction) {
    this.isPanning = true;
    this.panDirection = direction;
    this.panProgress = 0;
    this.flashTimer = 0;
    this.flashVisible = true;
  }

  processPanning(deltaTime) {
    // Update flash
    this.flashTimer += deltaTime;
    if (this.flashTimer >= this.flashRate) {
      this.flashTimer = 0;
      this.flashVisible = !this.flashVisible;
    }

    // Progress the pan
    this.panProgress += deltaTime;
    const t = Math.min(this.panProgress / this.panDuration, 1);

    // Calculate how much to pan this frame
    // Use eased progress for smoother feel
    const easedT = t * t * (3 - 2 * t);  // Smoothstep
    const prevEasedT = Math.max(0, (this.panProgress - deltaTime) / this.panDuration);
    const prevEased = prevEasedT * prevEasedT * (3 - 2 * prevEasedT);
    const deltaPan = easedT - prevEased;

    // Apply pan based on direction
    switch (this.panDirection) {
      case 'left':
        this.outputYaw = this.panStepYaw * deltaPan;
        break;
      case 'right':
        this.outputYaw = -this.panStepYaw * deltaPan;
        break;
      case 'up':
        this.outputPitch = this.panStepPitch * deltaPan;
        break;
      case 'down':
        this.outputPitch = -this.panStepPitch * deltaPan;
        break;
    }

    // Check if pan is complete
    if (this.panProgress >= this.panDuration) {
      this.isPanning = false;
      this.panDirection = null;
      this.flashVisible = true;

      // Reset cursor to center after pan (authentic behavior)
      this.x = 0.5;
      this.y = 0.5;
    }

    return {
      panYaw: this.outputYaw,
      panPitch: this.outputPitch,
      isBlocked: true  // User cannot interact during pan
    };
  }

  // Check if user input should be blocked
  isBlocked() {
    return this.isPanning;
  }

  // Get normalized position (0-1)
  getNormalizedPosition() {
    return { x: this.x, y: this.y };
  }

  // Check if cursor should be displayed (handles flashing)
  shouldDisplay() {
    return this.visible && this.flashVisible;
  }

  // Set screen dimensions (for resize)
  setScreenSize(width, height) {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  // Get cursor position in NDC (-1 to 1) for raycasting
  getNDC() {
    return {
      x: (this.x - 0.5) * 2,
      y: -(this.y - 0.5) * 2  // Flip Y for Three.js
    };
  }
}
