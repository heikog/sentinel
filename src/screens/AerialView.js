// The Sentinel - Aerial Landscape View
// Shows overhead view of landscape before level starts

import { CPC_PALETTE, LANDSCAPE } from '../config.js';
import { soundSystem } from '../audio/SoundSystem.js';

export class AerialView {
  constructor(container, onContinue) {
    this.container = container;
    this.onContinue = onContinue;
    this.element = null;
    this.canvas = null;
    this.ctx = null;
    this.landscape = null;
    this.levelNumber = 0;
    this.levelCode = '';

    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'aerial-view';
    this.element.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #${CPC_PALETTE.BLACK.toString(16).padStart(6, '0')};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: monospace;
      z-index: 100;
    `;

    // Level info
    const levelInfo = document.createElement('div');
    levelInfo.style.cssText = `
      color: #${CPC_PALETTE.YELLOW.toString(16).padStart(6, '0')};
      font-size: 24px;
      margin-bottom: 20px;
    `;
    levelInfo.textContent = `LANDSCAPE ${this.levelNumber.toString().padStart(4, '0')}`;
    this.element.appendChild(levelInfo);

    // Canvas for aerial view
    this.canvas = document.createElement('canvas');
    this.canvas.width = 256;
    this.canvas.height = 256;
    this.canvas.style.cssText = `
      image-rendering: pixelated;
      width: 512px;
      height: 512px;
      border: 2px solid #${CPC_PALETTE.CYAN.toString(16).padStart(6, '0')};
    `;
    this.ctx = this.canvas.getContext('2d');
    this.element.appendChild(this.canvas);

    // Code display (if not level 0)
    if (this.levelNumber > 0) {
      const codeDisplay = document.createElement('div');
      codeDisplay.style.cssText = `
        color: #${CPC_PALETTE.GREEN.toString(16).padStart(6, '0')};
        font-size: 16px;
        margin-top: 15px;
      `;
      codeDisplay.textContent = `CODE: ${this.levelCode}`;
      this.element.appendChild(codeDisplay);
    }

    // Prompt
    const prompt = document.createElement('div');
    prompt.style.cssText = `
      color: #${CPC_PALETTE.GRAY.toString(16).padStart(6, '0')};
      font-size: 14px;
      margin-top: 20px;
    `;
    prompt.textContent = 'Press any key to begin';
    this.element.appendChild(prompt);

    // Legend
    const legend = document.createElement('div');
    legend.style.cssText = `
      display: flex;
      gap: 30px;
      margin-top: 15px;
      font-size: 12px;
    `;
    legend.innerHTML = `
      <span style="color: #${CPC_PALETTE.RED.toString(16).padStart(6, '0')};">&#9632; SENTINEL</span>
      <span style="color: #${CPC_PALETTE.DARK_RED.toString(16).padStart(6, '0')};">&#9632; SENTRY</span>
      <span style="color: #${CPC_PALETTE.GREEN.toString(16).padStart(6, '0')};">&#9632; TREE</span>
    `;
    this.element.appendChild(legend);

    document.addEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown(e) {
    if (!this.element || !this.element.parentNode) return;

    soundSystem.init();
    soundSystem.resume();
    soundSystem.playMenuSelect();

    if (this.onContinue) {
      this.onContinue();
    }
  }

  drawLandscape() {
    if (!this.landscape || !this.ctx) return;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const gridSize = this.landscape.gridSize;
    const cellW = w / gridSize;
    const cellH = h / gridSize;

    // Clear
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    // Draw terrain
    for (let z = 0; z < gridSize; z++) {
      for (let x = 0; x < gridSize; x++) {
        const square = this.landscape.getSquare(x, z);
        if (!square) continue;

        // Height-based color (darker = lower, brighter = higher)
        const heightRatio = square.height / LANDSCAPE.MAX_HEIGHT;
        const baseColor = (x + z) % 2 === 0 ? CPC_PALETTE.DARK_CYAN : CPC_PALETTE.DARK_GREEN;

        // Brighten based on height
        const r = ((baseColor >> 16) & 0xFF);
        const g = ((baseColor >> 8) & 0xFF);
        const b = (baseColor & 0xFF);

        const brighten = 0.3 + heightRatio * 0.7;
        const nr = Math.min(255, Math.floor(r * brighten));
        const ng = Math.min(255, Math.floor(g * brighten));
        const nb = Math.min(255, Math.floor(b * brighten));

        ctx.fillStyle = `rgb(${nr}, ${ng}, ${nb})`;
        ctx.fillRect(x * cellW, z * cellH, cellW + 1, cellH + 1);
      }
    }

    // Draw entities (but NOT player start position - authentic behavior)
    const entities = this.landscape.getAllEntities ? this.landscape.getAllEntities() : [];

    // If landscape doesn't have getAllEntities, scan squares
    for (let z = 0; z < gridSize; z++) {
      for (let x = 0; x < gridSize; x++) {
        const square = this.landscape.getSquare(x, z);
        if (!square || !square.entities) continue;

        for (const entity of square.entities) {
          const cx = x * cellW + cellW / 2;
          const cy = z * cellH + cellH / 2;

          switch (entity.type) {
            case 'sentinel':
              ctx.fillStyle = `#${CPC_PALETTE.RED.toString(16).padStart(6, '0')}`;
              ctx.fillRect(cx - 3, cy - 3, 6, 6);
              // Draw pedestal indicator
              ctx.strokeStyle = `#${CPC_PALETTE.YELLOW.toString(16).padStart(6, '0')}`;
              ctx.strokeRect(cx - 4, cy - 4, 8, 8);
              break;

            case 'sentry':
              ctx.fillStyle = `#${CPC_PALETTE.DARK_RED.toString(16).padStart(6, '0')}`;
              ctx.fillRect(cx - 2, cy - 2, 4, 4);
              break;

            case 'tree':
              ctx.fillStyle = `#${CPC_PALETTE.GREEN.toString(16).padStart(6, '0')}`;
              ctx.beginPath();
              ctx.arc(cx, cy, 2, 0, Math.PI * 2);
              ctx.fill();
              break;

            case 'boulder':
              ctx.fillStyle = `#${CPC_PALETTE.GRAY.toString(16).padStart(6, '0')}`;
              ctx.fillRect(cx - 1, cy - 1, 3, 3);
              break;
          }
        }
      }
    }

    // Draw sentinel position from landscape data
    const sentinelPos = this.landscape.getSentinelPosition();
    if (sentinelPos) {
      const cx = sentinelPos.x * cellW + cellW / 2;
      const cy = sentinelPos.z * cellH + cellH / 2;
      ctx.fillStyle = `#${CPC_PALETTE.RED.toString(16).padStart(6, '0')}`;
      ctx.fillRect(cx - 3, cy - 3, 6, 6);
      ctx.strokeStyle = `#${CPC_PALETTE.YELLOW.toString(16).padStart(6, '0')}`;
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 5, cy - 5, 10, 10);
    }

    // Note: Player start position intentionally NOT shown (authentic)
  }

  show(landscape, levelNumber, levelCode) {
    this.landscape = landscape;
    this.levelNumber = levelNumber;
    this.levelCode = levelCode;

    this.create();
    this.container.appendChild(this.element);
    this.drawLandscape();
  }

  hide() {
    document.removeEventListener('keydown', this.handleKeyDown);
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }
}
