# Nyra

**Repo**: https://github.com/rabihzsiddiqui/nyra-prototype

Nyra is an ambient AI assistant rendered as a glowing orb with asymmetric glass wing structures. It communicates through color, motion, light intensity, and subtle animation. The aesthetic sits between engineered precision and organic life: a digital spirit inspired by Navi from Zelda: Ocarina of Time, redesigned as a futuristic ambient interface.

## Current State

A working single-file prototype exists at `prototype/nyra-v1-prototype.html`. This is the visual reference and source of truth for all shader code, geometry, animation parameters, and state machine logic. The project needs to be migrated into a proper Vite + vanilla JS module structure.

## Tech Stack

- Vite (dev server + build)
- Three.js r128+ (WebGL rendering)
- Custom GLSL shaders (orb glow, glass wing surfaces)
- Vanilla JavaScript (no React, no framework)
- Simplex noise (JS-side for animation variance, GLSL-side for shader effects)

## Architecture

```
Input Layer --> State Machine --> Animation Engine --> Three.js Renderer
                    |
               Config Layer (all tunable parameters)
```

Data flow is linear:
1. Input triggers state change (keyboard 1-4 for now)
2. State machine interpolates all parameters toward target state using cubic easing
3. Animation engine updates Three.js uniforms/positions each frame
4. Renderer draws at 60fps

## Project Structure

```
nyra/
  index.html
  src/
    main.js              -- Scene setup, render loop, input binding
    config.js            -- All state parameters, colors, timing, wing geometry
    state-machine.js     -- State transitions with cubic easing interpolation
    orb.js               -- Orb shader material (SDF glow, internal noise)
    wings.js             -- Asymmetric glass wing geometry + shader
    particles.js         -- 45-particle system with 4 behavior modes
    noise.js             -- Simplex noise utility (JS side)
    glsl/
      noise.glsl         -- Shared simplex noise for GLSL shaders
      orb.frag           -- Orb fragment shader
      orb.vert           -- Orb vertex shader
      wing-glass.frag    -- Wing glass fragment shader
      wing-glass.vert    -- Wing glass vertex shader
```

## Visual Elements

### Orb
- Full-screen quad with SDF glow shader (NOT a mesh with post-processing bloom)
- Three layered exponential falloff glow rings
- Internal simplex noise for slow plasma-like movement
- Breathing animation modulates glow radius

### Wings (NOT "triangles")
- Asymmetric shape: 3 vertices per wing (tip, topOuter, bottomOuter)
- Tip points INWARD toward the orb with a visible gap of dark space
- Top edge is longer than bottom edge (swept wing silhouette)
- Glass shader: semi-transparent frosted fill with luminous edges
- Outer edge (connecting top and bottom outer vertices) carries the brightest highlight
- Tip area gets only a soft orb-light bleed, NOT a hot spot
- Current geometry constants:
  - tipX: 0.50 (gap from center)
  - tipY: -0.10 (slightly below center)
  - topOuterX: 1.25, topOuterY: 0.95
  - botOuterX: 1.10, botOuterY: -0.85

### Particles
- 45 particles with soft point-sprite rendering
- 4 behavior modes: drift-out (idle), flow-in (listening), orbit (thinking), pulse-out (speaking)
- Additive blending, inherit state color

## Four States

| State     | Color          | Key Motion               | Feeling                    |
|-----------|----------------|--------------------------|----------------------------|
| Idle      | Deep indigo    | Slow breathing, drift    | Peripheral, calm           |
| Listening | Green          | Contract, tighten inward | "I focused on you"         |
| Thinking  | Amber/gold     | Oscillation, orbiting    | Active processing          |
| Speaking  | Warm white     | Expand outward, pulse    | "I'm giving you something" |

Colors are spread across the hue wheel for CVD accessibility. Each state has at least 3 differentiators (color + motion + geometry).

## Design Principles

- **Stillness budget**: Nyra should be 70%+ still at any given moment. Motion carries meaning.
- **Idle disappears**: After 30 seconds, the viewer should stop noticing Nyra.
- **Transitions matter most**: The idle-to-listening transition is the signature moment.
- **Return to idle is always slow**: 1800ms vs 550ms for other transitions.
- **No fantasy creep**: No eyes, no face, no wing-flapping. Every choice should make Nyra feel more like a device, not a character.
- **Perlin noise on everything in idle**: Breathing rate, hover position, color micro-shifts. No two moments should look identical.

## Things NOT to Add in V1

- Audio reactivity or voice input
- Real AI/LLM backend
- 3D camera controls or orbit interaction
- Mobile responsiveness
- Multiple themes

## Key Commands for Development

```bash
# Initialize Vite in the existing repo (run from project root)
npm init -y
npm install vite three
npx vite
```
