import * as THREE from 'three';
import { CONFIG } from './config.js';
import noiseGlsl from './glsl/noise.glsl?raw';
import orbVert from './glsl/orb.vert?raw';
import orbFragRaw from './glsl/orb.frag?raw';

const orbFrag = orbFragRaw.replace('NOISE_PLACEHOLDER', noiseGlsl);

const orbMaterial = new THREE.ShaderMaterial({
  vertexShader: orbVert,
  fragmentShader: orbFrag,
  uniforms: {
    uCoreColor:     { value: new THREE.Vector3(...CONFIG.states.idle.orbColor) },
    uGlowColor:     { value: new THREE.Vector3(...CONFIG.states.idle.glowColor) },
    uGlowRadius:    { value: 1.0 },
    uGlowIntensity: { value: 1.0 },
    uBreath:        { value: 0.0 },
    uTime:          { value: 0.0 },
    uInnerPulse:    { value: 0.0 },
  },
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const orbMesh = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), orbMaterial);

export function updateOrb(params, time, breath) {
  orbMaterial.uniforms.uCoreColor.value.set(...params.orbColor);
  orbMaterial.uniforms.uGlowColor.value.set(...params.glowColor);
  orbMaterial.uniforms.uGlowRadius.value = params.glowRadius;
  orbMaterial.uniforms.uGlowIntensity.value = params.glowIntensity;
  orbMaterial.uniforms.uBreath.value = breath;
  orbMaterial.uniforms.uTime.value = time;
  orbMaterial.uniforms.uInnerPulse.value = params.innerPulse;
}

export { orbMesh };
