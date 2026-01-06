// Seeded random number generator using mulberry32 algorithm
// Provides deterministic random numbers for reproducible level generation

export class SeededRandom {
  constructor(seed) {
    // Convert seed to 32-bit integer
    this.seed = seed >>> 0;
    this.state = this.seed;
  }

  // Mulberry32 PRNG - fast and has good distribution
  next() {
    let t = this.state += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  // Get random integer in range [min, max] inclusive
  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Get random float in range [min, max)
  nextFloat(min, max) {
    return this.next() * (max - min) + min;
  }

  // Get random boolean with given probability
  nextBool(probability = 0.5) {
    return this.next() < probability;
  }

  // Shuffle array in place (Fisher-Yates)
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Pick random element from array
  pick(array) {
    return array[this.nextInt(0, array.length - 1)];
  }

  // Reset to initial seed
  reset() {
    this.state = this.seed;
  }

  // Get current state for saving
  getState() {
    return this.state;
  }

  // Set state for loading
  setState(state) {
    this.state = state >>> 0;
  }
}
