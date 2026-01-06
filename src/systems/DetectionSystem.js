import { LANDSCAPE, TIMING } from '../config.js';

export class DetectionSystem {
  constructor(level, player) {
    this.level = level;
    this.player = player;

    // Detection state
    this.drainTimer = 0;
    this.drainActive = false;
  }

  update(deltaTime) {
    // Check all viewers (Sentinel and Sentries)
    let maxDetectionLevel = 0;

    // Check Sentinel
    if (this.level.sentinel) {
      const detection = this.checkDetection(this.level.sentinel);
      maxDetectionLevel = Math.max(maxDetectionLevel, detection);
    }

    // Check Sentries
    for (const sentry of this.level.sentries) {
      const detection = this.checkDetection(sentry);
      maxDetectionLevel = Math.max(maxDetectionLevel, detection);
    }

    // Update player detection state
    this.player.setDetectionLevel(maxDetectionLevel);

    // Handle energy drain
    if (maxDetectionLevel === 2) {
      this.drainTimer += deltaTime;

      // Grace period before draining starts
      if (this.drainTimer > TIMING.DETECTION_GRACE_PERIOD) {
        this.drainActive = true;

        // Drain energy
        const drained = this.player.removeEnergy(deltaTime * TIMING.ABSORPTION_RATE);

        if (!drained) {
          // Player has no energy left - game over
          return { gameOver: true, reason: 'absorbed' };
        }
      }
    } else {
      this.drainTimer = 0;
      this.drainActive = false;
    }

    // Handle partial detection (spawn meanies)
    if (maxDetectionLevel === 1 && this.level.meanies.length === 0) {
      // Find nearby tree to transform into meanie
      this.trySpawnMeanie();
    }

    return { gameOver: false };
  }

  // Check if a viewer can see the player
  // Returns: 0 = not seen, 1 = head seen (partial), 2 = square seen (full)
  checkDetection(viewer) {
    const landscape = this.level.landscape;

    // Get viewer position and facing
    const viewerSquare = landscape.getSquare(viewer.gridX, viewer.gridZ);
    if (!viewerSquare) return 0;

    const viewerWorld = landscape.gridToWorld(viewer.gridX, viewer.gridZ);
    const viewerY = viewerSquare.height * LANDSCAPE.HEIGHT_UNIT + 1.5;

    // Get player position
    const playerSquare = landscape.getSquare(this.player.gridX, this.player.gridZ);
    if (!playerSquare) return 0;

    const playerWorld = landscape.gridToWorld(this.player.gridX, this.player.gridZ);
    const playerSquareY = playerSquare.height * LANDSCAPE.HEIGHT_UNIT;
    const playerHeadY = playerSquareY + this.player.stackHeight * LANDSCAPE.HEIGHT_UNIT + 0.8;

    // Check if player is in viewer's field of view
    const dx = playerWorld.x - viewerWorld.x;
    const dz = playerWorld.z - viewerWorld.z;
    const angleToPlayer = Math.atan2(dx, dz);

    let angleDiff = angleToPlayer - viewer.rotation;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // Field of view is approximately 90 degrees (PI/2)
    if (Math.abs(angleDiff) > Math.PI / 4) {
      return 0;  // Player not in field of view
    }

    // Check line of sight to player's square
    const canSeeSquare = this.checkLineOfSight(
      viewerWorld.x, viewerY, viewerWorld.z,
      playerWorld.x, playerSquareY, playerWorld.z
    );

    if (canSeeSquare) {
      return 2;  // Full detection
    }

    // Check line of sight to player's head
    const canSeeHead = this.checkLineOfSight(
      viewerWorld.x, viewerY, viewerWorld.z,
      playerWorld.x, playerHeadY, playerWorld.z
    );

    if (canSeeHead) {
      return 1;  // Partial detection
    }

    return 0;  // Not detected
  }

  // Check line of sight between two 3D points
  checkLineOfSight(fromX, fromY, fromZ, toX, toY, toZ) {
    const landscape = this.level.landscape;

    const dx = toX - fromX;
    const dy = toY - fromY;
    const dz = toZ - fromZ;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < 0.1) return true;

    const steps = Math.ceil(distance / LANDSCAPE.SQUARE_SIZE);

    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const checkX = fromX + dx * t;
      const checkY = fromY + dy * t;
      const checkZ = fromZ + dz * t;

      const gridPos = landscape.worldToGrid(checkX, checkZ);
      const checkSquare = landscape.getSquare(gridPos.x, gridPos.z);

      if (checkSquare) {
        // Check terrain height
        const terrainHeight = checkSquare.height * LANDSCAPE.HEIGHT_UNIT;
        if (terrainHeight > checkY) {
          return false;  // Blocked by terrain
        }

        // Check boulder stack height
        const stackHeight = checkSquare.getTopHeight(LANDSCAPE.HEIGHT_UNIT);
        if (stackHeight > checkY) {
          return false;  // Blocked by boulders
        }
      }
    }

    return true;
  }

  // Try to spawn a meanie from a nearby tree
  trySpawnMeanie() {
    // Find trees near the player
    const landscape = this.level.landscape;
    const nearbyTrees = [];

    const searchRadius = 5;
    for (let dx = -searchRadius; dx <= searchRadius; dx++) {
      for (let dz = -searchRadius; dz <= searchRadius; dz++) {
        const x = this.player.gridX + dx;
        const z = this.player.gridZ + dz;
        const square = landscape.getSquare(x, z);

        if (square && square.entity && square.entity.type === 'tree' && !square.entity.removed) {
          const dist = Math.sqrt(dx * dx + dz * dz);
          nearbyTrees.push({ entity: square.entity, distance: dist });
        }
      }
    }

    if (nearbyTrees.length === 0) return;

    // Sort by distance and pick closest
    nearbyTrees.sort((a, b) => a.distance - b.distance);
    const tree = nearbyTrees[0].entity;

    // Transform tree into meanie
    this.transformToMeanie(tree);
  }

  transformToMeanie(tree) {
    // Safety check - make sure tree is still valid
    if (!tree || tree.removed) return;

    const gridX = tree.gridX;
    const gridZ = tree.gridZ;

    // Remove tree
    this.level.removeEntity(tree);

    // Create meanie at same position
    const meanie = this.level.createEntity('meanie', gridX, gridZ, 0);
    if (meanie) {
      this.level.meanies.push(meanie);
    }
  }

  // Reset detection state (for new level)
  reset() {
    this.drainTimer = 0;
    this.drainActive = false;
  }
}
