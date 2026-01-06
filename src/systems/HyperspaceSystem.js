import { ENERGY, LANDSCAPE } from '../config.js';

export class HyperspaceSystem {
  constructor(level, player) {
    this.level = level;
    this.player = player;
  }

  // Check if hyperspace is possible
  canHyperspace() {
    if (!this.player.hasEnergy(ENERGY.HYPERSPACE_COST)) {
      return { success: false, reason: 'Not enough energy' };
    }

    // Find valid destination
    const destination = this.findDestination();
    if (!destination) {
      return { success: false, reason: 'No valid destination' };
    }

    return { success: true, destination };
  }

  // Find a random valid destination for hyperspace
  findDestination() {
    const landscape = this.level.landscape;
    const playerSquare = landscape.getSquare(this.player.gridX, this.player.gridZ);

    if (!playerSquare) return null;

    const playerHeight = playerSquare.height + this.player.stackHeight;

    // Get all valid squares (empty, same height or lower)
    const validSquares = landscape.getEmptySquaresAtOrBelow(playerHeight);

    // Filter out current position
    const filtered = validSquares.filter(sq =>
      sq.x !== this.player.gridX || sq.z !== this.player.gridZ
    );

    if (filtered.length === 0) return null;

    // Pick random destination
    const index = Math.floor(Math.random() * filtered.length);
    return filtered[index];
  }

  // Execute hyperspace jump
  hyperspace(forced = false) {
    const result = this.canHyperspace();

    if (!result.success) {
      return result;
    }

    const destination = result.destination;

    // Deduct energy
    this.player.removeEnergy(ENERGY.HYPERSPACE_COST);

    // Get destination details
    const landscape = this.level.landscape;
    const destSquare = landscape.getSquare(destination.x, destination.z);

    // Remove old robot if exists
    if (this.player.currentRobot) {
      this.level.removeEntity(this.player.currentRobot);
    }

    // Create new robot at destination
    const newRobot = this.level.createEntity('robot', destination.x, destination.z, 0);
    if (newRobot) {
      newRobot.setAsPlayer(true);
      this.player.currentRobot = newRobot;
    }

    // Update player position
    this.player.setPosition(destination.x, destination.z, 0);

    // Update camera position
    const worldPos = landscape.gridToWorld(destination.x, destination.z);
    const height = destSquare.height * LANDSCAPE.HEIGHT_UNIT;

    return {
      success: true,
      newPosition: {
        gridX: destination.x,
        gridZ: destination.z,
        worldX: worldPos.x,
        worldY: height + 0.8,  // Eye height
        worldZ: worldPos.z
      },
      energySpent: ENERGY.HYPERSPACE_COST,
      forced
    };
  }

  // Calculate level skip based on energy when completing level
  calculateLevelSkip() {
    // Every 3 energy = skip 1 level
    return Math.floor(this.player.energy / 3);
  }

  // Hyperspace to next level (after absorbing Sentinel)
  hyperspaceToNextLevel() {
    const skip = this.calculateLevelSkip();
    return {
      levelsSkipped: skip,
      energyBonus: this.player.energy
    };
  }
}
