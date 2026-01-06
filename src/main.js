import { Game } from './game/Game.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Hide loading message
  const loading = document.getElementById('loading');

  // Get container
  const container = document.getElementById('game-container');

  // Create and start game
  const game = new Game(container);

  // Initialize and start
  game.init().then(() => {
    loading.style.display = 'none';
    game.start();
  }).catch((error) => {
    console.error('Failed to initialize game:', error);
    loading.textContent = 'FAILED TO LOAD';
    loading.style.color = '#ff0000';
  });
});
