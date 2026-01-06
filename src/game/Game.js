import { Renderer } from '../rendering/Renderer.js';
import { LandscapeGenerator } from '../world/LandscapeGenerator.js';
import { MeshFactory } from '../rendering/MeshFactory.js';
import { GameCamera } from '../rendering/Camera.js';
import { Cursor } from '../rendering/Cursor.js';
import { UI } from '../rendering/UI.js';
import { Player } from './Player.js';
import { InputHandler } from './InputHandler.js';
import { Level } from './Level.js';
import { AbsorptionSystem } from '../systems/AbsorptionSystem.js';
import { CreationSystem } from '../systems/CreationSystem.js';
import { DetectionSystem } from '../systems/DetectionSystem.js';
import { HyperspaceSystem } from '../systems/HyperspaceSystem.js';
import { ENERGY, CAMERA, LANDSCAPE } from '../config.js';
import { TitleScreen } from '../screens/TitleScreen.js';
import { AerialView } from '../screens/AerialView.js';
import { soundSystem } from '../audio/SoundSystem.js';
import * as THREE from 'three';

export class Game {
  constructor(container) {
    this.container = container;
    this.renderer = null;
    this.landscape = null;
    this.player = null;
    this.inputHandler = null;
    this.level = null;
    this.currentLevelNumber = 0;
    this.levelCode = '00000000';
    this.isRunning = false;
    this.lastTime = 0;

    // Game camera wrapper
    this.gameCamera = null;

    // Cursor/Sights system (authentic edge-scrolling)
    this.cursor = null;

    // UI
    this.ui = null;

    // Screens
    this.titleScreen = null;
    this.aerialView = null;

    // Systems
    this.absorptionSystem = null;
    this.creationSystem = null;
    this.detectionSystem = null;
    this.hyperspaceSystem = null;

    // Game state: 'title', 'aerial', 'playing', 'paused', 'gameOver', 'levelComplete'
    this.gameState = 'title';
    this.isPaused = false;

    // Detection sound state
    this.detectionHumStop = null;
  }

  async init() {
    // Create renderer
    this.renderer = new Renderer(this.container);

    // Create mesh factory
    this.meshFactory = new MeshFactory();

    // Create game camera wrapper
    this.gameCamera = new GameCamera(this.renderer.getCamera());

    // Create cursor system (authentic 8-bit edge-scroll behavior)
    this.cursor = new Cursor(
      this.renderer.width || 640,
      this.renderer.height || 480
    );

    // Create input handler
    this.inputHandler = new InputHandler();

    // Create player
    this.player = new Player();

    // Create UI
    this.ui = new UI(this.container);
    this.ui.createScanlines();

    // Show title screen instead of loading level immediately
    this.showTitleScreen();

    console.log('The Sentinel initialized');
  }

  showTitleScreen() {
    this.gameState = 'title';

    // Hide any existing screens
    if (this.aerialView) {
      this.aerialView.hide();
      this.aerialView = null;
    }

    // Create and show title screen
    this.titleScreen = new TitleScreen(this.container, (landscape, code) => {
      this.titleScreen.hide();
      this.titleScreen = null;
      this.prepareLevel(landscape);
    });
    this.titleScreen.show();
  }

  async prepareLevel(levelNumber) {
    // Generate landscape first
    const generator = new LandscapeGenerator(levelNumber);
    this.landscape = generator.generate();
    this.levelCode = generator.getLevelCode();
    this.currentLevelNumber = levelNumber;

    // Show aerial view
    this.gameState = 'aerial';
    this.aerialView = new AerialView(this.container, () => {
      this.aerialView.hide();
      this.aerialView = null;
      this.startLevel(levelNumber);
    });
    this.aerialView.show(this.landscape, levelNumber, this.levelCode);
  }

