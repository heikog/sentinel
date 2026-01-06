import { Tree } from '../entities/Tree.js';
import { Boulder } from '../entities/Boulder.js';
import { Robot } from '../entities/Robot.js';
import { Sentinel } from '../entities/Sentinel.js';
import { Sentry } from '../entities/Sentry.js';
import { Meanie } from '../entities/Meanie.js';
import { LANDSCAPE, TIMING } from '../config.js';

export class Level {
  constructor(landscape, renderer, meshFactory) {
    this.landscape = landscape;
    this.renderer = renderer;
    this.meshFactory = meshFactory;

    // All entities in the level
    this.entities = [];

    // Special entity references
    this.sentinel = null;
    this.sentries = [];
    this.playerRobot = null;
    this.meanies = [];

    // Landscape mesh group
    this.landscapeMesh = null;
  }

  build() {
    // Create landscape mesh
    this.landscapeMesh = this.landscape.createMesh();
    this.renderer.add(this.landscapeMesh);

    // Create Sentinel
    this.createSentinel();

    // Create trees from marked squares
    this.createTrees();

    // Create player's starting robot
    this.createPlayerRobot();
  }

  createSentinel() {
    const pos = this.landscape.getSentinelPosition();
    const square = this.landscape.getSquare(pos.x, pos.z);

    this.sentinel = new Sentinel(pos.x, pos.z);
    this.sentinel.mesh = this.meshFactory.createSentinel();

    // Position in world - add to mesh's internal y offset
    const worldPos = this.landscape.gridToWorld(pos.x, pos.z);
    const baseHeight = square.height * LANDSCAPE.HEIGHT_UNIT;
    this.sentinel.mesh.position.x = worldPos.x;
    this.sentinel.mesh.position.z = worldPos.z;
    this.sentinel.mesh.position.y += baseHeight;

    // Store entity reference on mesh for raycasting
    this.sentinel.mesh.userData.entity = this.sentinel;

    this.renderer.add(this.sentinel.mesh);
    this.entities.push(this.sentinel);

    // Place on square
    square.placeEntity(this.sentinel);
  }

  createTrees() {
    for (const { x, z, square } of this.landscape) {
      if (square.hasTree) {
        const tree = new Tree(x, z);
        tree.mesh = this.meshFactory.createTree();

        // Position in world - add to mesh's internal y offset
        const worldPos = this.landscape.gridToWorld(x, z);
        const baseHeight = square.height * LANDSCAPE.HEIGHT_UNIT;
        tree.mesh.position.x = worldPos.x;
        tree.mesh.position.z = worldPos.z;
        tree.mesh.position.y += baseHeight;

        // Store entity reference on mesh for raycasting
        tree.mesh.userData.entity = tree;

        this.renderer.add(tree.mesh);
        this.entities.push(tree);

        // Place on square
        square.placeEntity(tree);
        square.hasTree = false;  // Clear marker
      }
    }
  }

  createPlayerRobot() {
    const pos = this.landscape.getPlayerStartPosition();
    const square = this.landscape.getSquare(pos.x, pos.z);

    this.playerRobot = new Robot(pos.x, pos.z, true);  // isPlayer = true
    this.playerRobot.mesh = this.meshFactory.createRobot(true);

    // Position in world - add to mesh's internal y offset
    const worldPos = this.landscape.gridToWorld(pos.x, pos.z);
    const baseHeight = square.height * LANDSCAPE.HEIGHT_UNIT;
    this.playerRobot.mesh.position.x = worldPos.x;
    this.playerRobot.mesh.position.z = worldPos.z;
    this.playerRobot.mesh.position.y += baseHeight;

    // Store entity reference on mesh for raycasting
    this.playerRobot.mesh.userData.entity = this.playerRobot;

    this.renderer.add(this.playerRobot.mesh);
    this.entities.push(this.playerRobot);

    // Note: Don't place on square as player occupies it differently
  }

