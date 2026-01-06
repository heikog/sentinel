// Base class for all game entities

export class Entity {
  constructor(gridX, gridZ, type) {
    this.gridX = gridX;
    this.gridZ = gridZ;
    this.type = type;

    // Energy value of this entity
    this.energy = 0;

    // Stack height (0 = ground, >0 = on boulders)
    this.stackHeight = 0;

    // Three.js mesh reference
    this.mesh = null;

    // Is this entity absorbable?
    this.absorbable = true;
  }

  // Update entity (override in subclasses)
  update(deltaTime) {
    // Base implementation does nothing
  }

  // Get world position
  getWorldPosition() {
    if (this.mesh) {
      return {
        x: this.mesh.position.x,
        y: this.mesh.position.y,
        z: this.mesh.position.z
      };
    }
    return { x: 0, y: 0, z: 0 };
  }

  // Set world position
  setWorldPosition(x, y, z) {
    if (this.mesh) {
      this.mesh.position.set(x, y, z);
    }
  }

  // Dispose of resources
  dispose() {
    if (this.mesh) {
      if (this.mesh.geometry) {
        this.mesh.geometry.dispose();
      }
      if (this.mesh.material) {
        if (Array.isArray(this.mesh.material)) {
          this.mesh.material.forEach(m => m.dispose());
        } else {
          this.mesh.material.dispose();
        }
      }
    }
  }
}