  async startLevel(levelNumber) {
    this.gameState = 'playing';
    this.ui.hideScreens();

    // Clear previous level
    if (this.level) {
      this.level.cleanup(this.renderer);
    }

    // Create level
    this.level = new Level(this.landscape, this.renderer, this.meshFactory);
    this.level.build();

    // Reset player
    this.player.reset(ENERGY.STARTING_ENERGY);

    // Position player at start
    const startPos = this.landscape.getPlayerStartPosition();
    const startSquare = this.landscape.getSquare(startPos.x, startPos.z);
    this.player.setPosition(startPos.x, startPos.z, 0);
    this.player.currentRobot = this.level.playerRobot;

    // Set up camera
    this.gameCamera.setPosition(
      startPos.x,
      startPos.z,
      startSquare.height,
      0,
      this.landscape
    );
    this.gameCamera.reset();

    // Look at the Sentinel at level start
    const sentinelPos = this.landscape.getSentinelPosition();
    if (sentinelPos) {
      const dx = sentinelPos.x - startPos.x;
      const dz = sentinelPos.z - startPos.z;
      const angleToSentinel = Math.atan2(-dx, -dz);
      this.gameCamera.rotate(angleToSentinel, 0);
    }

    // Reset cursor
    if (this.cursor.visible) {
      this.cursor.toggle();
    }

    // Initialize systems
    this.absorptionSystem = new AbsorptionSystem(this.level, this.player);
    this.creationSystem = new CreationSystem(this.level, this.player);
    this.detectionSystem = new DetectionSystem(this.level, this.player);
    this.hyperspaceSystem = new HyperspaceSystem(this.level, this.player);

    // Update UI
    this.ui.updateLevel(levelNumber, this.levelCode);
    this.ui.updateEnergy(this.player.energy);

    console.log(`Level ${levelNumber} loaded (code: ${this.levelCode})`);
  }

  // Legacy loadLevel - now used for restart from game over
  async loadLevel(levelNumber) {
    await this.prepareLevel(levelNumber);
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  stop() {
    this.isRunning = false;
  }

  gameLoop() {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);  // Cap delta
    this.lastTime = currentTime;

    // Update game state
    this.update(deltaTime);

    // Render
    this.renderer.render();

    // Next frame
    requestAnimationFrame(() => this.gameLoop());
  }

  update(deltaTime) {
    // Don't update during title/aerial screens
    if (this.gameState === 'title' || this.gameState === 'aerial') {
      return;
    }

    // Handle pause toggle
    if (this.inputHandler.wasJustPressed('PAUSE')) {
      this.isPaused = !this.isPaused;
      this.ui.setPaused(this.isPaused);
      soundSystem.playMenuSelect();
    }

    // Handle sound toggle
    if (this.inputHandler.wasJustPressed('SOUND_TOGGLE')) {
      const muted = soundSystem.toggleMute();
      this.ui.showMessage(muted ? 'SOUND OFF' : 'SOUND ON');
    }

    // If paused, don't update game logic
    if (this.isPaused) {
      this.inputHandler.update();
      return;
    }

    // Handle game over/level complete states
    if (this.gameState === 'gameOver' || this.gameState === 'levelComplete') {
      if (this.inputHandler.wasJustPressed('SIGHTS')) {
        if (this.gameState === 'gameOver') {
          this.showTitleScreen();  // Return to title screen
        } else {
          const skip = this.hyperspaceSystem.calculateLevelSkip();
          this.prepareLevel(this.currentLevelNumber + 1 + skip);
        }
      }
      this.inputHandler.update();
      return;
    }

    // Handle input
    this.handleInput(deltaTime);

    // Update level (entities, AI)
    if (this.level) {
      this.level.update(deltaTime, this.player);
    }

    // Update detection system
    if (this.detectionSystem) {
      const result = this.detectionSystem.update(deltaTime);

      // Handle detection sound
      if (this.player.detectionLevel > 0 && !this.detectionHumStop) {
        // Start detection hum
        this.detectionHumStop = soundSystem.playDetectionHum();
      } else if (this.player.detectionLevel === 0 && this.detectionHumStop) {
        // Stop detection hum
        this.detectionHumStop();
        this.detectionHumStop = null;
      }

      if (result.gameOver) {
        this.onGameOver('absorbed');
      }
    }

    // Update UI
    this.ui.updateEnergy(this.player.energy);
    this.ui.updateWarning(
      this.player.detectionLevel,
      this.detectionSystem ? this.detectionSystem.drainTimer / 5.0 : 0
    );

    // Update cursor display
    this.ui.setSightsVisible(this.cursor.visible, this.cursor.shouldDisplay());
    if (this.cursor.visible) {
      // Update canvas bounds for proper crosshair alignment
      const bounds = this.renderer.getCanvasBounds();
      this.ui.setCanvasBounds(bounds.x, bounds.y, bounds.width, bounds.height);

      const cursorPos = this.cursor.getNormalizedPosition();
      this.ui.updateCursorPosition(cursorPos.x, cursorPos.y);
    }

    // Update target info if sights are on
    if (this.cursor.visible) {
      const cursorNDC = this.cursor.getNDC();
      const target = this.gameCamera.getTarget(
        this.renderer.getScene(),
        this.landscape,
        new THREE.Vector2(cursorNDC.x, cursorNDC.y),
        this.player.currentRobot  // Filter out player's own robot
      );
      this.ui.updateTarget(target);
    }

    // Check win condition
    if (this.player.hasAbsorbedSentinel) {
      const sentinelPos = this.landscape.getSentinelPosition();
      if (this.player.gridX === sentinelPos.x && this.player.gridZ === sentinelPos.z) {
        this.player.isOnSentinelPlatform = true;
        this.ui.showMessage('HYPERSPACE to complete level!');
      }
    }
  }

