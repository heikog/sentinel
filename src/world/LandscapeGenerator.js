import { Landscape } from './Landscape.js';
import { SeededRandom } from '../utils/SeededRandom.js';
import { LANDSCAPE, LEVELS } from '../config.js';

export class LandscapeGenerator {
  constructor(levelNumber) {
    this.levelNumber = levelNumber;
    // Create seed from level number (8-digit code)
    this.seed = this.levelToSeed(levelNumber);
    this.rng = new SeededRandom(this.seed);
  }

  // Convert level number to 8-digit seed
  levelToSeed(level) {
    // Simple transformation to create varied seeds
    // Multiply by large prime and add offset for variation
    return ((level * 2654435761) ^ 0xDEADBEEF) >>> 0;
  }

  // Get 8-digit display code for level
  getLevelCode() {
    return this.seed.toString().padStart(8, '0').slice(0, 8);
  }

  generate() {
    const landscape = new Landscape(LANDSCAPE.GRID_SIZE, LANDSCAPE.GRID_SIZE);

    // Generate terrain heights
    this.generateTerrain(landscape);

    // Ensure there's a clear highest point for the Sentinel
    this.createSentinelPlatform(landscape);

    // Set player start position
    this.setPlayerStart(landscape);

    // Place trees
    this.placeTrees(landscape);

    return landscape;
  }

