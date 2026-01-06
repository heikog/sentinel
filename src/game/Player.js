import { ENERGY, CAMERA } from '../config.js';

export class Player {
  constructor() {
    // Energy
    this.energy = ENERGY.STARTING_ENERGY;

    // Position (grid coordinates)
    this.gridX = 0;
    this.gridZ = 0;

    // Height level (including boulders standing on)
    this.stackHeight = 0;

    // Current robot entity reference
    this.currentRobot = null;

    // Sights mode
    this.sightsOn = false;

    // Target under crosshair
    this.targetSquare = null;
    this.targetEntity = null;

    // Detection status
    this.isDetected = false;
    this.detectionLevel = 0;  // 0 = safe, 1 = partial (head visible), 2 = full (square visible)
    this.detectionTimer = 0;

    // Game state flags
    this.hasAbsorbedSentinel = false;
    this.isOnSentinelPlatform = false;
  }

  reset(startingEnergy = ENERGY.STARTING_ENERGY) {
    this.energy = startingEnergy;
    this.gridX = 0;
    this.gridZ = 0;
    this.stackHeight = 0;
    this.currentRobot = null;
    this.sightsOn = false;
    this.targetSquare = null;
    this.targetEntity = null;
    this.isDetected = false;
    this.detectionLevel = 0;
    this.detectionTimer = 0;
    this.hasAbsorbedSentinel = false;
    this.isOnSentinelPlatform = false;
  }

  setPosition(gridX, gridZ, stackHeight = 0) {
    this.gridX = gridX;
    this.gridZ = gridZ;
    this.stackHeight = stackHeight;
  }

  getPosition() {
    return {
      gridX: this.gridX,
      gridZ: this.gridZ,
      stackHeight: this.stackHeight
    };
  }

  // Get effective height (terrain + boulders + eye level)
  getEffectiveHeight(landscape) {
    const square = landscape.getSquare(this.gridX, this.gridZ);
    if (!square) return 0;
    return square.height + this.stackHeight;
  }

  // Energy management
  addEnergy(amount) {
    this.energy += amount;
  }

  removeEnergy(amount) {
    this.energy = Math.max(0, this.energy - amount);
    return this.energy > 0;
  }

  hasEnergy(amount) {
    return this.energy >= amount;
  }

  // Actions
  toggleSights() {
    this.sightsOn = !this.sightsOn;
    if (!this.sightsOn) {
      this.targetSquare = null;
      this.targetEntity = null;
    }
  }

  canAbsorb(targetSquare, targetEntity) {
    if (!this.sightsOn) return false;
    if (!targetSquare) return false;

    // Can't absorb if no entity
    if (!targetEntity && targetSquare.isEmpty()) return false;

    // Can't absorb the Sentinel until we're high enough
    if (targetEntity && targetEntity.type === 'sentinel') {
      // Need to see the square the Sentinel stands on
      return true;  // Height check done elsewhere
    }

    return true;
  }

  canCreate(type) {
    if (!this.sightsOn) return false;

    const cost = this.getCreationCost(type);
    return this.hasEnergy(cost);
  }

  getCreationCost(type) {
    switch (type) {
      case 'tree': return ENERGY.TREE;
      case 'boulder': return ENERGY.BOULDER;
      case 'robot': return ENERGY.ROBOT;
      default: return Infinity;
    }
  }

  canTransfer(targetEntity) {
    if (!this.sightsOn) return false;
    if (!targetEntity) return false;
    return targetEntity.type === 'robot' && targetEntity !== this.currentRobot;
  }

  canHyperspace() {
    return this.hasEnergy(ENERGY.HYPERSPACE_COST);
  }

  // Detection handling
  setDetectionLevel(level) {
    this.detectionLevel = level;
    this.isDetected = level > 0;

    if (level === 0) {
      this.detectionTimer = 0;
    }
  }

  updateDetection(deltaTime) {
    if (this.detectionLevel === 2) {
      // Full detection - drain energy over time
      this.detectionTimer += deltaTime;
      // Grace period then drain
      if (this.detectionTimer > 5.0) {
        return true;  // Should drain
      }
    } else if (this.detectionLevel === 1) {
      // Partial detection - Meanie might spawn
      this.detectionTimer += deltaTime;
    }
    return false;
  }

  // Check if player is dead (no energy)
  isDead() {
    return this.energy <= 0;
  }

  // Check if player has won (absorbed Sentinel and on platform)
  hasWon() {
    return this.hasAbsorbedSentinel && this.isOnSentinelPlatform;
  }

  // Get energy display info (for UI)
  getEnergyDisplay() {
    const fullIcons = Math.floor(this.energy / 3);
    const remainder = this.energy % 3;
    return { fullIcons, remainder };
  }
}