  update(deltaTime, player) {
    // Update Sentinel rotation and scanning
    if (this.sentinel) {
      this.sentinel.update(deltaTime);
      this.updateSentinelScanning(player);
    }

    // Update sentries
    for (const sentry of this.sentries) {
      sentry.update(deltaTime);
    }

    // Update meanies (collect despawned ones first to avoid modifying array during iteration)
    const meaniesSnapshot = [...this.meanies];
    for (const meanie of meaniesSnapshot) {
      meanie.update(deltaTime);
    }
    // Remove despawned meanies after iteration
    for (const meanie of meaniesSnapshot) {
      if (meanie.shouldDespawn) {
        this.removeMeanie(meanie);
      }
    }
  }

  updateSentinelScanning(player) {
    // Check if Sentinel can see player
    const canSeeSquare = this.checkLineOfSight(
      this.sentinel,
      player.gridX,
      player.gridZ,
      true  // Check square visibility
    );

    const canSeeHead = this.checkLineOfSight(
      this.sentinel,
      player.gridX,
      player.gridZ,
      false  // Check head visibility
    );

    if (canSeeSquare) {
      player.setDetectionLevel(2);  // Full detection
    } else if (canSeeHead) {
      player.setDetectionLevel(1);  // Partial detection
    } else {
      player.setDetectionLevel(0);  // Safe
    }
  }

  checkLineOfSight(viewer, targetX, targetZ, checkSquare) {
    // Get viewer position
    const viewerSquare = this.landscape.getSquare(viewer.gridX, viewer.gridZ);
    if (!viewerSquare) return false;

    const viewerWorldPos = this.landscape.gridToWorld(viewer.gridX, viewer.gridZ);
    const viewerHeight = viewerSquare.height * LANDSCAPE.HEIGHT_UNIT + 1.5;  // Eye height

    // Get target position
    const targetSquare = this.landscape.getSquare(targetX, targetZ);
    if (!targetSquare) return false;

    const targetWorldPos = this.landscape.gridToWorld(targetX, targetZ);

    // Check based on what we're looking at
    let targetHeight;
    if (checkSquare) {
      // Need to see the square itself (ground level)
      targetHeight = targetSquare.height * LANDSCAPE.HEIGHT_UNIT;
    } else {
      // Just need to see the head (above ground)
      targetHeight = targetSquare.height * LANDSCAPE.HEIGHT_UNIT + 0.8;
    }

    // Check if target is in viewer's current facing direction (simplified)
    // Full implementation would use proper raycasting
    const dx = targetWorldPos.x - viewerWorldPos.x;
    const dz = targetWorldPos.z - viewerWorldPos.z;
    const angle = Math.atan2(dx, dz);

    // Check if angle is within viewer's current facing direction (based on rotation)
    const viewerAngle = viewer.rotation || 0;
    let angleDiff = angle - viewerAngle;

    // Normalize to -PI to PI
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // Field of view check (roughly 90 degrees in front)
    if (Math.abs(angleDiff) > Math.PI / 4) {
      return false;
    }

    // Height check - viewer must be able to see down to target
    const distance = Math.sqrt(dx * dx + dz * dz);
    if (distance < 0.1) return true;  // Same square

    // Simple height ray check
    const heightDiff = viewerHeight - targetHeight;
    const slope = heightDiff / distance;

    // Check intermediate squares for obstacles
    const steps = Math.ceil(distance / LANDSCAPE.SQUARE_SIZE);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const checkX = viewerWorldPos.x + dx * t;
      const checkZ = viewerWorldPos.z + dz * t;

      const gridPos = this.landscape.worldToGrid(checkX, checkZ);
      const checkSquare = this.landscape.getSquare(gridPos.x, gridPos.z);

      if (checkSquare) {
        const checkHeight = checkSquare.height * LANDSCAPE.HEIGHT_UNIT;
        const rayHeight = viewerHeight - slope * distance * t;

        if (checkHeight > rayHeight) {
          return false;  // Blocked by terrain
        }
      }
    }

