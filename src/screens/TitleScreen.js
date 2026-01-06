// The Sentinel - Title Screen
// Inspired by Bob Stevenson's M.C. Escher "Eye" loading screen

import { CPC_PALETTE } from '../config.js';
import { soundSystem } from '../audio/SoundSystem.js';

export class TitleScreen {
  constructor(container, onStartGame) {
    this.container = container;
    this.onStartGame = onStartGame;
    this.element = null;
    this.canvas = null;
    this.ctx = null;
    this.animationFrame = null;
    this.musicInterval = null;

    // Code entry state
    this.landscapeNumber = '';
    this.entryCode = '';
    this.inputMode = 'landscape';  // 'landscape' or 'code'
    this.errorMessage = '';

    // Animation
    this.eyePhase = 0;

    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'title-screen';
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

    // Eye canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = 200;
    this.canvas.height = 150;
    this.canvas.style.cssText = `
      image-rendering: pixelated;
      width: 400px;
      height: 300px;
      margin-bottom: 20px;
    `;
    this.ctx = this.canvas.getContext('2d');
    this.element.appendChild(this.canvas);

    // Title
    const title = document.createElement('div');
    title.style.cssText = `
      color: #${CPC_PALETTE.RED.toString(16).padStart(6, '0')};
      font-size: 48px;
      font-weight: bold;
      text-shadow: 4px 4px #${CPC_PALETTE.DARK_RED.toString(16).padStart(6, '0')};
      margin-bottom: 10px;
      letter-spacing: 8px;
    `;
    title.textContent = 'THE SENTINEL';
    this.element.appendChild(title);

    // Subtitle
    const subtitle = document.createElement('div');
    subtitle.style.cssText = `
      color: #${CPC_PALETTE.GRAY.toString(16).padStart(6, '0')};
      font-size: 14px;
      margin-bottom: 30px;
    `;
    subtitle.textContent = 'by Geoff Crammond';
    this.element.appendChild(subtitle);

    // Input container
    this.inputContainer = document.createElement('div');
    this.inputContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 15px;
    `;
    this.element.appendChild(this.inputContainer);

    this.createInputUI();

    // Instructions
    const instructions = document.createElement('div');
    instructions.style.cssText = `
      color: #${CPC_PALETTE.CYAN.toString(16).padStart(6, '0')};
      font-size: 12px;
      margin-top: 40px;
      text-align: center;
      line-height: 1.8;
    `;
    instructions.innerHTML = `
      CONTROLS<br>
      S/D or ARROWS: Pan view | SPACE: Sights<br>
      T: Tree | B: Boulder | R: Robot<br>
      A: Absorb | Q: Transfer | H: Hyperspace | U: U-turn<br>
      P: Pause | Z: Toggle sound
    `;
    this.element.appendChild(instructions);

    // Handle keyboard
    this.handleKeyDown = this.handleKeyDown.bind(this);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  createInputUI() {
    this.inputContainer.innerHTML = '';

    // Landscape number prompt
    const landscapeLabel = document.createElement('div');
    landscapeLabel.style.cssText = `
      color: #${CPC_PALETTE.YELLOW.toString(16).padStart(6, '0')};
      font-size: 16px;
    `;
    landscapeLabel.textContent = 'ENTER LANDSCAPE (0000-9999):';
    this.inputContainer.appendChild(landscapeLabel);

    // Landscape number display
    const landscapeDisplay = document.createElement('div');
    landscapeDisplay.style.cssText = `
      color: #${CPC_PALETTE.GREEN.toString(16).padStart(6, '0')};
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 8px;
      min-width: 150px;
      text-align: center;
      border-bottom: 3px solid #${CPC_PALETTE.GREEN.toString(16).padStart(6, '0')};
      padding: 5px 10px;
    `;
    landscapeDisplay.textContent = this.landscapeNumber.padEnd(4, '_');
    this.landscapeDisplay = landscapeDisplay;
    this.inputContainer.appendChild(landscapeDisplay);

    // Code entry (shown after landscape selected)
    if (this.inputMode === 'code') {
      const codeLabel = document.createElement('div');
      codeLabel.style.cssText = `
        color: #${CPC_PALETTE.YELLOW.toString(16).padStart(6, '0')};
        font-size: 16px;
        margin-top: 20px;
      `;
      codeLabel.textContent = 'ENTER SECRET CODE:';
      this.inputContainer.appendChild(codeLabel);

      const codeDisplay = document.createElement('div');
      codeDisplay.style.cssText = `
        color: #${CPC_PALETTE.CYAN.toString(16).padStart(6, '0')};
        font-size: 24px;
        font-weight: bold;
        letter-spacing: 6px;
        border-bottom: 3px solid #${CPC_PALETTE.CYAN.toString(16).padStart(6, '0')};
        padding: 5px 10px;
      `;
      codeDisplay.textContent = this.entryCode.padEnd(8, '_');
      this.codeDisplay = codeDisplay;
      this.inputContainer.appendChild(codeDisplay);
    }

    // Error message
    if (this.errorMessage) {
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        color: #${CPC_PALETTE.RED.toString(16).padStart(6, '0')};
        font-size: 14px;
        margin-top: 10px;
      `;
      errorDiv.textContent = this.errorMessage;
      this.inputContainer.appendChild(errorDiv);
    }
  }

  handleKeyDown(e) {
    if (!this.element || !this.element.parentNode) return;

    // Initialize sound on first interaction
    soundSystem.init();
    soundSystem.resume();

    const key = e.key;

    if (this.inputMode === 'landscape') {
      if (key >= '0' && key <= '9' && this.landscapeNumber.length < 4) {
        this.landscapeNumber += key;
        soundSystem.playCodeEntry();
        this.createInputUI();

        // Auto-advance when 4 digits entered
        if (this.landscapeNumber.length === 4) {
          const num = parseInt(this.landscapeNumber, 10);
          if (num === 0) {
            // Landscape 0000 doesn't need a code
            setTimeout(() => this.startGame(0, null), 300);
          } else {
            this.inputMode = 'code';
            this.createInputUI();
          }
        }
      } else if (key === 'Backspace') {
        this.landscapeNumber = this.landscapeNumber.slice(0, -1);
        this.errorMessage = '';
        this.createInputUI();
      } else if (key === 'Enter' && this.landscapeNumber.length > 0) {
        const num = parseInt(this.landscapeNumber.padEnd(4, '0'), 10);
        if (num === 0) {
          this.startGame(0, null);
        } else {
          this.landscapeNumber = this.landscapeNumber.padStart(4, '0');
          this.inputMode = 'code';
          this.createInputUI();
        }
      }
    } else if (this.inputMode === 'code') {
      if ((key >= '0' && key <= '9') && this.entryCode.length < 8) {
        this.entryCode += key;
        soundSystem.playCodeEntry();
        this.createInputUI();

        if (this.entryCode.length === 8) {
          // Verify code
          setTimeout(() => this.verifyCode(), 300);
        }
      } else if (key === 'Backspace') {
        if (this.entryCode.length > 0) {
          this.entryCode = this.entryCode.slice(0, -1);
        } else {
          // Go back to landscape entry
          this.inputMode = 'landscape';
          this.landscapeNumber = '';
        }
        this.errorMessage = '';
        this.createInputUI();
      } else if (key === 'Escape') {
        this.inputMode = 'landscape';
        this.landscapeNumber = '';
        this.entryCode = '';
        this.errorMessage = '';
        this.createInputUI();
      }
    }
  }

  verifyCode() {
    const landscape = parseInt(this.landscapeNumber, 10);
    const expectedCode = this.generateCode(landscape);

    if (this.entryCode === expectedCode) {
      soundSystem.playCodeAccepted();
      this.startGame(landscape, this.entryCode);
    } else {
      soundSystem.playCodeRejected();
      this.errorMessage = 'INVALID CODE';
      this.entryCode = '';
      this.createInputUI();
    }
  }

  // Generate deterministic 8-digit code for a landscape
  generateCode(landscape) {
    // Simple but deterministic code generation
    // Uses a hash-like function of the landscape number
    let hash = landscape * 2654435761;  // Knuth multiplicative hash
    hash = hash >>> 0;  // Convert to unsigned 32-bit

    // Generate 8 digits
    let code = '';
    for (let i = 0; i < 8; i++) {
      hash = ((hash * 1103515245) + 12345) >>> 0;
      code += (hash % 10).toString();
    }

    return code;
  }

  startGame(landscape, code) {
    this.stopMusic();
    soundSystem.playCodeAccepted();

    if (this.onStartGame) {
      this.onStartGame(landscape, code);
    }
  }

  // Draw the Escher Eye
  drawEye() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    // Eye outline
    const centerX = w / 2;
    const centerY = h / 2;
    const eyeWidth = 80;
    const eyeHeight = 40;

    // Outer eye shape
    ctx.strokeStyle = `#${CPC_PALETTE.CYAN.toString(16).padStart(6, '0')}`;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(centerX - eyeWidth, centerY);
    ctx.quadraticCurveTo(centerX, centerY - eyeHeight, centerX + eyeWidth, centerY);
    ctx.quadraticCurveTo(centerX, centerY + eyeHeight, centerX - eyeWidth, centerY);
    ctx.stroke();

    // Iris
    const irisRadius = 25;
    ctx.fillStyle = `#${CPC_PALETTE.DARK_CYAN.toString(16).padStart(6, '0')}`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, irisRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pupil (animated)
    const pupilRadius = 12;
    const pupilOffset = Math.sin(this.eyePhase) * 5;
    ctx.fillStyle = `#${CPC_PALETTE.BLACK.toString(16).padStart(6, '0')}`;
    ctx.beginPath();
    ctx.arc(centerX + pupilOffset, centerY, pupilRadius, 0, Math.PI * 2);
    ctx.fill();

    // Reflection
    ctx.fillStyle = `#${CPC_PALETTE.WHITE.toString(16).padStart(6, '0')}`;
    ctx.beginPath();
    ctx.arc(centerX + pupilOffset - 4, centerY - 4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Inner patterns (Escher-like)
    ctx.strokeStyle = `#${CPC_PALETTE.GREEN.toString(16).padStart(6, '0')}`;
    ctx.lineWidth = 1;

    // Concentric rings in iris
    for (let r = 8; r < irisRadius; r += 5) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Radial lines
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(a) * pupilRadius, centerY + Math.sin(a) * pupilRadius);
      ctx.lineTo(centerX + Math.cos(a) * irisRadius, centerY + Math.sin(a) * irisRadius);
      ctx.stroke();
    }

    // Landscape reflection in eye (stylized)
    ctx.strokeStyle = `#${CPC_PALETTE.RED.toString(16).padStart(6, '0')}`;
    const reflY = centerY + 5;

    // Sentinel silhouette in reflection
    ctx.beginPath();
    ctx.moveTo(centerX - 3, reflY + 8);
    ctx.lineTo(centerX - 3, reflY);
    ctx.lineTo(centerX - 1, reflY - 4);
    ctx.lineTo(centerX + 1, reflY - 4);
    ctx.lineTo(centerX + 3, reflY);
    ctx.lineTo(centerX + 3, reflY + 8);
    ctx.stroke();

    // Update animation
    this.eyePhase += 0.02;
  }

  animate() {
    if (!this.element || !this.element.parentNode) return;

    this.drawEye();
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  startMusic() {
    // Play title music on loop
    const playMusic = () => {
      if (this.element && this.element.parentNode) {
        const duration = soundSystem.playTitleMusic();
        if (duration) {
          this.musicInterval = setTimeout(playMusic, duration + 500);
        }
      }
    };

    // Start after a brief delay
    setTimeout(playMusic, 1000);
  }

  stopMusic() {
    if (this.musicInterval) {
      clearTimeout(this.musicInterval);
      this.musicInterval = null;
    }
  }

  show() {
    this.container.appendChild(this.element);
    this.animate();
    this.startMusic();
  }

  hide() {
    this.stopMusic();
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    document.removeEventListener('keydown', this.handleKeyDown);
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

  // Get the code for a completed level (for display)
  static getCodeForLevel(landscape) {
    let hash = landscape * 2654435761;
    hash = hash >>> 0;
    let code = '';
    for (let i = 0; i < 8; i++) {
      hash = ((hash * 1103515245) + 12345) >>> 0;
      code += (hash % 10).toString();
    }
    return code;
  }
}