  handleInput(deltaTime) {
    const input = this.inputHandler;

    // Toggle sights
    if (input.wasJustPressed('SIGHTS')) {
      this.cursor.toggle();
      this.player.sightsOn = this.cursor.visible;
    }

    // U-turn (works regardless of sights)
    if (input.wasJustPressed('U_TURN')) {
      this.gameCamera.uTurn();
      soundSystem.playUTurn();
    }

    // When sights are ON: cursor moves, edge triggers discrete pan (user blocked during pan)
    // When sights are OFF: direct camera pan
    if (this.cursor.visible) {
      // Update cursor based on direction input
      const panResult = this.cursor.update(
        deltaTime,
        input.isPressed('PAN_LEFT'),
        input.isPressed('PAN_RIGHT'),
        input.isPressed('PAN_UP'),
        input.isPressed('PAN_DOWN')
      );

      // Apply camera pan from cursor edge-scroll
      if (panResult.panYaw !== 0 || panResult.panPitch !== 0) {
        this.gameCamera.rotate(panResult.panYaw, panResult.panPitch);
      }

      // If panning, user is BLOCKED - no actions allowed
      if (panResult.isBlocked) {
        // Clear inputs but don't process actions
        input.update();
        return;
      }

      // Not panning - allow actions
      // Get target at cursor position
      const cursorNDC = this.cursor.getNDC();
      const target = this.gameCamera.getTarget(
        this.renderer.getScene(),
        this.landscape,
        new THREE.Vector2(cursorNDC.x, cursorNDC.y),
        this.player.currentRobot  // Filter out player's own robot
      );

      // Actions (only when sights are on, not panning, and we have a target)
      if (target) {
        if (input.wasJustPressed('CREATE_TREE')) {
          this.tryCreateEntity('tree', target.gridX, target.gridZ);
        }
        if (input.wasJustPressed('CREATE_BOULDER')) {
          this.tryCreateEntity('boulder', target.gridX, target.gridZ);
        }
        if (input.wasJustPressed('CREATE_ROBOT')) {
          this.tryCreateEntity('robot', target.gridX, target.gridZ);
        }
        if (input.wasJustPressed('ABSORB')) {
          this.tryAbsorb(target.gridX, target.gridZ);
        }
        if (input.wasJustPressed('TRANSFER')) {
          this.tryTransfer(target);
        }
      }
    } else {
      // Sights OFF: direct camera rotation (faster panning to look around)
      if (input.isPressed('PAN_LEFT')) {
        this.gameCamera.rotate(CAMERA.PAN_SPEED * deltaTime, 0);
      }
      if (input.isPressed('PAN_RIGHT')) {
        this.gameCamera.rotate(-CAMERA.PAN_SPEED * deltaTime, 0);
      }
      if (input.isPressed('PAN_UP')) {
        this.gameCamera.rotate(0, CAMERA.PAN_SPEED * deltaTime);
      }
      if (input.isPressed('PAN_DOWN')) {
        this.gameCamera.rotate(0, -CAMERA.PAN_SPEED * deltaTime);
      }
    }

    // Hyperspace (always available)
    if (input.wasJustPressed('HYPERSPACE')) {
      this.tryHyperspace();
    }

    // Clear just pressed states
    input.update();
  }

