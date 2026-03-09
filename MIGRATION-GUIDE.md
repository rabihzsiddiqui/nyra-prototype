# Nyra -- Claude Code Migration Guide

## Setup

```bash
# 1. Clone your repo
git clone https://github.com/rabihzsiddiqui/nyra-prototype.git
cd nyra-prototype

# 2. Drop in the project files
#    - Place CLAUDE.md at the root (nyra/CLAUDE.md)
#    - Create a prototype folder and place the HTML file in it
mkdir prototype
#    (move nyra-v1-prototype.html into prototype/)
#    (move this file into the root if you want it for reference)

# 3. Initial commit so you have a clean baseline
git add .
git commit -m "Add CLAUDE.md and working prototype"
git push

# 4. Open in VSCode
code .

# 5. Open Claude Code (Cmd+Shift+P > "Claude Code: Open")
#    Claude Code will automatically read CLAUDE.md
#    Paste the Session 1 prompt below to begin
```

## Session 1: Scaffold + Orb

Prompt:

```
Read the CLAUDE.md and the prototype at prototype/nyra-v1-prototype.html.

Scaffold a Vite project in this existing repo. Run npm init, install vite and three,
add a vite.config.js, and add dev/build scripts to package.json.

Then extract the following from the prototype into separate modules:
- src/noise.js (the JS-side simplex noise)
- src/config.js (the CONFIG object and WING geometry constants)
- src/state-machine.js (the StateMachine class)
- src/orb.js (creates and exports the orb mesh + shader material, with an update function)
- src/glsl/noise.glsl (the shared GLSL simplex noise, imported as a string)
- src/glsl/orb.frag and orb.vert

Wire up main.js with the Three.js scene, camera, renderer, and render loop.
Only render the orb for now -- no wings or particles yet.
Keyboard 1-4 should trigger state changes.

The prototype is the source of truth for all shader code, geometry values, and config values.
Do not simplify or approximate -- extract exactly.
```

## Session 2: Wings

Prompt:

```
Read the prototype at prototype/nyra-v1-prototype.html.

Add the wing system by extracting into src/wings.js:
- The createWing function (asymmetric glass wings with 3 vertices)
- The wing glass fragment shader (extract to src/glsl/wing-glass.frag)
- The wing glass vertex shader (extract to src/glsl/wing-glass.vert)
- The updateWing function
- The edge line overlay

Import into main.js and wire into the render loop.
Wing geometry constants are already in config.js from session 1.

The prototype is the source of truth for the shader code.
The outer edge of each wing should carry the brightest highlight.
The tip near the orb gets only a subtle bleed, not a hot spot.
```

## Session 3: Particles

Prompt:

```
Read the prototype at prototype/nyra-v1-prototype.html.

Add the particle system by extracting into src/particles.js:
- Particle initialization (45 particles, point sprites, additive blending)
- The 4 behavior modes: drift-out, flow-in, orbit, pulse-out
- The updateParticles function

Import into main.js and wire into the render loop.
Particle radii should fill the gap between orb and wings
(drift-out max 1.5, flow-in spawn at 1.0-1.5, orbit at 0.5, pulse-out 0.2-1.1).
```

## Session 4: Polish

Prompt:

```
Review the full project and compare against the prototype visually.

Add any missing details:
- Mouse proximity tracking (triangles orient slightly toward cursor)
- Orb hover (slow noise-driven vertical drift)
- Thinking state irregular pulsing
- Verify all transition timings match config (550ms default, 1800ms to idle)

Then add a minimal HUD at the bottom of the screen showing the 4 state buttons
with keyboard shortcuts (matching the prototype's CSS).
```

## Tips

- Always point Claude Code at the prototype file as visual reference
- If something looks wrong, screenshot it and paste into Claude Code -- it can see images
- The CLAUDE.md gives Claude Code the full context automatically, you don't need to re-explain the concept
- If you want to tune values, just say "make the wings further from the orb" or "make idle breathing slower" -- Claude Code can read config.js and adjust
