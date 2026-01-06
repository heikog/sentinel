import * as THREE from 'three';
import { CAMERA, LANDSCAPE } from '../config.js';

export class GameCamera {
  constructor(threeCamera) {
    this.camera = threeCamera;

    // Rotation angles
    this.yaw = 0;    // Horizontal rotation
    this.pitch = 0;  // Vertical rotation

    // Position
    this.gridX = 0;
    this.gridZ = 0;
    this.heightLevel = 0;
    this.stackHeight = 0;

    // Crosshair target
    this.targetGridX = null;
    this.targetGridZ = null;
    this.targetEntity = null;

    // Raycaster for targeting
    this.raycaster = new THREE.Raycaster();
    // Set near plane to avoid missing close objects
    this.raycaster.near = 0.05;
    this.raycaster.far = 100;
    this.center = new THREE.Vector2(0, 0);
  }

  // Set position from grid coordinates
  setPosition(gridX, gridZ, heightLevel, stackHeight = 0, landscape) {
    this.gridX = gridX;
    this.gridZ = gridZ;
    this.heightLevel = heightLevel;
    this.stackHeight = stackHeight;

    const worldPos = landscape.gridToWorld(gridX, gridZ);
    const worldY = (heightLevel + stackHeight) * LANDSCAPE.HEIGHT_UNIT + CAMERA.EYE_HEIGHT;

    this.camera.position.set(worldPos.x, worldY, worldPos.z);
  }

  // Update camera rotation from input
  rotate(deltaYaw, deltaPitch) {
    this.yaw += deltaYaw;
    this.pitch += deltaPitch;

    // Clamp pitch
    this.pitch = Math.max(CAMERA.MIN_PITCH, Math.min(CAMERA.MAX_PITCH, this.pitch));

    // Apply rotation
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  // U-turn (180 degree rotation)
  uTurn() {
    this.yaw += Math.PI;
    this.camera.rotation.y = this.yaw;
  }

  // Get what the camera is looking at (using cursor position)
  // playerRobot is optional - if provided, will filter it out from hits
  getTarget(scene, landscape, cursorNDC = null, playerRobot = null) {
    // Cast ray from cursor position (or center if no cursor)
    const rayOrigin = cursorNDC || this.center;
    this.raycaster.setFromCamera(rayOrigin, this.camera);

    // Get all intersections
    const intersects = this.raycaster.intersectObjects(scene.children, true);

    // Find the first valid hit (skip player's own robot)
    for (const hit of intersects) {
      // Find entity by traversing up the hierarchy
      let entity = this.findEntityInHierarchy(hit.object);

      // Skip if this is the player's robot
      if (playerRobot && entity === playerRobot) {
        continue;
      }

      // Skip removed entities
      if (entity && entity.removed) {
        continue;
      }

      // Get grid position from world position
      const gridPos = landscape.worldToGrid(hit.point.x, hit.point.z);
      const square = landscape.getSquare(gridPos.x, gridPos.z);

      if (square) {
        this.targetGridX = gridPos.x;
        this.targetGridZ = gridPos.z;
        this.targetEntity = entity;

        return {
          gridX: gridPos.x,
          gridZ: gridPos.z,
          square,
          entity,
          point: hit.point
        };
      }
    }

    this.targetGridX = null;
    this.targetGridZ = null;
    this.targetEntity = null;

    return null;
  }

  // Traverse up the object hierarchy to find an entity
  findEntityInHierarchy(object) {
    let current = object;
    while (current) {
      if (current.userData && current.userData.entity) {
        return current.userData.entity;
      }
      current = current.parent;
    }
    return null;
  }

  // Get forward direction vector
  getForwardDirection() {
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.camera.quaternion);
    return direction;
  }

  // Get current look angles
  getAngles() {
    return { yaw: this.yaw, pitch: this.pitch };
  }

  // Reset camera
  reset() {
    this.yaw = 0;
    this.pitch = 0;
    this.camera.rotation.set(0, 0, 0);
  }
}
