precision highp float;
varying vec2 vUv;
varying vec3 vWorldPos;
uniform vec3 uColor, uGlowColor;
uniform float uGlassOpacity, uEdgeBrightness, uTime, uFacing;

NOISE_PLACEHOLDER

float distToSeg(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  float t = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0);
  return length(p - (a + ab * t));
}

void main() {
  // Triangle vertices in UV space
  // tip = inward point near orb, bT = top outer, bB = bottom outer
  float tipU = uFacing < 0.0 ? 1.0 : 0.0;
  float baseU = 1.0 - tipU;
  vec2 tip = vec2(tipU, 0.45);
  vec2 bT = vec2(baseU, 1.0);
  vec2 bB = vec2(baseU + 0.1 * uFacing, 0.0);
  vec2 pt = vUv;

  // How far from the tip toward the outer edge (0=at tip, 1=at outer edge)
  float outerProx = uFacing < 0.0 ? (1.0 - vUv.x) : vUv.x;

  // Distance to each edge
  float dTopEdge   = distToSeg(pt, tip, bT);   // top edge (tip to top-outer)
  float dBotEdge   = distToSeg(pt, tip, bB);   // bottom edge (tip to bot-outer)
  float dOuterEdge = distToSeg(pt, bT, bB);    // OUTER edge (top-outer to bot-outer)

  // All-edge glow (subtle, uniform)
  float minDist = min(min(dTopEdge, dBotEdge), dOuterEdge);
  float allEdgeGlow = exp(-minDist * minDist / 0.002) * uEdgeBrightness * 0.5;

  // OUTER EDGE gets the main highlight
  float outerEdgeGlow = exp(-dOuterEdge * dOuterEdge / 0.004) * uEdgeBrightness * 1.0;

  // Top edge gets a secondary, softer glow (it's the long sweeping line)
  float topEdgeGlow = exp(-dTopEdge * dTopEdge / 0.003) * uEdgeBrightness * 0.35;

  // Soft orb light bleed at the tip (subtle, not a hot spot)
  float tipDist = length(pt - tip);
  float tipBleed = exp(-tipDist * tipDist / 0.025) * uEdgeBrightness * 0.25;

  float combinedEdge = max(max(allEdgeGlow, outerEdgeGlow), max(topEdgeGlow, tipBleed));

  // Glass surface fill: brighter toward outer edge, dimmer at tip
  float noise1 = snoise(vec3(vWorldPos.xy * 5.0, uTime * 0.2)) * 0.3 + 0.5;
  float noise2 = snoise(vec3(vWorldPos.xy * 10.0, uTime * 0.35 + 50.0));

  float glassBase = uGlassOpacity * (0.15 + outerProx * 0.85);

  // Subtle light caustics
  float caustic = pow(max(0.0, snoise(vec3(vWorldPos.xy * 7.0 + uTime * 0.08, uTime * 0.12))), 3.0) * 0.08;

  // Shimmer that runs along the outer edge
  float shimmer = sin(outerProx * 10.0 + uTime * 0.4 + noise1 * 3.0) * 0.015 * uGlassOpacity;

  float fill = glassBase * (0.6 + noise1 * 0.4) + caustic + shimmer;

  // Color: blend toward glow color near the outer edge
  vec3 surfColor = mix(uColor, uGlowColor, outerProx * 0.5 + noise1 * 0.15);

  vec3 finalColor = surfColor * fill + uGlowColor * combinedEdge;

  // Subtle specular flicker
  float spec = max(0.0, noise2) * outerProx * 0.03 * uEdgeBrightness;
  finalColor += vec3(spec);

  float alpha = clamp(fill + combinedEdge, 0.0, 1.0);
  gl_FragColor = vec4(finalColor, alpha);
}