  tryCreateEntity(type, gridX, gridZ) {
    const result = this.creationSystem.create(type, gridX, gridZ);

    if (result.success) {
      soundSystem.playCreate();
      this.ui.showMessage(`Created ${type}`);
    } else {
      soundSystem.playError();
      this.ui.showMessage(result.reason);
    }
  }

  tryAbsorb(gridX, gridZ) {
    const result = this.absorptionSystem.absorb(gridX, gridZ);

    if (result.success) {
      soundSystem.playAbsorb();
      this.ui.showMessage(`Absorbed ${result.entityType} (+${result.energyGained})`);

      // Check if absorbed Sentinel
      if (result.entityType === 'sentinel') {
        this.ui.showMessage('SENTINEL ABSORBED! Transfer to platform!', 3000);
      }
    } else {
      soundSystem.playError();
      this.ui.showMessage(result.reason);
    }
  }

  tryTransfer(target) {
    if (!target || !target.entity || target.entity.type !== 'robot') {
      soundSystem.playError();
      this.ui.showMessage('No robot to transfer to');
      return;
    }

    if (target.entity === this.player.currentRobot) {
      soundSystem.playError();
      this.ui.showMessage('Already in this robot');
      return;
    }

    // Get old robot position for absorption
    const oldRobot = this.player.currentRobot;

    // Transfer to new robot
    const newRobot = target.entity;
    newRobot.setAsPlayer(true);

    if (oldRobot) {
      oldRobot.setAsPlayer(false);
    }

    this.player.currentRobot = newRobot;
    this.player.setPosition(newRobot.gridX, newRobot.gridZ, newRobot.stackHeight);

    // Update camera position
    const square = this.landscape.getSquare(newRobot.gridX, newRobot.gridZ);
    this.gameCamera.setPosition(
      newRobot.gridX,
      newRobot.gridZ,
      square.height,
      newRobot.stackHeight,
      this.landscape
    );

    soundSystem.playTransfer();
    this.ui.showMessage('Transferred');
  }

  tryHyperspace() {
    // Check if player has won and is on Sentinel platform
    if (this.player.hasAbsorbedSentinel && this.player.isOnSentinelPlatform) {
      soundSystem.playHyperspace();
      const result = this.hyperspaceSystem.hyperspaceToNextLevel();
      this.onLevelComplete(result.levelsSkipped);
      return;
    }

    // Normal hyperspace
    const result = this.hyperspaceSystem.hyperspace();

    if (result.success) {
      soundSystem.playHyperspace();

      // Update camera position
      this.gameCamera.setPosition(
        result.newPosition.gridX,
        result.newPosition.gridZ,
        this.landscape.getSquare(result.newPosition.gridX, result.newPosition.gridZ).height,
        0,
        this.landscape
      );

      this.ui.showMessage(`Hyperspace! (-${result.energySpent})`);
    } else {
      soundSystem.playError();
      this.ui.showMessage(result.reason);
    }
  }

  onGameOver(reason) {
    this.gameState = 'gameOver';
    soundSystem.playGameOver();

    // Stop detection hum if playing
    if (this.detectionHumStop) {
      this.detectionHumStop();
      this.detectionHumStop = null;
    }

    this.ui.showGameOver(reason);
  }

  onLevelComplete(levelsSkipped) {
    this.gameState = 'levelComplete';
    soundSystem.playLevelComplete();

    // Calculate next level code for display
    const nextLevel = this.currentLevelNumber + 1 + levelsSkipped;
    const nextCode = TitleScreen.getCodeForLevel(nextLevel);

    this.ui.showLevelComplete(levelsSkipped, nextLevel, nextCode);
  }
}
