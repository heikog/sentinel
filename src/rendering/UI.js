import { COLORS, CPC_PALETTE } from '../config.js';

export class UI {
  constructor(container) {
    this.container = container;
    this.overlay = document.getElementById('ui-overlay') || this.createOverlay();

    // Canvas bounds (for positioning crosshair correctly)
    this.canvasBounds = { x: 0, y: 0, width: 640, height: 480 };

    // Create UI elements
    this.createElements();

    // State
    this.sightsVisible = false;
  }

  // Set canvas bounds for proper crosshair alignment
  setCanvasBounds(x, y, width, height) {
    this.canvasBounds = { x, y, width, height };
  }

  createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'ui-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      font-family: monospace;
    `;
    this.container.appendChild(overlay);
    return overlay;
  }

  createElements() {
    // Energy display (top left)
    this.energyDisplay = document.createElement('div');
    this.energyDisplay.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      color: #${CPC_PALETTE.YELLOW.toString(16).padStart(6, '0')};
      font-size: 16px;
      display: flex;
      gap: 8px;
      align-items: center;
    `;
    this.overlay.appendChild(this.energyDisplay);

    // Level display (top right)
    this.levelDisplay = document.createElement('div');
    this.levelDisplay.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      color: #${CPC_PALETTE.GREEN.toString(16).padStart(6, '0')};
      font-size: 14px;
      text-align: right;
    `;
    this.overlay.appendChild(this.levelDisplay);

    // Scanner box (top right corner) - authentic detection indicator
    this.scannerBox = document.createElement('div');
    this.scannerBox.style.cssText = `
      position: absolute;
      top: 60px;
      right: 20px;
      width: 50px;
      height: 50px;
      background: #000;
      border: 2px solid #${CPC_PALETTE.CYAN.toString(16).padStart(6, '0')};
      overflow: hidden;
    `;
    this.overlay.appendChild(this.scannerBox);

    // Scanner static canvas
    this.scannerCanvas = document.createElement('canvas');
    this.scannerCanvas.width = 50;
    this.scannerCanvas.height = 50;
    this.scannerCanvas.style.cssText = `width: 100%; height: 100%;`;
    this.scannerBox.appendChild(this.scannerCanvas);
    this.scannerCtx = this.scannerCanvas.getContext('2d');

    // Scanner label
    this.scannerLabel = document.createElement('div');
    this.scannerLabel.style.cssText = `
      position: absolute;
      top: 115px;
      right: 20px;
      width: 50px;
      text-align: center;
      color: #${CPC_PALETTE.GRAY.toString(16).padStart(6, '0')};
      font-size: 8px;
    `;
    this.scannerLabel.textContent = 'SCANNER';
    this.overlay.appendChild(this.scannerLabel);

    // Warning indicator (right side) - drain progress
    this.warningIndicator = document.createElement('div');
    this.warningIndicator.style.cssText = `
      position: absolute;
      top: 50%;
      right: 20px;
      transform: translateY(-50%);
      width: 20px;
      height: 100px;
      background: transparent;
      border: 2px solid #${CPC_PALETTE.RED.toString(16).padStart(6, '0')};
      display: none;
    `;
    this.overlay.appendChild(this.warningIndicator);

    this.warningFill = document.createElement('div');
    this.warningFill.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 0%;
      background: #${CPC_PALETTE.RED.toString(16).padStart(6, '0')};
    `;
    this.warningIndicator.appendChild(this.warningFill);

    // Pause overlay
    this.pauseOverlay = document.createElement('div');
    this.pauseOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: none;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      color: #${CPC_PALETTE.YELLOW.toString(16).padStart(6, '0')};
      font-size: 32px;
    `;
    this.pauseOverlay.innerHTML = `
      <div>PAUSED</div>
      <div style="font-size: 14px; margin-top: 20px; color: #${CPC_PALETTE.GRAY.toString(16).padStart(6, '0')};">
        Press P to continue
      </div>
    `;
    this.overlay.appendChild(this.pauseOverlay);

    // Crosshair/Sights (movable - positioned via updateCursorPosition)
    this.crosshair = document.createElement('div');
    this.crosshair.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 30px;
      height: 30px;
      display: none;
      transition: none;
    `;
    this.crosshair.innerHTML = `
      <svg width="30" height="30" viewBox="0 0 30 30">
        <line x1="0" y1="15" x2="12" y2="15" stroke="#${CPC_PALETTE.GREEN.toString(16).padStart(6, '0')}" stroke-width="2"/>
        <line x1="18" y1="15" x2="30" y2="15" stroke="#${CPC_PALETTE.GREEN.toString(16).padStart(6, '0')}" stroke-width="2"/>
        <line x1="15" y1="0" x2="15" y2="12" stroke="#${CPC_PALETTE.GREEN.toString(16).padStart(6, '0')}" stroke-width="2"/>
        <line x1="15" y1="18" x2="15" y2="30" stroke="#${CPC_PALETTE.GREEN.toString(16).padStart(6, '0')}" stroke-width="2"/>
      </svg>
    `;
    this.overlay.appendChild(this.crosshair);

