precision highp float;
varying vec2 vUv;
uniform vec3 uCoreColor, uGlowColor;
uniform float uGlowRadius, uGlowIntensity, uBreath, uTime, uInnerPulse;

// noise.glsl injected at build time
NOISE_PLACEHOLDER

void main() {
  vec2 center = vUv - 0.5;
  float dist = length(center);
  float coreRadius = 0.12 + uBreath * 0.02;
  float core = smoothstep(coreRadius, coreRadius - 0.01, dist);
  float n1 = snoise(vec3(center * 8.0, uTime * 0.3)) * 0.5 + 0.5;
  float n2 = snoise(vec3(center * 14.0, uTime * 0.5 + 100.0)) * 0.3 + 0.5;
  vec3 coreCol = mix(uCoreColor, uGlowColor, n1 * 0.3 + n2 * uInnerPulse);
  coreCol *= 1.0 + n1 * 0.15;
  float gs = 0.35 * uGlowRadius * (1.0 + uBreath * 0.15);
  float g1 = exp(-dist*dist / (gs*0.08)) * 0.9 * uGlowIntensity;
  float g2 = exp(-dist*dist / (gs*0.25)) * 0.4 * uGlowIntensity;
  float g3 = exp(-dist*dist / (gs*0.6))  * 0.15 * uGlowIntensity;
  float gn = snoise(vec3(center * 3.0, uTime * 0.15)) * 0.08;
  vec3 color = vec3(0.0);
  color += uGlowColor * (g3 + gn * 0.3);
  color += mix(uGlowColor, uCoreColor, 0.5) * g2;
  color += uCoreColor * g1;
  color = mix(color, coreCol, core);
  float haze = exp(-dist*dist / (gs*1.8)) * 0.04 * uGlowIntensity;
  color += uGlowColor * haze;
  float alpha = clamp(max(max(g1,g2),max(g3,core)) + haze, 0.0, 1.0);
  gl_FragColor = vec4(color, alpha);
}