  generateTerrain(landscape) {
    const width = landscape.width;
    const depth = landscape.depth;

    // Use value noise for terrain generation
    // Lower levels = flatter terrain, higher levels = more varied

    const baseVariation = Math.min(3 + Math.floor(this.levelNumber / 500), 10);
    const peakChance = 0.02 + (this.levelNumber / LEVELS.TOTAL_LEVELS) * 0.08;

    // Generate base heights with some randomness
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        // Create gentle rolling hills using simple noise
        const noiseVal = this.simpleNoise(x, z);
        let height = Math.floor(noiseVal * baseVariation);

        // Occasional peaks
        if (this.rng.nextBool(peakChance)) {
          height += this.rng.nextInt(2, 5);
        }

        // Clamp height
        height = Math.max(0, Math.min(height, LANDSCAPE.MAX_HEIGHT - 3));

        landscape.setHeight(x, z, height);
      }
    }

    // Smooth the terrain slightly
    this.smoothTerrain(landscape, 1);
  }

  // Simple coherent noise using interpolation
  simpleNoise(x, z) {
    const scale = 0.15;
    const x0 = Math.floor(x * scale);
    const z0 = Math.floor(z * scale);
    const x1 = x0 + 1;
    const z1 = z0 + 1;

    // Get random values at corners
    const v00 = this.hashNoise(x0, z0);
    const v10 = this.hashNoise(x1, z0);
    const v01 = this.hashNoise(x0, z1);
    const v11 = this.hashNoise(x1, z1);

    // Interpolate
    const fx = (x * scale) - x0;
    const fz = (z * scale) - z0;

    // Smooth interpolation
    const sx = fx * fx * (3 - 2 * fx);
    const sz = fz * fz * (3 - 2 * fz);

    const top = v00 * (1 - sx) + v10 * sx;
    const bottom = v01 * (1 - sx) + v11 * sx;

    return top * (1 - sz) + bottom * sz;
  }

  // Hash-based noise for given coordinates
  hashNoise(x, z) {
    const n = x + z * 57 + this.seed;
    const hash = ((n * 15731 + 789221) * n + 1376312589) & 0x7fffffff;
    return hash / 0x7fffffff;
  }

  // Smooth terrain by averaging with neighbors
  smoothTerrain(landscape, iterations) {
    for (let i = 0; i < iterations; i++) {
      const newHeights = [];

      for (let x = 0; x < landscape.width; x++) {
        newHeights[x] = [];
        for (let z = 0; z < landscape.depth; z++) {
          let sum = landscape.getHeight(x, z) * 2;  // Weight center
          let count = 2;

          // Add neighbors
          for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
              if (dx === 0 && dz === 0) continue;
              const nx = x + dx;
              const nz = z + dz;
              if (nx >= 0 && nx < landscape.width && nz >= 0 && nz < landscape.depth) {
                sum += landscape.getHeight(nx, nz);
                count++;
              }
            }
          }

          newHeights[x][z] = Math.round(sum / count);
        }
      }

      // Apply smoothed heights
      for (let x = 0; x < landscape.width; x++) {
        for (let z = 0; z < landscape.depth; z++) {
          landscape.setHeight(x, z, newHeights[x][z]);
        }
      }
    }
  }

  createSentinelPlatform(landscape) {
    // Find a good location for the Sentinel (should be visible from much of the map)
    // Place it somewhere in the middle-ish area, but create the highest point

    const centerX = Math.floor(landscape.width / 2);
    const centerZ = Math.floor(landscape.depth / 2);

    // Randomize position a bit from center
    const sentinelX = centerX + this.rng.nextInt(-8, 8);
    const sentinelZ = centerZ + this.rng.nextInt(-8, 8);

    // Clamp to valid range
    const sx = Math.max(2, Math.min(sentinelX, landscape.width - 3));
    const sz = Math.max(2, Math.min(sentinelZ, landscape.depth - 3));

    // Get current max height and make Sentinel platform higher
    const highPoint = landscape.findHighestPoint();
    const sentinelHeight = Math.min(highPoint.height + 3 + this.rng.nextInt(0, 2), LANDSCAPE.MAX_HEIGHT);

    // Create platform (single high square)
    landscape.setHeight(sx, sz, sentinelHeight);

    // Maybe add some surrounding lower squares for approach
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dz === 0) continue;
        const nx = sx + dx;
        const nz = sz + dz;
        if (nx >= 0 && nx < landscape.width && nz >= 0 && nz < landscape.depth) {
          const currentHeight = landscape.getHeight(nx, nz);
          const newHeight = Math.max(currentHeight, sentinelHeight - 2 - this.rng.nextInt(0, 2));
          landscape.setHeight(nx, nz, Math.min(newHeight, sentinelHeight - 1));
        }
      }
    }

    landscape.setSentinelPosition(sx, sz);
  }

  setPlayerStart(landscape) {
    // Find a suitable starting position
    // Should be at a low point, away from the Sentinel

    const sentinelPos = landscape.getSentinelPosition();

    // Find squares at lower heights, far from Sentinel
    let bestX = 0;
    let bestZ = 0;
    let bestScore = -Infinity;

    for (let x = 0; x < landscape.width; x++) {
      for (let z = 0; z < landscape.depth; z++) {
        const height = landscape.getHeight(x, z);

        // Distance from Sentinel
        const dx = x - sentinelPos.x;
        const dz = z - sentinelPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        // Score: prefer low height and far distance
        // But not at the very edge
        const edgeDist = Math.min(x, z, landscape.width - 1 - x, landscape.depth - 1 - z);
        const score = dist * 2 - height * 3 + edgeDist;

        if (score > bestScore) {
          bestScore = score;
          bestX = x;
          bestZ = z;
        }
      }
    }

    landscape.setPlayerStartPosition(bestX, bestZ);
  }

  placeTrees(landscape) {
    // Calculate number of trees based on level
    const baseCount = LEVELS.TREES_MIN;
    const maxExtra = LEVELS.TREES_MAX - LEVELS.TREES_MIN;
    const treeCount = baseCount + this.rng.nextInt(0, maxExtra);

    const sentinelPos = landscape.getSentinelPosition();
    const playerStart = landscape.getPlayerStartPosition();

    let placed = 0;
    let attempts = 0;
    const maxAttempts = treeCount * 10;

    while (placed < treeCount && attempts < maxAttempts) {
      attempts++;

      const x = this.rng.nextInt(0, landscape.width - 1);
      const z = this.rng.nextInt(0, landscape.depth - 1);

      // Don't place on Sentinel position or player start
      if (x === sentinelPos.x && z === sentinelPos.z) continue;
      if (x === playerStart.x && z === playerStart.z) continue;

      const square = landscape.getSquare(x, z);
      if (square && square.isEmpty()) {
        // Mark for tree placement (actual entity created later)
        square.hasTree = true;
        placed++;
      }
    }

    return placed;
  }

  // Calculate number of sentries for this level
  getSentryCount() {
    return Math.floor(this.levelNumber / 1000) + LEVELS.SENTRIES_BASE;
  }
}