    // Target info (follows crosshair)
    this.targetInfo = document.createElement('div');
    this.targetInfo.style.cssText = `
      position: absolute;
      top: calc(50% + 30px);
      left: 50%;
      transform: translateX(-50%);
      color: #${CPC_PALETTE.GREEN.toString(16).padStart(6, '0')};
      font-size: 12px;
      text-align: center;
      display: none;
    `;
    this.overlay.appendChild(this.targetInfo);

    // Message display (bottom center)
    this.messageDisplay = document.createElement('div');
    this.messageDisplay.style.cssText = `
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      color: #${CPC_PALETTE.CYAN.toString(16).padStart(6, '0')};
      font-size: 16px;
      text-align: center;
      opacity: 0;
      transition: opacity 0.3s;
    `;
    this.overlay.appendChild(this.messageDisplay);

    // Game over screen
    this.gameOverScreen = document.createElement('div');
    this.gameOverScreen.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: none;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      color: #${CPC_PALETTE.RED.toString(16).padStart(6, '0')};
      font-size: 32px;
    `;
    this.overlay.appendChild(this.gameOverScreen);
  }

  // Update energy display with authentic icons
  // Tree = 1, Boulder = 2, Robot = 3, Golden Robot = 15
  updateEnergy(energy) {
    let html = '';
    let remaining = energy;

    // Golden robots (15 energy each) - for high energy counts
    const goldenRobots = Math.floor(remaining / 15);
    remaining = remaining % 15;
    for (let i = 0; i < goldenRobots; i++) {
      html += `<span style="color: #${CPC_PALETTE.YELLOW.toString(16).padStart(6, '0')}; font-size: 18px;">&#9635;</span>`;  // Golden robot
    }

    // Regular robots (3 energy each)
    const robots = Math.floor(remaining / 3);
    remaining = remaining % 3;
    for (let i = 0; i < robots; i++) {
      html += `<span style="color: #${CPC_PALETTE.CYAN.toString(16).padStart(6, '0')}; font-size: 16px;">&#9634;</span>`;  // Robot
    }

    // Boulders (2 energy each)
    const boulders = Math.floor(remaining / 2);
    remaining = remaining % 2;
    for (let i = 0; i < boulders; i++) {
      html += `<span style="color: #${CPC_PALETTE.GRAY.toString(16).padStart(6, '0')}; font-size: 14px;">&#9632;</span>`;  // Boulder
    }

    // Trees (1 energy each)
    for (let i = 0; i < remaining; i++) {
      html += `<span style="color: #${CPC_PALETTE.GREEN.toString(16).padStart(6, '0')}; font-size: 14px;">&#9650;</span>`;  // Tree
    }

    // Show numeric value
    html += `<span style="margin-left: 10px; color: #${CPC_PALETTE.YELLOW.toString(16).padStart(6, '0')};">${energy}</span>`;

    this.energyDisplay.innerHTML = html;
  }

  // Update level display
  updateLevel(levelNumber, levelCode) {
    this.levelDisplay.innerHTML = `
      LEVEL: ${levelNumber}<br>
      CODE: ${levelCode}
    `;
  }

  // Show/hide crosshair
  setSightsVisible(visible, shouldDisplay = true) {
    this.sightsVisible = visible;
    // Handle flashing during panning
    const show = visible && shouldDisplay;
    this.crosshair.style.display = show ? 'block' : 'none';
    this.targetInfo.style.display = visible ? 'block' : 'none';
  }

  // Update cursor position on screen (normalized 0-1 coordinates)
  updateCursorPosition(normalizedX, normalizedY) {
    // Convert normalized position to pixel position within canvas bounds
    const pixelX = this.canvasBounds.x + normalizedX * this.canvasBounds.width;
    const pixelY = this.canvasBounds.y + normalizedY * this.canvasBounds.height;

    this.crosshair.style.left = `${pixelX}px`;
    this.crosshair.style.top = `${pixelY}px`;

    // Target info follows cursor (below it)
    this.targetInfo.style.left = `${pixelX}px`;
    this.targetInfo.style.top = `${pixelY + 25}px`;
  }

  // Update target info
  updateTarget(target) {
    if (!this.sightsVisible || !target) {
      this.targetInfo.textContent = '';
      return;
    }

    if (target.entity) {
      const type = target.entity.type.toUpperCase();
      const energy = target.entity.energy;
      this.targetInfo.textContent = `${type} (${energy})`;
    } else {
      this.targetInfo.textContent = `[${target.gridX}, ${target.gridZ}]`;
    }
  }

  // Update scanner and warning indicator
  updateWarning(detectionLevel, drainProgress = 0) {
    // Update scanner box with static effect
    this.drawScanner(detectionLevel);

    if (detectionLevel === 0) {
      this.warningIndicator.style.display = 'none';
      this.scannerBox.style.borderColor = `#${CPC_PALETTE.CYAN.toString(16).padStart(6, '0')}`;
      return;
    }

    this.warningIndicator.style.display = 'block';

    if (detectionLevel === 1) {
      // Partial detection (head seen) - half static, yellow border
      this.scannerBox.style.borderColor = `#${CPC_PALETTE.YELLOW.toString(16).padStart(6, '0')}`;
      this.warningIndicator.style.borderColor = `#${CPC_PALETTE.YELLOW.toString(16).padStart(6, '0')}`;
      this.warningFill.style.background = `#${CPC_PALETTE.YELLOW.toString(16).padStart(6, '0')}`;
      this.warningFill.style.height = '50%';
    } else {
      // Full detection - full static, red border, drain progress
      this.scannerBox.style.borderColor = `#${CPC_PALETTE.RED.toString(16).padStart(6, '0')}`;
      this.warningIndicator.style.borderColor = `#${CPC_PALETTE.RED.toString(16).padStart(6, '0')}`;
      this.warningFill.style.background = `#${CPC_PALETTE.RED.toString(16).padStart(6, '0')}`;
      this.warningFill.style.height = `${Math.min(100, drainProgress * 100)}%`;
    }
  }

  // Draw scanner static effect
  drawScanner(detectionLevel) {
    const ctx = this.scannerCtx;
    const w = this.scannerCanvas.width;
    const h = this.scannerCanvas.height;

    // Clear to black
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    if (detectionLevel === 0) {
      // No detection - empty scanner
      return;
    }

    // Determine fill amount
    const fillHeight = detectionLevel === 1 ? h / 2 : h;

    // Draw static/interference pattern
    const color = detectionLevel === 1 ? CPC_PALETTE.YELLOW : CPC_PALETTE.RED;
    const r = (color >> 16) & 0xFF;
    const g = (color >> 8) & 0xFF;
    const b = color & 0xFF;

    const imageData = ctx.createImageData(w, fillHeight);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const y = Math.floor((i / 4) / w);
      const brightness = Math.random();

      if (brightness > 0.5) {
        data[i] = Math.floor(r * brightness);
        data[i + 1] = Math.floor(g * brightness);
        data[i + 2] = Math.floor(b * brightness);
        data[i + 3] = 255;
      } else {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 255;
      }
    }

    // Draw from bottom for partial, full for complete
    const yOffset = detectionLevel === 1 ? h / 2 : 0;
    ctx.putImageData(imageData, 0, yOffset);
  }

  // Show/hide pause overlay
  setPaused(paused) {
    this.pauseOverlay.style.display = paused ? 'flex' : 'none';
  }

  // Show temporary message
  showMessage(text, duration = 2000) {
    this.messageDisplay.textContent = text;
    this.messageDisplay.style.opacity = '1';

    setTimeout(() => {
      this.messageDisplay.style.opacity = '0';
    }, duration);
  }

  // Show game over screen
  showGameOver(reason) {
    this.gameOverScreen.style.display = 'flex';

    if (reason === 'absorbed') {
      this.gameOverScreen.innerHTML = `
        <div>ABSORBED</div>
        <div style="font-size: 16px; margin-top: 20px; color: #808080;">
          Press SPACE to restart
        </div>
      `;
    } else {
      this.gameOverScreen.innerHTML = `
        <div>GAME OVER</div>
        <div style="font-size: 16px; margin-top: 20px; color: #808080;">
          Press SPACE to restart
        </div>
      `;
    }
  }

  // Show level complete screen
  showLevelComplete(levelsSkipped, nextLevel = null, nextCode = null) {
    this.gameOverScreen.style.display = 'flex';
    this.gameOverScreen.style.color = `#${CPC_PALETTE.GREEN.toString(16).padStart(6, '0')}`;

    let html = `<div>LEVEL COMPLETE</div>`;

    if (levelsSkipped > 0) {
      html += `<div style="font-size: 16px; margin-top: 20px;">Levels skipped: ${levelsSkipped}</div>`;
    }

    if (nextLevel !== null && nextCode !== null) {
      html += `
        <div style="font-size: 18px; margin-top: 20px; color: #${CPC_PALETTE.YELLOW.toString(16).padStart(6, '0')};">
          NEXT LANDSCAPE: ${nextLevel.toString().padStart(4, '0')}
        </div>
        <div style="font-size: 24px; margin-top: 10px; color: #${CPC_PALETTE.CYAN.toString(16).padStart(6, '0')}; letter-spacing: 4px;">
          CODE: ${nextCode}
        </div>
      `;
    }

    html += `
      <div style="font-size: 14px; margin-top: 20px; color: #808080;">
        Press SPACE to continue
      </div>
    `;

    this.gameOverScreen.innerHTML = html;
  }

  // Hide overlay screens
  hideScreens() {
    this.gameOverScreen.style.display = 'none';
  }

  // Create scanline effect overlay
  createScanlines() {
    const scanlines = document.createElement('div');
    scanlines.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, 0.1) 2px,
        rgba(0, 0, 0, 0.1) 4px
      );
    `;
    this.overlay.appendChild(scanlines);
  }
}