    return true;
  }

  // Create entity at position
  createEntity(type, gridX, gridZ, stackHeight = 0) {
    const square = this.landscape.getSquare(gridX, gridZ);
    if (!square) return null;

    let entity;
    let mesh;

    switch (type) {
      case 'tree':
        entity = new Tree(gridX, gridZ);
        mesh = this.meshFactory.createTree();
        break;
      case 'boulder':
        entity = new Boulder(gridX, gridZ);
        mesh = this.meshFactory.createBoulder();
        break;
      case 'robot':
        entity = new Robot(gridX, gridZ, false);
        mesh = this.meshFactory.createRobot(false);
        break;
      case 'meanie':
        entity = new Meanie(gridX, gridZ);
        mesh = this.meshFactory.createMeanie();
        break;
      default:
        return null;
    }

    entity.mesh = mesh;
    entity.stackHeight = stackHeight;

    // Position in world - base height is terrain + stack
    const worldPos = this.landscape.gridToWorld(gridX, gridZ);
    const baseHeight = (square.height + stackHeight) * LANDSCAPE.HEIGHT_UNIT;

    // Set position (x and z), and ADD baseHeight to mesh's internal y offset
    mesh.position.x = worldPos.x;
    mesh.position.z = worldPos.z;
    mesh.position.y += baseHeight;

    this.renderer.add(mesh);
    this.entities.push(entity);

    // Place on square (this also sets entity.stackHeight)
    if (type === 'boulder') {
      square.addBoulder(entity);
    } else if (stackHeight > 0) {
      square.placeOnTop(entity);
    } else {
      square.placeEntity(entity);
    }

    // Store entity reference on mesh for raycasting
    mesh.userData.entity = entity;

    return entity;
  }

  // Remove entity from level
  removeEntity(entity) {
    if (!entity) return;

    // Check if already removed
    const index = this.entities.indexOf(entity);
    if (index === -1) {
      // Already removed, don't process again
      return;
    }

    // Remove from entities array
    this.entities.splice(index, 1);

    // Clear special references
    if (entity === this.sentinel) {
      this.sentinel = null;
    }
    if (entity === this.playerRobot) {
      this.playerRobot = null;
    }
    const sentryIndex = this.sentries.indexOf(entity);
    if (sentryIndex > -1) {
      this.sentries.splice(sentryIndex, 1);
    }

    // Remove mesh and dispose resources
    if (entity.mesh) {
      try {
        this.renderer.remove(entity.mesh);
        this.disposeMesh(entity.mesh);
      } catch (e) {
        console.warn('Error disposing mesh:', e);
      }
      entity.mesh = null;
    }

    // Remove from square
    try {
      const square = this.landscape.getSquare(entity.gridX, entity.gridZ);
      if (square) {
        if (square.entity === entity) {
          square.removeEntity();
        } else if (square.topEntity === entity) {
          square.removeTopEntity();
        } else {
          // Check boulder stack
          const boulderIndex = square.boulderStack.indexOf(entity);
          if (boulderIndex > -1) {
            square.boulderStack.splice(boulderIndex, 1);
          }
        }
      }
    } catch (e) {
      console.warn('Error removing entity from square:', e);
    }

    // Mark entity as removed to prevent double-processing
    entity.removed = true;
  }

  // Safely dispose mesh resources (handles both Mesh and Group)
  disposeMesh(object) {
    if (!object) return;

    // Traverse all children for Groups
    object.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  removeMeanie(meanie) {
    const index = this.meanies.indexOf(meanie);
    if (index > -1) {
      this.meanies.splice(index, 1);
    }
    this.removeEntity(meanie);
  }

  cleanup(renderer) {
    // Remove all meshes
    for (const entity of this.entities) {
      if (entity.mesh) {
        renderer.remove(entity.mesh);
      }
    }

    // Remove landscape mesh
    if (this.landscapeMesh) {
      renderer.remove(this.landscapeMesh);
    }

    // Clear arrays
    this.entities = [];
    this.sentries = [];
    this.meanies = [];
    this.sentinel = null;
    this.playerRobot = null;
  }
}
