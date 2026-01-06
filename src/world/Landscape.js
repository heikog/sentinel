import { Square } from './Square.js';
import { LANDSCAPE, COLORS } from '../config.js';
import * as THREE from 'three';

export class Landscape {
  constructor(width = LANDSCAPE.GRID_SIZE, depth = LANDSCAPE.GRID_SIZE) {
    this.width = width;
    this.depth = depth;
    this.squares = [];

    // Sentinel position
    this.sentinelX = 0;
    this.sentinelZ = 0;

    // Player start position
    this.playerStartX = 0;
    this.playerStartZ = 0;

    // Initialize grid
    this.initGrid();
  }

  initGrid() {
    this.squares = [];
    for (let x = 0; x < this.width; x++) {
      this.squares[x] = [];
      for (let z = 0; z < this.depth; z++) {
        this.squares[x][z] = new Square(x, z, 0);
      }
    }
  }

  // Get square at grid position
  getSquare(x, z) {
    if (x < 0 || x >= this.width || z < 0 || z >= this.depth) {
      return null;
    }
    return this.squares[x][z];
  }

  // Set height at grid position
  setHeight(x, z, height) {
    const square = this.getSquare(x, z);
    if (square) {
      square.height = Math.max(0, Math.min(height, LANDSCAPE.MAX_HEIGHT));
    }
  }

  // Get height at grid position
  getHeight(x, z) {
    const square = this.getSquare(x, z);
    return square ? square.height : 0;
  }

  // Convert grid coordinates to world coordinates
  gridToWorld(gridX, gridZ) {
    const offsetX = (this.width * LANDSCAPE.SQUARE_SIZE) / 2;
    const offsetZ = (this.depth * LANDSCAPE.SQUARE_SIZE) / 2;
    return {
      x: (gridX + 0.5) * LANDSCAPE.SQUARE_SIZE - offsetX,
      z: (gridZ + 0.5) * LANDSCAPE.SQUARE_SIZE - offsetZ
    };
  }

  // Convert world coordinates to grid coordinates
  worldToGrid(worldX, worldZ) {
    const offsetX = (this.width * LANDSCAPE.SQUARE_SIZE) / 2;
    const offsetZ = (this.depth * LANDSCAPE.SQUARE_SIZE) / 2;
    return {
      x: Math.floor((worldX + offsetX) / LANDSCAPE.SQUARE_SIZE),
      z: Math.floor((worldZ + offsetZ) / LANDSCAPE.SQUARE_SIZE)
    };
  }

  // Get world Y position for a given height level
  heightToWorldY(heightLevel) {
    return heightLevel * LANDSCAPE.HEIGHT_UNIT;
  }

  // Set sentinel position
  setSentinelPosition(x, z) {
    this.sentinelX = x;
    this.sentinelZ = z;
  }

  // Get sentinel position
  getSentinelPosition() {
    return { x: this.sentinelX, z: this.sentinelZ };
  }

  // Set player start position
  setPlayerStartPosition(x, z) {
    this.playerStartX = x;
    this.playerStartZ = z;
  }

  // Get player start position
  getPlayerStartPosition() {
    return { x: this.playerStartX, z: this.playerStartZ };
  }

  // Find highest point on the landscape
  findHighestPoint() {
    let maxHeight = -1;
    let highX = 0;
    let highZ = 0;

    for (let x = 0; x < this.width; x++) {
      for (let z = 0; z < this.depth; z++) {
        const height = this.squares[x][z].height;
        if (height > maxHeight) {
          maxHeight = height;
          highX = x;
          highZ = z;
        }
      }
    }

    return { x: highX, z: highZ, height: maxHeight };
  }

  // Find lowest point on the landscape
  findLowestPoint() {
    let minHeight = Infinity;
    let lowX = 0;
    let lowZ = 0;

    for (let x = 0; x < this.width; x++) {
      for (let z = 0; z < this.depth; z++) {
        const height = this.squares[x][z].height;
        if (height < minHeight) {
          minHeight = height;
          lowX = x;
          lowZ = z;
        }
      }
    }

    return { x: lowX, z: lowZ, height: minHeight };
  }

  // Get all empty squares at a given height or lower
  getEmptySquaresAtOrBelow(maxHeight) {
    const result = [];
    for (let x = 0; x < this.width; x++) {
      for (let z = 0; z < this.depth; z++) {
        const square = this.squares[x][z];
        if (square.isEmpty() && square.height <= maxHeight) {
          result.push({ x, z, height: square.height });
        }
      }
    }
    return result;
  }

  // Create Three.js mesh for the landscape
  createMesh() {
    const group = new THREE.Group();

    for (let x = 0; x < this.width; x++) {
      for (let z = 0; z < this.depth; z++) {
        const square = this.squares[x][z];
        const mesh = this.createSquareMesh(x, z, square.height);
        square.mesh = mesh;
        group.add(mesh);
      }
    }

    return group;
  }

  createSquareMesh(gridX, gridZ, height) {
    // Create a column from ground to the top
    const worldPos = this.gridToWorld(gridX, gridZ);
    const topY = height * LANDSCAPE.HEIGHT_UNIT;

    // Checkerboard coloring
    const isLight = (gridX + gridZ) % 2 === 0;
    const color = isLight ? COLORS.GROUND_LIGHT : COLORS.GROUND_DARK;

    // Create box geometry for the platform top
    const geometry = new THREE.BoxGeometry(
      LANDSCAPE.SQUARE_SIZE * 0.98,  // Slightly smaller for visible grid
      LANDSCAPE.HEIGHT_UNIT,
      LANDSCAPE.SQUARE_SIZE * 0.98
    );

    const material = new THREE.MeshLambertMaterial({
      color: color,
      flatShading: true
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      worldPos.x,
      topY - LANDSCAPE.HEIGHT_UNIT / 2,
      worldPos.z
    );

    // If height > 0, add sides
    if (height > 0) {
      const sideGroup = new THREE.Group();

      // Create column beneath the top
      const columnGeometry = new THREE.BoxGeometry(
        LANDSCAPE.SQUARE_SIZE * 0.98,
        topY - LANDSCAPE.HEIGHT_UNIT,
        LANDSCAPE.SQUARE_SIZE * 0.98
      );

      const sideMaterial = new THREE.MeshLambertMaterial({
        color: isLight ? 0x006060 : 0x004040,  // Darker for sides
        flatShading: true
      });

      const column = new THREE.Mesh(columnGeometry, sideMaterial);
      column.position.set(
        worldPos.x,
        (topY - LANDSCAPE.HEIGHT_UNIT) / 2,
        worldPos.z
      );

      sideGroup.add(mesh);
      sideGroup.add(column);

      return sideGroup;
    }

    return mesh;
  }

  // Iterator for all squares
  *[Symbol.iterator]() {
    for (let x = 0; x < this.width; x++) {
      for (let z = 0; z < this.depth; z++) {
        yield { x, z, square: this.squares[x][z] };
      }
    }
  }
}
