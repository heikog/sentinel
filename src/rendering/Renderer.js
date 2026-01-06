import * as THREE from 'three';
import { RENDER, COLORS } from '../config.js';

export class Renderer {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.SKY);

    // Calculate dimensions maintaining CPC aspect ratio
    this.calculateDimensions();

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      RENDER.FOV,
      RENDER.ASPECT_RATIO,
      RENDER.NEAR,
      RENDER.FAR
    );

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,  // CPC didn't have antialiasing
      powerPreference: 'high-performance'
    });

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(1);  // Chunky pixels
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Flat shading for CPC look
    this.renderer.shadowMap.enabled = false;

    container.appendChild(this.renderer.domElement);

    // Handle resize
    window.addEventListener('resize', () => this.onResize());

    // Basic lighting (flat, no shadows for CPC look)
    this.setupLighting();
  }

  calculateDimensions() {
    const windowAspect = window.innerWidth / window.innerHeight;
    const targetAspect = RENDER.ASPECT_RATIO;

    if (windowAspect > targetAspect) {
      // Window is wider than target
      this.height = window.innerHeight;
      this.width = this.height * targetAspect;
    } else {
      // Window is taller than target
      this.width = window.innerWidth;
      this.height = this.width / targetAspect;
    }

    // Round to integers
    this.width = Math.floor(this.width);
    this.height = Math.floor(this.height);
  }

  setupLighting() {
    // Ambient light for flat CPC look
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambient);

    // Single directional light for slight depth
    const directional = new THREE.DirectionalLight(0xffffff, 0.3);
    directional.position.set(1, 2, 1);
    this.scene.add(directional);
  }

  onResize() {
    this.calculateDimensions();
    this.camera.aspect = RENDER.ASPECT_RATIO;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  add(object) {
    this.scene.add(object);
  }

  remove(object) {
    this.scene.remove(object);
  }

  clear() {
    // Remove all objects except lights
    const toRemove = [];
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        toRemove.push(child);
      }
    });
    toRemove.forEach((obj) => {
      this.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }

  getCamera() {
    return this.camera;
  }

  getScene() {
    return this.scene;
  }

  getDomElement() {
    return this.renderer.domElement;
  }

  getCanvasBounds() {
    const element = this.renderer.domElement;
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    };
  }
}
