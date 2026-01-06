// Represents a single square on the landscape grid

export class Square {
  constructor(x, z, height = 0) {
    this.x = x;
    this.z = z;
    this.height = height;

    // Entity on this square (null if empty)
    this.entity = null;

    // Stack of boulders (can have multiple)
    this.boulderStack = [];

    // Entity on top of boulder stack
    this.topEntity = null;

    // Visibility flags for optimization
    this.visibleFromSentinel = false;
    this.visibleFromPlayer = false;

    // Mesh reference for the terrain square
    this.mesh = null;
  }

  // Get the effective height (terrain + boulders)
  getEffectiveHeight() {
    return this.height + this.boulderStack.length;
  }

  // Get the top surface height in world units
  getTopHeight(heightUnit = 0.5) {
    return this.getEffectiveHeight() * heightUnit;
  }

  // Check if square is empty (no entities, no boulders)
  isEmpty() {
    return this.entity === null &&
           this.boulderStack.length === 0 &&
           this.topEntity === null;
  }

  // Check if we can place something on the ground level
  canPlaceOnGround() {
    return this.entity === null;
  }

  // Check if we can place something on top of boulder stack
  canPlaceOnTop() {
    return this.boulderStack.length > 0 && this.topEntity === null;
  }

  // Place entity on ground
  placeEntity(entity) {
    if (this.entity !== null) {
      return false;
    }
    this.entity = entity;
    entity.gridX = this.x;
    entity.gridZ = this.z;
    entity.stackHeight = 0;
    return true;
  }

  // Add boulder to stack
  addBoulder(boulder) {
    this.boulderStack.push(boulder);
    boulder.gridX = this.x;
    boulder.gridZ = this.z;
    boulder.stackHeight = this.boulderStack.length;
    return true;
  }

  // Place entity on top of boulder stack
  placeOnTop(entity) {
    if (this.boulderStack.length === 0 || this.topEntity !== null) {
      return false;
    }
    this.topEntity = entity;
    entity.gridX = this.x;
    entity.gridZ = this.z;
    entity.stackHeight = this.boulderStack.length;
    return true;
  }

  // Remove ground entity
  removeEntity() {
    const entity = this.entity;
    this.entity = null;
    return entity;
  }

  // Remove top boulder from stack
  removeBoulder() {
    if (this.boulderStack.length === 0) {
      return null;
    }
    // First remove top entity if any
    if (this.topEntity) {
      this.topEntity = null;
    }
    return this.boulderStack.pop();
  }

  // Remove top entity
  removeTopEntity() {
    const entity = this.topEntity;
    this.topEntity = null;
    return entity;
  }

  // Get all entities on this square (for energy calculation)
  getAllEntities() {
    const entities = [];
    if (this.entity) entities.push(this.entity);
    entities.push(...this.boulderStack);
    if (this.topEntity) entities.push(this.topEntity);
    return entities;
  }

  // Get total energy on this square
  getTotalEnergy() {
    return this.getAllEntities().reduce((sum, e) => sum + (e.energy || 0), 0);
  }

  // Check if there's something to absorb
  hasAbsorbableContent() {
    // Check entity (skip if removed)
    if (this.entity !== null && !this.entity.removed) {
      return true;
    }
    // Check boulders (filter out removed ones)
    if (this.boulderStack.some(b => b && !b.removed)) {
      return true;
    }
    // Check top entity (skip if removed)
    if (this.topEntity !== null && !this.topEntity.removed) {
      return true;
    }
    return false;
  }

  // Clean up stale references to removed entities
  cleanupRemovedEntities() {
    if (this.entity && this.entity.removed) {
      this.entity = null;
    }
    if (this.topEntity && this.topEntity.removed) {
      this.topEntity = null;
    }
    // Filter out removed boulders
    this.boulderStack = this.boulderStack.filter(b => b && !b.removed);
  }
}
