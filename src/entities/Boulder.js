import { Entity } from './Entity.js';
import { ENERGY } from '../config.js';

export class Boulder extends Entity {
  constructor(gridX, gridZ) {
    super(gridX, gridZ, 'boulder');
    this.energy = ENERGY.BOULDER;
  }
}
