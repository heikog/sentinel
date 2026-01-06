import { Entity } from './Entity.js';
import { ENERGY, TIMING } from '../config.js';
import { soundSystem } from '../audio/SoundSystem.js';

export class Sentry extends Entity {
  constructor(gridX, gridZ) {
    super(gridX, gridZ, 'sentry');
    this.energy = ENERGY.SENTRY;

    // Rotation angle (radians)
    this.rotation = 0;

    // Sentries rotate slightly faster than the Sentinel
    this.rotationSpeed = TIMING.SENTRY_ROTATION_SPEED;

    // Is currently draining a target
    this.isDraining = false;
    this.drainTarget = null;

    // Sound timing - play creaky bleep every ~30 degrees
    this.lastSoundRotation = 0;
    this.soundInterval = Math.PI / 6;
  }

  update(deltaTime) {
    if (!this.isDraining) {
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
