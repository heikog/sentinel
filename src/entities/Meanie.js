import { Entity } from './Entity.js';
import { TIMING } from '../config.js';
import { soundSystem } from '../audio/SoundSystem.js';

export class Meanie extends Entity {
  constructor(gridX, gridZ) {
    super(gridX, gridZ, 'meanie');
    this.energy = 1;  // Meanies are worth 1 energy (like trees)

    // Rotation angle (radians)
    this.rotation = 0;

    // Meanies spin fast
    this.rotationSpeed = TIMING.MEANIE_ROTATION_SPEED;

    // How long the meanie has been spinning
    this.lifeTime = 0;

    // Max lifetime before reverting to tree
    this.maxLifeTime = 4.0;  // seconds

    // Has it found the player?
    this.foundPlayer = false;

    // Should despawn (turn back into tree)
    this.shouldDespawn = false;

    // Meanies can't be absorbed
    this.absorbable = false;

    // Track total rotation
    this.totalRotation = 0;

    // Sound timing - clicking sound
    this.soundTimer = 0;
    this.soundInterval = 0.15;  // Click every 150ms

    // Play creation sound
    soundSystem.playMeanieCreate();
  }

  update(deltaTime) {
    // Fast spinning
    this.rotation += this.rotationSpeed * deltaTime;
    this.totalRotation += this.rotationSpeed * deltaTime;

    // Keep in 0-2PI range
    while (this.rotation > Math.PI * 2) {
      this.rotation -= Math.PI * 2;
    }

    // Play clicking sound (less frequently to avoid audio overload)
    this.soundTimer += deltaTime;
    if (this.soundTimer >= this.soundInterval) {
      try {
        soundSystem.playMeanieClick();
      } catch (e) {
        // Ignore audio errors
      }
      this.soundTimer = 0;
    }

    // Update mesh rotation
    if (this.mesh) {
      this.mesh.rotation.y = this.rotation;
    }

    // Track lifetime
    this.lifeTime += deltaTime;

    // Check if completed a full rotation without finding player
    if (this.totalRotation >= Math.PI * 2 && !this.foundPlayer) {
      this.shouldDespawn = true;
    }

    // Also despawn if exceeded max lifetime
    if (this.lifeTime >= this.maxLifeTime) {
      this.shouldDespawn = true;
    }
  }

  // Called when meanie spots the player
  spotPlayer() {
    this.foundPlayer = true;
  }

  // Check if meanie is facing a direction (for scanning)
  isFacing(targetX, targetZ) {
    const dx = targetX - this.gridX;
    const dz = targetZ - this.gridZ;
    const targetAngle = Math.atan2(dx, dz);

    let angleDiff = targetAngle - this.rotation;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // Narrower field of view than Sentinel
    return Math.abs(angleDiff) < Math.PI / 6;
  }
}
