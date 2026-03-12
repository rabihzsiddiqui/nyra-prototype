import * as THREE from 'three';
import { CONFIG } from './config.js';
import { StateMachine } from './state-machine.js';
import Noise from './noise.js';
import { orbMesh, updateOrb } from './orb.js';
import { leftWing, rightWing, updateWing } from './wings.js';
import { particlesMesh, updateParticles } from './particles.js';
import { createTextOverlay, update as textUpdate, tick as textTick } from './text-display.js';


// Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 1);
document.body.appendChild(renderer.domElement);

const { container: textContainer } = createTextOverlay();

scene.add(orbMesh);
scene.add(leftWing);
scene.add(rightWing);
scene.add(particlesMesh);

// Mouse tracking for wing hover response
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
});

// State machine
const sm = new StateMachine(CONFIG);

function setState(name) {
  sm.setState(name);
  document.querySelectorAll('.state-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.state === name)
  );
  // Use target state params (not interpolated) for the color at transition start
  textUpdate(CONFIG.states[name], name);
}

// HUD click bindings
document.querySelectorAll('.state-btn').forEach(btn => {
  btn.addEventListener('click', () => setState(btn.dataset.state));
});

// Keyboard 1-4
document.addEventListener('keydown', (e) => {
  if (e.key === '1') setState('idle');
  if (e.key === '2') setState('listening');
  if (e.key === '3') setState('thinking');
  if (e.key === '4') setState('speaking');
});

// Holo Mode button
document.getElementById('holo-btn').addEventListener('click', () => {
  // Hide button, HUD, and dialogue box -- show only the visual elements
  document.getElementById('holo-btn').style.opacity = '0';
  setTimeout(() => { document.getElementById('holo-btn').style.display = 'none'; }, 400);
  document.getElementById('state-hud').style.display = 'none';
  renderer.domElement.style.transform = 'scaleY(-1)';
  if (textContainer) textContainer.style.transform = 'translateX(-50%) scaleY(-1)';

  // Auto-cycle states for demo
  const CYCLE = [
    { state: 'idle',      duration: 5000 },
    { state: 'listening', duration: 3000 },
    { state: 'thinking',  duration: 4000 },
    { state: 'speaking',  duration: 6000 },
  ];
  let cycleIdx = 0;
  function runCycle() {
    const { state, duration } = CYCLE[cycleIdx];
    setState(state);
    cycleIdx = (cycleIdx + 1) % CYCLE.length;
    setTimeout(runCycle, duration);
  }
  runCycle();

  // Keep screen awake
  if ('wakeLock' in navigator) {
    const requestWakeLock = () => navigator.wakeLock.request('screen').catch(() => {});
    requestWakeLock();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    });
  }
});

// Render loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();
  const now = performance.now();

  sm.update(now);
  const p = sm.params;

  // Breathing: noise-modulated sine
  const bNoise = Noise.simplex3(time * 0.2, 0, 0) * 0.2;
  const bCycle = (1 + bNoise) * p.breathRate;
  let breath = Math.sin(time * Math.PI * 2 / bCycle) * p.breathAmplitude;

  // Thinking: add irregular pulse on top of breath
  if (sm.currentState === 'thinking') {
    breath += Noise.simplex3(time * 0.8, 5, 0) * 0.15;
  }

  // Orb slow hover drift
  orbMesh.position.y = Noise.simplex3(time * 0.08, 50, 0) * 0.03;

  updateOrb(p, time, breath);
  updateWing(leftWing,  p, time, mouseX, mouseY);
  updateWing(rightWing, p, time, mouseX, mouseY);
  updateParticles(p, time);
  textTick(breath);

  renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
