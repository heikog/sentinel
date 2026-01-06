import * as THREE from 'three';
import { COLORS, LANDSCAPE } from '../config.js';

// Creates CPC-style low-poly meshes for all game entities
export class MeshFactory {
  constructor() {
    // Cache materials for reuse
    this.materials = {};
    this.initMaterials();
  }

  initMaterials() {
    // Create flat-shaded materials (CPC style)
    this.materials.tree = new THREE.MeshLambertMaterial({
      color: COLORS.TREE,
      flatShading: true
    });

    this.materials.boulder = new THREE.MeshLambertMaterial({
      color: COLORS.BOULDER,
      flatShading: true
    });

    this.materials.robot = new THREE.MeshLambertMaterial({
      color: COLORS.ROBOT,
      flatShading: true
    });

    this.materials.robotPlayer = new THREE.MeshLambertMaterial({
      color: COLORS.ROBOT_PLAYER,
      flatShading: true
    });

    this.materials.sentinel = new THREE.MeshLambertMaterial({
      color: COLORS.SENTINEL,
      flatShading: true
    });

    this.materials.sentry = new THREE.MeshLambertMaterial({
      color: COLORS.SENTRY,
      flatShading: true
    });

    this.materials.meanie = new THREE.MeshLambertMaterial({
      color: COLORS.MEANIE,
      flatShading: true
    });

    this.materials.pedestal = new THREE.MeshLambertMaterial({
      color: COLORS.PEDESTAL,
      flatShading: true
    });
  }

