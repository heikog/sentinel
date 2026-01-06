# The Sentinel

A faithful JavaScript recreation of **The Sentinel**, the groundbreaking 1986 puzzle/strategy game created by Geoff Crammond for the BBC Micro and later ported to Amstrad CPC, Commodore 64, and other platforms.

**[Play Now](https://heikog.github.io/sentinel/)**

![The Sentinel](https://img.shields.io/badge/Levels-10%2C000-green) ![Three.js](https://img.shields.io/badge/Three.js-WebGL-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## What is The Sentinel?

The Sentinel is a unique first-person puzzle game that was revolutionary for its time. Unlike action games, it requires careful strategy, resource management, and spatial awareness. You don't move freely - instead, you absorb and create objects to traverse a surreal, checkered landscape while avoiding the gaze of the all-seeing Sentinel.

The game was famous for:
- **10,000 unique levels** - each generated from a numeric code
- **Innovative gameplay** - no direct movement, only teleportation between robots you create
- **Tense atmosphere** - the slow-rotating Sentinel creates genuine suspense
- **Strategic depth** - managing energy while climbing to reach the Sentinel

---

## The Story

You are a telepathic robot placed on a barren, checkered landscape dominated by **The Sentinel** - an ancient, malevolent entity that stands on the highest point, slowly scanning the world for intruders.

Your mission: **Absorb the Sentinel's energy and take its place.**

But the Sentinel can drain your energy if it sees the square you're standing on. You must use the terrain, create obstacles, and build your way up to a vantage point where you can absorb the Sentinel before it destroys you.

---

## How to Play

### The Basics

1. **You are a robot** - You see through its eyes in first-person view
2. **You cannot walk** - You can only teleport to other robots you create
3. **Everything costs energy** - Trees, boulders, and robots all cost energy to create
4. **Energy comes from absorption** - Absorb trees, boulders, and eventually the Sentinel itself

### Controls

| Key | Action |
|-----|--------|
| **Space** | Toggle sights/crosshair (required for actions) |
| **S** / **←** | Pan view left |
| **D** / **→** | Pan view right |
| **K** / **↑** | Pan view up |
| **M** / **↓** | Pan view down |
| **U** | U-turn (180° spin) |
| **T** | Create tree (costs 1 energy) |
| **B** | Create boulder (costs 2 energy) |
| **R** | Create robot (costs 3 energy) |
| **A** | Absorb target |
| **Q** | Transfer consciousness to robot |
| **H** | Hyperspace (emergency teleport, costs 3 energy) |
| **P** | Pause game |
| **Z** | Toggle sound |

### Energy System

Everything in the game has an energy value:

| Object | Energy Value |
|--------|-------------|
| Tree | 1 unit |
| Boulder | 2 units |
| Robot | 3 units |
| Sentinel | 4 units |

You start with **10 energy units**. Absorbing objects adds to your energy; creating objects subtracts from it.

---

## Gameplay Guide

### Step 1: Survey the Land

When a level starts, you see an aerial view of the landscape. Note:
- Where the **Sentinel** is (highest point, marked in red)
- The terrain heights (checkered pattern shows elevation)
- Where trees are located (green, energy sources)

### Step 2: Activate Your Sights

Press **Space** to bring up your crosshair. You need this to:
- Target objects for absorption
- Select locations for creating new objects

### Step 3: Gather Energy

Look at nearby **trees** and press **A** to absorb them. Each tree gives you 1 energy. You need energy to:
- Create boulders to build stairs
- Create robots to teleport to higher ground

### Step 4: Climb Higher

The key strategy is gaining height:

1. **Create a boulder** (B) on the ground - this raises the surface by one level
2. **Stack more boulders** to build higher
3. **Create a robot** (R) on top of your boulder stack
4. **Transfer** (Q) to the new robot - now you're higher!

### Step 5: Avoid Detection

The Sentinel slowly rotates, scanning for you. If it sees **the square you're standing on**:
- A warning hum sounds
- Your energy starts draining
- The Sentinel creates **Meanies** (spinning creatures) that force you to hyperspace

**Stay hidden!** Use terrain and height differences to block the Sentinel's line of sight.

### Step 6: Absorb the Sentinel

Once you're at the **same height or higher** than the Sentinel's platform:
1. Target the Sentinel with your crosshair
2. Press **A** to absorb it (you gain 4 energy)
3. Create a robot on the Sentinel's pedestal
4. Transfer to that robot
5. Press **H** to hyperspace to the next level!

---

## Advanced Strategies

### Boulder Stacking
- Boulders are your stairs - stack them to climb
- You can place trees or robots ON TOP of boulder stacks
- Remember: creating costs energy, plan your path efficiently

### Robot Placement
- Always have an escape robot ready
- Place robots behind cover from the Sentinel
- You can have multiple robots - but each costs 3 energy

### Hyperspace
- Emergency escape that teleports you to a random safe spot
- Costs 3 energy - use only when desperate
- Your old robot turns into a tree (recoverable energy)

### The Meanie
- Created by the Sentinel when it partially sees you
- Spins rapidly, searching for you
- If it spots you, you're forced to hyperspace
- Reverts to a tree after one full rotation if it doesn't find you

### Level Codes
- Each level has an 8-digit code
- Enter codes on the title screen to skip to any level
- Higher levels = more difficult terrain and more sentries

---

## Level Progression

- **Levels 0-999**: Gentle terrain, Sentinel only
- **Levels 1000-1999**: More complex terrain, 1 Sentry added
- **Levels 2000+**: Increasingly difficult, more Sentries

**Sentries** are smaller versions of the Sentinel that also scan and drain energy. Higher levels have more of them guarding the Sentinel.

---

## Tips for Beginners

1. **Don't rush** - The Sentinel rotates slowly, you have time to think
2. **Absorb everything** - Trees are free energy, take them all
3. **Stay low initially** - Gather energy before climbing into view
4. **Watch the Sentinel's facing** - Only act when it's looking away
5. **Keep emergency energy** - Always have 3+ energy for hyperspace escape
6. **Use terrain** - Hide behind hills and tall terrain features

---

## Technical Details

This recreation is built with:
- **Three.js** - WebGL 3D rendering
- **Vite** - Modern build tooling
- **Web Audio API** - Synthesized retro sound effects
- **Vanilla JavaScript** - No frameworks

### Visual Style
Authentic **Amstrad CPC 464** aesthetics:
- 27-color palette
- Flat-shaded polygons
- Chunky, low-poly meshes
- CRT-style scanlines (optional)

### Running Locally

```bash
# Clone the repository
git clone https://github.com/heikog/sentinel.git
cd sentinel

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

---

## History

**The Sentinel** was created by Geoff Crammond and published by Firebird Software in 1986. It was a technical marvel, rendering filled 3D graphics on 8-bit computers with just 32KB of RAM.

The game received critical acclaim for its unique gameplay, atmospheric tension, and the sheer ambition of 10,000 levels. It has been cited as an influence on many later games and remains a cult classic among retro gaming enthusiasts.

This JavaScript version aims to capture the essence of the original while being playable in modern web browsers.

---

## Credits

- **Original Game**: Geoff Crammond (1986)
- **This Recreation**: Built with Claude Code
- **Inspired by**: The Amstrad CPC 464 version

---

## License

MIT License - Feel free to modify and share!

---

*"The Sentinel sees all. Can you see a way to defeat it?"*
