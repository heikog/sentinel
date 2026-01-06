import { Entity } from './Entity.js';
import { ENERGY } from '../config.js';

export class Robot extends Entity {
  constructor(gridX, gridZ, isPlayer = false) {
    super(gridX, gridZ, 'robot');
    this.energy = ENERGY.ROBOT;
    this.isPlayer = isPlayer;

    // If this is the player's current robot, it's not absorbable
    // (player would need to transfer out first)
    this.absorbable = !isPlayer;
  }

  // Mark as player's current robot
  setAsPlayer(isPlayer) {
    this.isPlayer = isPlayer;
    this.absorbable = !isPlayer;
  }
}
