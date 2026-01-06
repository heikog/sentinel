import { ENERGY, LANDSCAPE } from '../config.js';

export class CreationSystem {
  constructor(level, player) {
    this.level = level;
    this.player = player;
  }

  // Check if player can create entity at target position
  canCreate(type, targetGridX, targetGridZ, onBoulder = false) {
    if (!this.player.sightsOn) {
      return { success: false, reason: 'Sights not on' };
    }

    // Check energy
    const cost = this.getCost(type);
    if (!this.player.hasEnergy(cost)) {
      return { success: false, reason: 'Not enough energy' };
    }

    const landscape = this.level.landscape;
    const targetSquare = landscape.getSquare(targetGridX, targetGridZ);

    if (!targetSquare) {
      return { success: false, reason: 'Invalid position' };
    }

    // Clean up any stale references to removed entities
    targetSquare.cleanupRemovedEntities();

    const hasBoulders = targetSquare.boulderStack.length > 0;

    // Check if position is valid for creation based on type
    if (type === 'boulder') {
      // Boulders can stack on empty ground or on other boulders
      // But can't place if there's already a non-boulder entity on ground
      if (targetSquare.entity !== null && !hasBoulders) {
        return { success: false, reason: 'Square not empty' };
      }
      // Can't place boulder if there's something on top of boulder stack
      if (hasBoulders && targetSquare.topEntity !== null) {
        return { success: false, reason: 'Already something on top' };
      }
    } else {
      // Trees and robots
      if (hasBoulders) {
        // Placing on top of boulders - check if top is free
        if (targetSquare.topEntity !== null) {
          return { success: false, reason: 'Already something on top' };
        }
      } else {
        // Placing on ground - need empty ground
        if (targetSquare.entity !== null) {
          return { success: false, reason: 'Square not empty' };
        }
      }
    }

    // Check line of sight
    if (!this.hasLineOfSight(targetGridX, targetGridZ)) {
      return { success: false, reason: 'No line of sight' };
    }

    return { success: true };
  }

  getCost(type) {
    switch (type) {
      case 'tree': return ENERGY.TREE;
      case 'boulder': return ENERGY.BOULDER;
      case 'robot': return ENERGY.ROBOT;
      default: return Infinity;
    }
  }

  // Check line of sight for creation
  // More lenient - if Three.js raycast found the square, we mostly trust it
  hasLineOfSight(targetX, targetZ) {
    const landscape = this.level.landscape;

    const playerSquare = landscape.getSquare(this.player.gridX, this.player.gridZ);
    const targetSquare = landscape.getSquare(targetX, targetZ);

    if (!playerSquare || !targetSquare) return false;

    // Same square - always visible
    if (this.player.gridX === targetX && this.player.gridZ === targetZ) {
      return true;
    }

    // Adjacent squares - always visible (within 1 square distance)
    const gridDx = Math.abs(this.player.gridX - targetX);
    const gridDz = Math.abs(this.player.gridZ - targetZ);
    if (gridDx <= 1 && gridDz <= 1) {
      return true;
    }

    const playerWorld = landscape.gridToWorld(this.player.gridX, this.player.gridZ);
    const targetWorld = landscape.gridToWorld(targetX, targetZ);

    const playerY = (playerSquare.height + this.player.stackHeight) * LANDSCAPE.HEIGHT_UNIT + 0.8;
    const targetY = targetSquare.height * LANDSCAPE.HEIGHT_UNIT;

    // Check intermediate squares (skip first and last)
    const dx = targetWorld.x - playerWorld.x;
    const dz = targetWorld.z - playerWorld.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    const steps = Math.max(2, Math.ceil(distance / LANDSCAPE.SQUARE_SIZE));

    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const checkX = playerWorld.x + dx * t;
      const checkZ = playerWorld.z + dz * t;

      // Linear interpolation of height along ray
      const rayY = playerY + (targetY - playerY) * t;

      const gridPos = landscape.worldToGrid(checkX, checkZ);

      // Skip if it's the player's square or target square
      if ((gridPos.x === this.player.gridX && gridPos.z === this.player.gridZ) ||
          (gridPos.x === targetX && gridPos.z === targetZ)) {
        continue;
      }

      const checkSquare = landscape.getSquare(gridPos.x, gridPos.z);

      if (checkSquare) {
        // Only block if terrain itself is significantly higher than ray
        const terrainHeight = checkSquare.height * LANDSCAPE.HEIGHT_UNIT;
        if (terrainHeight > rayY + 0.1) {
          return false;  // Terrain blocks view
        }
      }
    }

    return true;
  }

  // Perform creation
  create(type, targetGridX, targetGridZ) {
    const targetSquare = this.level.landscape.getSquare(targetGridX, targetGridZ);
    if (!targetSquare) {
      return { success: false, reason: 'Invalid position' };
    }

    // Determine if we're placing on top of boulders
    const hasBoulders = targetSquare.boulderStack.length > 0;

    // Determine stack height - where the new entity will be placed
    let stackHeight = 0;
    if (type === 'boulder') {
      // New boulder goes on top of existing boulder stack
      stackHeight = targetSquare.boulderStack.length;
    } else if (hasBoulders) {
      // Trees and robots go on top of boulder stack
      stackHeight = targetSquare.boulderStack.length;
    }

    // Check if we can create here
    const onBoulder = hasBoulders && type !== 'boulder';
    const result = this.canCreate(type, targetGridX, targetGridZ, onBoulder);
    if (!result.success) {
      return result;
    }

    const cost = this.getCost(type);

    // Deduct energy
    this.player.removeEnergy(cost);

    // Create entity
    const entity = this.level.createEntity(type, targetGridX, targetGridZ, stackHeight);

    return {
      success: true,
      entity,
      energySpent: cost
    };
  }
}
