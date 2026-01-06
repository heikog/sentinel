import { ENERGY, LANDSCAPE } from '../config.js';

export class AbsorptionSystem {
  constructor(level, player) {
    this.level = level;
    this.player = player;
  }

  // Check if player can absorb target at given position
  canAbsorb(targetGridX, targetGridZ) {
    if (!this.player.sightsOn) return { success: false, reason: 'Sights not on' };

    const landscape = this.level.landscape;
    const targetSquare = landscape.getSquare(targetGridX, targetGridZ);

    if (!targetSquare) {
      return { success: false, reason: 'Invalid position' };
    }

    // Clean up any stale references to removed entities
    targetSquare.cleanupRemovedEntities();

    // Check if there's anything to absorb
    if (!targetSquare.hasAbsorbableContent()) {
      return { success: false, reason: 'Nothing to absorb' };
    }

    // Check line of sight to target square
    if (!this.hasLineOfSight(targetGridX, targetGridZ)) {
      return { success: false, reason: 'No line of sight' };
    }

    // Can't absorb player's current robot
    const entity = this.getTopAbsorbableEntity(targetSquare);
    if (entity && entity.type === 'robot' && entity.isPlayer) {
      return { success: false, reason: 'Cannot absorb self' };
    }

    // Special rule for Sentinel - must be at same height or higher than Sentinel's platform
    // (need to see the base/square to absorb, not just the head)
    if (entity && entity.type === 'sentinel') {
      const playerSquare = landscape.getSquare(this.player.gridX, this.player.gridZ);
      const playerHeight = playerSquare.height + this.player.stackHeight;
      const sentinelPlatformHeight = targetSquare.height;

      // Player must be at least at the same height level to see the Sentinel's base
      if (playerHeight < sentinelPlatformHeight) {
        return { success: false, reason: 'Must be higher than Sentinel' };
      }
    }

    return { success: true, entity };
  }

  // Get the top absorbable entity on a square
  getTopAbsorbableEntity(square) {
    // Priority: topEntity > last boulder > ground entity
    // Skip entities that have been marked as removed
    if (square.topEntity && square.topEntity.absorbable && !square.topEntity.removed) {
      return square.topEntity;
    }

    if (square.boulderStack.length > 0) {
      const topBoulder = square.boulderStack[square.boulderStack.length - 1];
      if (topBoulder && topBoulder.absorbable && !topBoulder.removed) {
        return topBoulder;
      }
    }

    if (square.entity && square.entity.absorbable && !square.entity.removed) {
      return square.entity;
    }

    return null;
  }

  // Check line of sight from player to target
  // More lenient check - if Three.js raycast found it, we trust it mostly
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
        // Only block if terrain itself (not entities) is significantly higher than ray
        const terrainHeight = checkSquare.height * LANDSCAPE.HEIGHT_UNIT;
        if (terrainHeight > rayY + 0.1) {
          return false;  // Terrain blocks view
        }
      }
    }

    return true;
  }

  // Perform absorption
  absorb(targetGridX, targetGridZ) {
    const result = this.canAbsorb(targetGridX, targetGridZ);
    if (!result.success) {
      return result;
    }

    const entity = result.entity;

    // Double-check entity is still valid and not already removed
    if (!entity || entity.removed) {
      return { success: false, reason: 'Nothing to absorb' };
    }

    const energyGained = entity.energy || 0;

    // Add energy to player
    this.player.addEnergy(energyGained);

    // Handle Sentinel absorption
    if (entity.type === 'sentinel') {
      this.player.hasAbsorbedSentinel = true;
    }

    // Remove entity from level
    this.level.removeEntity(entity);

    return {
      success: true,
      energyGained,
      entityType: entity.type
    };
  }
}
