// Math utility functions

// Clamp value between min and max
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Linear interpolation
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Normalize angle to 0-2PI range
export function normalizeAngle(angle) {
  while (angle < 0) angle += Math.PI * 2;
  while (angle >= Math.PI * 2) angle -= Math.PI * 2;
  return angle;
}

// Get shortest angle difference (returns -PI to PI)
export function angleDifference(from, to) {
  let diff = to - from;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

// Calculate distance between two 2D points
export function distance2D(x1, z1, x2, z2) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dz * dz);
}

// Calculate distance between two 3D points
export function distance3D(x1, y1, z1, x2, y2, z2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Check if a point is within a rectangle
export function pointInRect(px, pz, rx, rz, rw, rd) {
  return px >= rx && px < rx + rw && pz >= rz && pz < rz + rd;
}

// Random integer in range [min, max]
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random float in range [min, max)
export function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

// Smooth step function
export function smoothStep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}
