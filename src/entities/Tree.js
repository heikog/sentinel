import { Entity } from './Entity.js';
import { ENERGY } from '../config.js';

export class Tree extends Entity {
  constructor(gridX, gridZ) {
    super(gridX, gridZ, 'tree');
    this.energy = ENERGY.TREE;
  }
}