  // Create tree mesh - simple cone/triangle shape
  createTree() {
    const group = new THREE.Group();

    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.2, 4);
    const trunkMaterial = new THREE.MeshLambertMaterial({
      color: 0x804000,
      flatShading: true
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 0.1;
    group.add(trunk);

    // Tree foliage - cone shape
    const foliageGeometry = new THREE.ConeGeometry(0.2, 0.5, 4);
    const foliage = new THREE.Mesh(foliageGeometry, this.materials.tree);
    foliage.position.y = 0.45;
    group.add(foliage);

    return group;
  }

  // Create boulder mesh - chunky rectangular block
  // Height matches LANDSCAPE.HEIGHT_UNIT (0.5) for proper stacking
  createBoulder() {
    const boulderHeight = LANDSCAPE.HEIGHT_UNIT;  // 0.5
    const geometry = new THREE.BoxGeometry(0.45, boulderHeight, 0.45);

    // Slightly randomize vertices for rough look
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      positions.setX(i, positions.getX(i) + (Math.random() - 0.5) * 0.05);
      positions.setY(i, positions.getY(i) + (Math.random() - 0.5) * 0.03);
      positions.setZ(i, positions.getZ(i) + (Math.random() - 0.5) * 0.05);
    }
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, this.materials.boulder);
    // Position so bottom is at y=0 (center at half height)
    mesh.position.y = boulderHeight / 2;
    return mesh;
  }

  // Create robot mesh - humanoid silhouette (player or NPC)
  createRobot(isPlayer = false) {
    const group = new THREE.Group();
    const material = isPlayer ? this.materials.robotPlayer : this.materials.robot;

    // Body - rectangular torso
    const bodyGeometry = new THREE.BoxGeometry(0.25, 0.35, 0.15);
    const body = new THREE.Mesh(bodyGeometry, material);
    body.position.y = 0.4;
    group.add(body);

    // Head - cube
    const headGeometry = new THREE.BoxGeometry(0.18, 0.18, 0.15);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.y = 0.68;
    group.add(head);

    // Legs - two rectangular blocks
    const legGeometry = new THREE.BoxGeometry(0.08, 0.25, 0.1);

    const leftLeg = new THREE.Mesh(legGeometry, material);
    leftLeg.position.set(-0.07, 0.125, 0);
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, material);
    rightLeg.position.set(0.07, 0.125, 0);
    group.add(rightLeg);

    // Arms - two thin blocks
    const armGeometry = new THREE.BoxGeometry(0.06, 0.28, 0.08);

    const leftArm = new THREE.Mesh(armGeometry, material);
    leftArm.position.set(-0.18, 0.38, 0);
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, material);
    rightArm.position.set(0.18, 0.38, 0);
    group.add(rightArm);

    return group;
  }

  // Create Sentinel mesh - tall menacing figure on pedestal
  createSentinel() {
    const group = new THREE.Group();

    // Pedestal base
    const pedestalGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.3, 6);
    const pedestal = new THREE.Mesh(pedestalGeometry, this.materials.pedestal);
    pedestal.position.y = 0.15;
    group.add(pedestal);

    // Body - tall tapered form
    const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.25, 0.8, 5);
    const body = new THREE.Mesh(bodyGeometry, this.materials.sentinel);
    body.position.y = 0.7;
    group.add(body);

    // Head - angular
    const headGeometry = new THREE.ConeGeometry(0.2, 0.35, 4);
    const head = new THREE.Mesh(headGeometry, this.materials.sentinel);
    head.position.y = 1.25;
    head.rotation.y = Math.PI / 4;  // Rotate for diamond shape
    group.add(head);

    // Eyes - two small cubes (menacing look)
    const eyeGeometry = new THREE.BoxGeometry(0.06, 0.04, 0.06);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.08, 1.15, 0.12);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.08, 1.15, 0.12);
    group.add(rightEye);

    return group;
  }

  // Create Sentry mesh - smaller version of Sentinel
  createSentry() {
    const group = new THREE.Group();

    // Small pedestal
    const pedestalGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.2, 5);
    const pedestal = new THREE.Mesh(pedestalGeometry, this.materials.pedestal);
    pedestal.position.y = 0.1;
    group.add(pedestal);

    // Body - shorter tapered form
    const bodyGeometry = new THREE.CylinderGeometry(0.12, 0.18, 0.5, 5);
    const body = new THREE.Mesh(bodyGeometry, this.materials.sentry);
    body.position.y = 0.45;
    group.add(body);

    // Head - angular
    const headGeometry = new THREE.ConeGeometry(0.15, 0.25, 4);
    const head = new THREE.Mesh(headGeometry, this.materials.sentry);
    head.position.y = 0.82;
    head.rotation.y = Math.PI / 4;
    group.add(head);

    // Single eye
    const eyeGeometry = new THREE.BoxGeometry(0.08, 0.04, 0.04);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff8000 });
    const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye.position.set(0, 0.72, 0.1);
    group.add(eye);

    return group;
  }

  // Create Meanie mesh - twisted spinning shape
  createMeanie() {
    const group = new THREE.Group();

    // Twisted body - multiple rotated segments
    const segmentCount = 5;
    const segmentHeight = 0.12;
    const totalHeight = segmentCount * segmentHeight;

    for (let i = 0; i < segmentCount; i++) {
      const t = i / (segmentCount - 1);
      const size = 0.15 + Math.sin(t * Math.PI) * 0.1;

      const segmentGeometry = new THREE.BoxGeometry(size, segmentHeight, size);
      const segment = new THREE.Mesh(segmentGeometry, this.materials.meanie);

      segment.position.y = i * segmentHeight + segmentHeight / 2;
      segment.rotation.y = i * 0.5;  // Twist each segment

      group.add(segment);
    }

    // Spiky top
    const spikeGeometry = new THREE.ConeGeometry(0.08, 0.2, 4);
    const spike = new THREE.Mesh(spikeGeometry, this.materials.meanie);
    spike.position.y = totalHeight + 0.1;
    group.add(spike);

    return group;
  }

  // Create crosshair/sights overlay
  createCrosshair() {
    const group = new THREE.Group();

    const material = new THREE.LineBasicMaterial({ color: COLORS.UI_TEXT });

    // Horizontal line
    const hPoints = [
      new THREE.Vector3(-0.02, 0, 0),
      new THREE.Vector3(0.02, 0, 0)
    ];
    const hGeometry = new THREE.BufferGeometry().setFromPoints(hPoints);
    const hLine = new THREE.Line(hGeometry, material);
    group.add(hLine);

    // Vertical line
    const vPoints = [
      new THREE.Vector3(0, -0.02, 0),
      new THREE.Vector3(0, 0.02, 0)
    ];
    const vGeometry = new THREE.BufferGeometry().setFromPoints(vPoints);
    const vLine = new THREE.Line(vGeometry, material);
    group.add(vLine);

    return group;
  }

  // Dispose all cached materials
  dispose() {
    for (const key in this.materials) {
      this.materials[key].dispose();
    }
  }
}
