import * as THREE from 'three';
import { CPC_PALETTE_ARRAY } from '../config.js';

// CPC color quantization post-processing shader
// Reduces colors to the 27-color Amstrad CPC palette

export const CPCShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2(320, 200) },
    pixelSize: { value: 2.0 },
    enableQuantization: { value: true },
    enableScanlines: { value: true },
    scanlineIntensity: { value: 0.1 }
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float pixelSize;
    uniform bool enableQuantization;
    uniform bool enableScanlines;
    uniform float scanlineIntensity;

    varying vec2 vUv;

    // CPC palette (27 colors)
    const vec3 cpcPalette[27] = vec3[27](
      vec3(0.016, 0.016, 0.016),  // Black
      vec3(0.502, 0.502, 0.502),  // Gray
      vec3(1.000, 1.000, 1.000),  // White
      vec3(0.502, 0.000, 0.000),  // Dark Red
      vec3(1.000, 0.000, 0.000),  // Red
      vec3(1.000, 0.502, 0.502),  // Light Red
      vec3(1.000, 0.498, 0.000),  // Orange
      vec3(1.000, 1.000, 0.502),  // Light Yellow
      vec3(1.000, 1.000, 0.000),  // Yellow
      vec3(0.502, 0.502, 0.000),  // Dark Yellow
      vec3(0.000, 0.502, 0.000),  // Dark Green
      vec3(0.004, 1.000, 0.000),  // Green
      vec3(0.502, 1.000, 0.000),  // Lime
      vec3(0.502, 1.000, 0.502),  // Light Green
      vec3(0.004, 1.000, 0.502),  // Sea Green
      vec3(0.000, 0.502, 0.502),  // Dark Cyan
      vec3(0.004, 1.000, 1.000),  // Cyan
      vec3(0.502, 1.000, 1.000),  // Light Cyan
      vec3(0.000, 0.502, 1.000),  // Sky Blue
      vec3(0.000, 0.000, 1.000),  // Blue
      vec3(0.000, 0.000, 0.498),  // Dark Blue
      vec3(0.498, 0.000, 1.000),  // Purple
      vec3(0.502, 0.502, 1.000),  // Light Blue
      vec3(1.000, 0.502, 1.000),  // Pink
      vec3(1.000, 0.000, 1.000),  // Magenta
      vec3(1.000, 0.000, 0.502),  // Rose
      vec3(0.502, 0.000, 0.502)   // Dark Magenta
    );

    vec3 findClosestColor(vec3 color) {
      float minDist = 999.0;
      vec3 closest = cpcPalette[0];

      for (int i = 0; i < 27; i++) {
        vec3 diff = color - cpcPalette[i];
        float dist = dot(diff, diff);
        if (dist < minDist) {
          minDist = dist;
          closest = cpcPalette[i];
        }
      }

      return closest;
    }

    void main() {
      // Pixelate
      vec2 pixelatedUv = floor(vUv * resolution / pixelSize) * pixelSize / resolution;

      vec4 color = texture2D(tDiffuse, pixelatedUv);

      // Quantize to CPC palette
      if (enableQuantization) {
        color.rgb = findClosestColor(color.rgb);
      }

      // Add scanlines
      if (enableScanlines) {
        float scanline = sin(vUv.y * resolution.y * 3.14159) * 0.5 + 0.5;
        color.rgb *= 1.0 - scanlineIntensity * (1.0 - scanline);
      }

      gl_FragColor = color;
    }
  `
};

// Helper class to apply CPC effect
export class CPCEffect {
  constructor(renderer, width, height) {
    this.renderer = renderer;

    // Create render targets
    this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter
    });

    // Create shader material
    this.material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(CPCShader.uniforms),
      vertexShader: CPCShader.vertexShader,
      fragmentShader: CPCShader.fragmentShader
    });

    this.material.uniforms.resolution.value.set(width, height);

    // Create full-screen quad
    this.quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.material
    );

    this.scene = new THREE.Scene();
    this.scene.add(this.quad);

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  render(scene, camera) {
    // Render scene to texture
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(scene, camera);

    // Render with CPC effect
    this.material.uniforms.tDiffuse.value = this.renderTarget.texture;
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);
  }

  setPixelSize(size) {
    this.material.uniforms.pixelSize.value = size;
  }

  setQuantization(enabled) {
    this.material.uniforms.enableQuantization.value = enabled;
  }

  setScanlines(enabled, intensity = 0.1) {
    this.material.uniforms.enableScanlines.value = enabled;
    this.material.uniforms.scanlineIntensity.value = intensity;
  }

  dispose() {
    this.renderTarget.dispose();
    this.material.dispose();
    this.quad.geometry.dispose();
  }
}
