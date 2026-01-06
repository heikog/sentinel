import { Entity } from './Entity.js';
import { ENERGY, TIMING } from '../config.js';
import { soundSystem } from '../audio/SoundSystem.js';

export class Sentinel extends Entity {
  constructor(gridX, gridZ) {
    super(gridX, gridZ, 'sentinel');
    this.energy = ENERGY.SENTINEL;

    // Rotation angle (radians)
    this.rotation = 0;

    // Rotation speed (radians per second)
    this.rotationSpeed = TIMING.SENTINEL_ROTATION_SPEED;

    // Is currently draining a target
    this.isDraining = false;
    this.drainTarget = null;

    // The Sentinel cannot be absorbed until player is high enough
    this.absorbable = true;

    // Sound timing - play creaky bleep every ~30 degrees (0.52 radians)
    this.lastSoundRotation = 0;
    this.soundInterval = Math.PI / 6;  // ~30 degrees
  }

  update(deltaTime) {
    if (!this.isDraining) {
      const prevRotation = this.rotation;

      // Slow continuous rotation
      this.rotation += this.rotationSpeed * deltaTime;

      // Keep in 0-2PI range
      while (this.rotation > Math.PI * 2) {
        this.rotation -= Math.PI * 2;
        this.lastSoundRotation = 0;
      }

      // Play creaky sound at intervals
      if (this.rotation - this.lastSoundRotation >= this.soundInterval) {
        soundSystem.playSentinelRotate();
        this.lastSoundRotation = this.rotation;
      }

      // Update mesh rotation
      if (this.mesh) {
        this.mesh.rotation.y = this.rotation;
      }
    }
  }

  // Start draining a target
  startDraining(target) {
    this.isDraining = true;
    this.drainTarget = target;
  }

  // Stop draining
  stopDraining() {
    this.isDraining = false;
    this.drainTarget = null;
  }

  // Get current facing direction as unit vector
  getFacingDirection() {
    return {
      x: Math.sin(this.rotation),
      z: Math.cos(this.rotation)
    };
  }
}
