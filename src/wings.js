import * as THREE from 'three';
import { CONFIG, WING } from './config.js';
import Noise from './noise.js';
import noiseGlsl from './glsl/noise.glsl?raw';
import wingGlassVert from './glsl/wing-glass.vert?raw';
import wingGlassFragRaw from './glsl/wing-glass.frag?raw';

const wingGlassFrag = wingGlassFragRaw.replace('NOISE_PLACEHOLDER', noiseGlsl);

function createWing(facing) {
  const dir = facing === 'left' ? -1 : 1;
  const group = new THREE.Group();

  // For left wing: tip on +x side pointing right, outer vertices on -x side
  // For right wing: mirrored
  const tipX = -(WING.tipX) * dir;
  const tipY = WING.tipY;
  const topX = -(WING.topOuterX) * dir;
  const topY = WING.topOuterY;
  const botX = -(WING.botOuterX) * dir;
  const botY = WING.botOuterY;

  // Glass mesh: vertex 0 = tip, vertex 1 = topOuter, vertex 2 = botOuter
  const verts = new Float32Array([
    tipX, tipY, 0.0,
    topX, topY, 0.0,
    botX, botY, 0.0,
  ]);

  // UVs: tip maps to the inward edge, outer vertices to the far side
  const uvs = facing === 'left'
    ? new Float32Array([ 1.0,0.45,  0.0,1.0,  0.1,0.0 ])
    : new Float32Array([ 0.0,0.45,  1.0,1.0,  0.9,0.0 ]);

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geom.setIndex([0, 1, 2]);

  const glassMat = new THREE.ShaderMaterial({
    vertexShader: wingGlassVert,
    fragmentShader: wingGlassFrag,
    uniforms: {
      uColor:          { value: new THREE.Vector3(...CONFIG.states.idle.orbColor) },
      uGlowColor:      { value: new THREE.Vector3(...CONFIG.states.idle.glowColor) },
      uGlassOpacity:   { value: 0.08 },
      uEdgeBrightness: { value: 0.7 },
      uTime:           { value: 0.0 },
      uFacing:         { value: dir },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const glassMesh = new THREE.Mesh(geom, glassMat);
  group.add(glassMesh);

  // Edge outline: tip -> topOuter -> botOuter -> tip (closed loop)
  const edgePts = [
    new THREE.Vector3(tipX, tipY, 0),
    new THREE.Vector3(topX, topY, 0),
    new THREE.Vector3(botX, botY, 0),
    new THREE.Vector3(tipX, tipY, 0),
  ];
  const edgeGeom = new THREE.BufferGeometry().setFromPoints(edgePts);
  const edgeMat = new THREE.ShaderMaterial({
    vertexShader: `void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      precision highp float;
      uniform vec3 uColor; uniform float uOpacity;
      void main() { gl_FragColor = vec4(uColor * uOpacity * 1.8, uOpacity * 0.85); }
    `,
    uniforms: {
      uColor:   { value: new THREE.Vector3(...CONFIG.states.idle.glowColor) },
      uOpacity: { value: 0.5 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const edgeLine = new THREE.Line(edgeGeom, edgeMat);
  group.add(edgeLine);

  group.userData = { facing, dir, glassMesh, edgeLine };
  return group;
}

export function updateWing(wingGroup, params, time, mouseX, mouseY) {
  const { facing, dir, glassMesh, edgeLine } = wingGroup.userData;
  const spread = params.triangleSpread;

  // Spread pulls tip closer / pushes outer vertices further
  const tipX = -(WING.tipX  - spread * 0.4) * dir;
  const tipY = WING.tipY;
  const topX = -(WING.topOuterX + spread * 0.3) * dir;
  const topY = WING.topOuterY;
  const botX = -(WING.botOuterX + spread * 0.3) * dir;
  const botY = WING.botOuterY;

  const hoverN = Noise.simplex3(time * 0.1, facing === 'left' ? 0 : 10, 0);
  const hoverY = hoverN * params.triangleHoverAmp;
  const mx = mouseX * 0.015;
  const my = mouseY * 0.015;

  // Glass vertices
  const gp = glassMesh.geometry.attributes.position;
  gp.setXYZ(0, tipX + mx, tipY + hoverY + my, 0);
  gp.setXYZ(1, topX + mx, topY + hoverY + my, 0);
  gp.setXYZ(2, botX + mx, botY + hoverY + my, 0);
  gp.needsUpdate = true;

  // Edge vertices
  const ep = edgeLine.geometry.attributes.position;
  ep.setXYZ(0, tipX + mx, tipY + hoverY + my, 0);
  ep.setXYZ(1, topX + mx, topY + hoverY + my, 0);
  ep.setXYZ(2, botX + mx, botY + hoverY + my, 0);
  ep.setXYZ(3, tipX + mx, tipY + hoverY + my, 0);
  ep.needsUpdate = true;

  // Glass uniforms
  const gu = glassMesh.material.uniforms;
  gu.uColor.value.set(...params.orbColor);
  gu.uGlowColor.value.set(...params.glowColor);
  gu.uGlassOpacity.value = params.triangleGlassOpacity;
  gu.uEdgeBrightness.value = params.triangleEdgeBrightness;
  gu.uTime.value = time;

  // Edge uniforms
  edgeLine.material.uniforms.uColor.value.set(...params.glowColor);
  edgeLine.material.uniforms.uOpacity.value = params.triangleGlow * 0.55;

  // Thinking: oscillate wing rotation
  if (params.rotationSpeed > 0) {
    wingGroup.rotation.z = Math.sin(time * params.rotationSpeed * Math.PI / 180) * 0.06 * -dir;
  } else {
    wingGroup.rotation.z *= 0.95;
  }
}

export const leftWing  = createWing('left');
export const rightWing = createWing('right');
