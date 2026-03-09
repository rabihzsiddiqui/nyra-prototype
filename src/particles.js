import * as THREE from 'three';
import { CONFIG } from './config.js';
import Noise from './noise.js';

const PARTICLE_COUNT = 45;

const pPos   = new Float32Array(PARTICLE_COUNT * 3);
const pSizes = new Float32Array(PARTICLE_COUNT);
const pAlphas = new Float32Array(PARTICLE_COUNT);
const pSeeds = [];

for (let i = 0; i < PARTICLE_COUNT; i++) {
  const angle  = Math.random() * Math.PI * 2;
  const radius = 0.3 + Math.random() * 1.0;
  pPos[i*3]   = Math.cos(angle) * radius;
  pPos[i*3+1] = Math.sin(angle) * radius;
  pPos[i*3+2] = 0;
  pSizes[i]  = 2 + Math.random() * 4;
  pAlphas[i] = 0.1 + Math.random() * 0.4;
  pSeeds.push({
    angle,
    radius,
    speed: 0.2 + Math.random() * 0.6,
    phase: Math.random() * Math.PI * 2,
  });
}

const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute('position', new THREE.BufferAttribute(pPos,    3));
particleGeometry.setAttribute('size',     new THREE.BufferAttribute(pSizes,  1));
particleGeometry.setAttribute('alpha',    new THREE.BufferAttribute(pAlphas, 1));

const particleMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    attribute float size;
    attribute float alpha;
    varying float vAlpha;
    void main() {
      vAlpha = alpha;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (200.0 / -mv.z);
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: `
    precision highp float;
    uniform vec3 uColor;
    uniform float uGlobalOpacity;
    varying float vAlpha;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float f = exp(-d*d/0.04);
      float a = f * vAlpha * uGlobalOpacity;
      gl_FragColor = vec4(uColor * a * 2.0, a);
    }
  `,
  uniforms: {
    uColor:         { value: new THREE.Vector3(...CONFIG.states.idle.glowColor) },
    uGlobalOpacity: { value: 0.4 },
  },
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

export const particlesMesh = new THREE.Points(particleGeometry, particleMaterial);

export function updateParticles(params, time) {
  const positions = particleGeometry.attributes.position;
  const alphas    = particleGeometry.attributes.alpha;
  const beh = params.particleBehavior;
  const spd = params.particleSpeed;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const s = pSeeds[i];
    const t = time * spd * s.speed;
    let x, y;

    if (beh === 'drift-out') {
      s.radius += 0.001 * spd;
      if (s.radius > 1.5) { s.radius = 0.25; s.angle = Math.random() * Math.PI * 2; }
      const n = Noise.simplex3(t * 0.5, s.phase, 0) * 0.1;
      x = Math.cos(s.angle + n) * s.radius;
      y = Math.sin(s.angle + n) * s.radius;
      alphas.setX(i, (1 - s.radius / 1.5) * 0.3);

    } else if (beh === 'flow-in') {
      s.radius -= 0.003 * spd;
      if (s.radius < 0.18) { s.radius = 1.0 + Math.random() * 0.5; s.angle = Math.random() * Math.PI * 2; }
      x = Math.cos(s.angle) * s.radius;
      y = Math.sin(s.angle) * s.radius;
      alphas.setX(i, (s.radius / 1.5) * 0.5);

    } else if (beh === 'orbit') {
      s.angle += 0.015 * spd * s.speed;
      const r = 0.5 + Math.sin(t + s.phase) * 0.2;
      x = Math.cos(s.angle) * r;
      y = Math.sin(s.angle) * r;
      alphas.setX(i, 0.5 + Math.sin(t * 2 + s.phase) * 0.2);

    } else if (beh === 'pulse-out') {
      const pulse = Math.sin(t * 1.5 + s.phase) * 0.5 + 0.5;
      const r = 0.2 + pulse * 0.9;
      x = Math.cos(s.angle + t * 0.1) * r;
      y = Math.sin(s.angle + t * 0.1) * r;
      alphas.setX(i, (1 - pulse) * 0.5 + 0.1);
    }

    positions.setXYZ(i, x, y, 0);
  }

  positions.needsUpdate = true;
  alphas.needsUpdate    = true;

  particleMaterial.uniforms.uColor.value.set(...params.glowColor);
  particleMaterial.uniforms.uGlobalOpacity.value = params.particleOpacity;
}
