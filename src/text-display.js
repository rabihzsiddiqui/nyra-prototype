import { TEXT_CONFIG } from './text-config.js';

let container        = null;
let breathLayer      = null;  // inner div: per-frame opacity, no CSS transition
let textSpan         = null;
let doneWrapper      = null;  // outer div: controls 300ms fade-in via opacity transition
let doneDot          = null;  // inner div: holds pulse animation (scale + opacity)
let currentStateName = null;
let currentParams    = null;

// Active timers / handlers -- all cleared together on any state change
let dotsInterval = null;   // listening ellipsis
let revealTimer  = null;   // speaking character reveal (setInterval)
let clickHandler = null;   // dismiss-on-click, active only after reveal completes

function injectKeyframes() {
  if (document.getElementById('nyra-text-styles')) return;
  const style = document.createElement('style');
  style.id = 'nyra-text-styles';
  style.textContent = `
    @keyframes nyra-char-pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.45; }
    }
    @keyframes nyra-done-pulse {
      0%, 100% { transform: scale(1.2); opacity: 0.8; }
      50%       { transform: scale(0.8); opacity: 0.4; }
    }
  `;
  document.head.appendChild(style);
}

function clearAnimations() {
  if (dotsInterval) { clearInterval(dotsInterval); dotsInterval = null; }
  if (revealTimer)  { clearInterval(revealTimer);  revealTimer  = null; }
  if (clickHandler) { document.removeEventListener('click', clickHandler); clickHandler = null; }
  if (container) {
    container.style.transition =
      `opacity ${TEXT_CONFIG.fadeDuration}ms ease, border-color ${TEXT_CONFIG.fadeDuration}ms ease`;
  }
  if (doneWrapper) doneWrapper.style.opacity = '0';
}

export function createTextOverlay() {
  injectKeyframes();

  container = document.createElement('div');
  Object.assign(container.style, {
    // Fixed position -- never moves regardless of state or orb glow
    position:              'fixed',
    bottom:                '13%',
    left:                  '50%',
    transform:             'translateX(-50%)',

    // Box dimensions: fixed width and height so content never shifts the box
    width:                 '90%',
    maxWidth:              '520px',
    height:                '88px',
    boxSizing:             'border-box',
    overflow:              'hidden',

    // Panel styling: Zelda-inspired dialogue box, modernized
    background:            'rgba(0, 0, 0, 0.76)',
    border:                '1px solid rgba(255, 255, 255, 0.10)',
    borderRadius:          '10px',
    backdropFilter:        'blur(6px)',
    WebkitBackdropFilter:  'blur(6px)',

    // Flex-center text within the fixed box
    display:               'flex',
    alignItems:            'center',
    justifyContent:        'center',
    padding:               '0 24px',

    // Interaction + layering
    pointerEvents:         'none',
    zIndex:                '5',

    // Fade in/out + border-color state transition
    opacity:               '0',
    transition:            `opacity ${TEXT_CONFIG.fadeDuration}ms ease, border-color ${TEXT_CONFIG.fadeDuration}ms ease`,
  });

  // breathLayer: no transition -- updated every frame for breath sync
  breathLayer = document.createElement('div');
  Object.assign(breathLayer.style, {
    width:   '100%',
    opacity: '1',
  });

  textSpan = document.createElement('span');
  Object.assign(textSpan.style, {
    display:       'block',
    width:         '100%',
    textAlign:     TEXT_CONFIG.textAlign,
    fontFamily:    TEXT_CONFIG.fontFamily,
    fontSize:      TEXT_CONFIG.fontSize,
    letterSpacing: TEXT_CONFIG.letterSpacing,
    lineHeight:    TEXT_CONFIG.lineHeight,
    fontWeight:    '300',
    color:         'rgba(255, 255, 255, 0.6)',
    transition:    `color ${TEXT_CONFIG.fadeDuration}ms ease`,
  });

  breathLayer.appendChild(textSpan);
  container.appendChild(breathLayer);

  // Done indicator: wrapper handles the 300ms fade-in; inner dot has the pulse animation.
  // Two divs are needed because CSS transition and animation cannot both drive opacity on
  // the same element -- the wrapper's transition controls visibility, the dot's animation
  // controls the scale+opacity pulse cycle.
  doneWrapper = document.createElement('div');
  Object.assign(doneWrapper.style, {
    position:   'absolute',
    bottom:     '8px',
    right:      '8px',
    opacity:    '0',
    transition: 'opacity 300ms ease',
  });

  doneDot = document.createElement('div');
  Object.assign(doneDot.style, {
    width:        '8px',
    height:       '8px',
    borderRadius: '50%',
    animation:    'nyra-done-pulse 1.5s ease-in-out infinite',
  });

  doneWrapper.appendChild(doneDot);
  container.appendChild(doneWrapper);

  document.body.appendChild(container);

  return { container, textSpan };
}

// Called every frame from the render loop.
// Only handles breath sync -- position is fixed.
export function tick(breath) {
  if (!breathLayer) return;
  // ±3% opacity in sync with the orb's breath.
  // Scale 0.15 maps max breathAmplitude (0.20) → ±0.03.
  const breathOpacity = Math.min(1.0, Math.max(0.94, 1 + breath * 0.15));
  breathLayer.style.opacity = breathOpacity.toFixed(3);
}

// r, g, b are 0-1 floats from Three.js glowColor
export function setColor(r, g, b, opacity) {
  if (!textSpan) return;
  const ri = Math.round(r * 255);
  const gi = Math.round(g * 255);
  const bi = Math.round(b * 255);
  textSpan.style.color = `rgba(${ri},${gi},${bi},${opacity})`;
}

// Updates the panel border to match the current state's glow color at low opacity.
function setBoxColor(r, g, b) {
  if (!container) return;
  const ri = Math.round(r * 255);
  const gi = Math.round(g * 255);
  const bi = Math.round(b * 255);
  container.style.borderColor = `rgba(${ri},${gi},${bi},0.28)`;
}

export function fadeOut() {
  if (!container) return;
  clearAnimations();
  container.style.opacity = '0';
}

export function showStatus(text) {
  if (!textSpan || !container) return;
  clearAnimations();

  // Wipe any content from a previous state (char spans, partial reveal, etc.)
  textSpan.innerHTML = '';

  if (text === 'Listening...') {
    textSpan.textContent = 'Listening';
    let dots = 0;
    dotsInterval = setInterval(() => {
      dots = (dots + 1) % 4;
      textSpan.textContent = 'Listening' + '.'.repeat(dots);
    }, 600);

  } else if (text === 'Thinking...') {
    textSpan.innerHTML = [...text].map((ch, i) => {
      const delay = (i * 0.12).toFixed(2);
      return `<span style="animation:nyra-char-pulse 3s ease-in-out ${delay}s infinite">${ch}</span>`;
    }).join('');

  } else {
    textSpan.textContent = text;
  }

  if (currentParams) {
    const opacity = TEXT_CONFIG.opacityByState[currentStateName] ?? 0;
    const [r, g, b] = currentParams.glowColor;
    setColor(r, g, b, opacity);
    setBoxColor(r, g, b);
  }
  container.style.opacity = '1';
}

// Builds a per-character color map for the given text.
// Returns an array of length text.length where each entry is a CSS color
// string if that character belongs to a colored word, or null otherwise.
function buildCharColors(text) {
  const colors = new Array(text.length).fill(null);
  for (const [word, color] of Object.entries(TEXT_CONFIG.wordColors ?? {})) {
    let pos = 0;
    while ((pos = text.indexOf(word, pos)) !== -1) {
      for (let i = 0; i < word.length; i++) {
        colors[pos + i] = color;
      }
      pos += word.length;
    }
  }
  return colors;
}

export function revealText(text) {
  if (!textSpan || !container) return;
  clearAnimations();
  textSpan.innerHTML = '';

  if (currentParams) {
    const opacity = TEXT_CONFIG.opacityByState[currentStateName] ?? 0;
    const [r, g, b] = currentParams.glowColor;
    setColor(r, g, b, opacity);
    setBoxColor(r, g, b);
  }
  container.style.opacity = '1';

  const chars = [...text];
  const charColors = buildCharColors(text);
  let idx = 0;
  const msPerChar = Math.round(1000 / TEXT_CONFIG.revealSpeed);

  revealTimer = setInterval(() => {
    if (idx >= chars.length) {
      clearInterval(revealTimer);
      revealTimer = null;

      // Show done indicator using the current state's glow color
      if (doneDot && currentParams) {
        const [r, g, b] = currentParams.glowColor;
        const ri = Math.round(r * 255);
        const gi = Math.round(g * 255);
        const bi = Math.round(b * 255);
        doneDot.style.background = `rgba(${ri},${gi},${bi},0.6)`;
      }
      if (doneWrapper) doneWrapper.style.opacity = '1';

      // Box stays until the user clicks anywhere on the screen
      const dismiss = () => {
        document.removeEventListener('click', dismiss);
        clickHandler = null;
        if (container) {
          container.style.transition = 'opacity 400ms ease';
          container.style.opacity = '0';
          if (doneWrapper) doneWrapper.style.opacity = '0';
        }
      };
      clickHandler = dismiss;
      document.addEventListener('click', dismiss);
      return;
    }

    const charColor = charColors[idx];
    const ch = chars[idx++];
    const span = document.createElement('span');
    span.textContent = ch;
    span.style.opacity    = '1';
    span.style.transition = 'opacity 200ms ease';
    if (charColor) span.style.color = charColor;
    textSpan.appendChild(span);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        span.style.opacity = '0.85';
      });
    });
  }, msPerChar);
}

// Called from main.js on every state change (via setState).
export function update(params, stateName) {
  if (!container) return;
  if (stateName === currentStateName) return;

  currentStateName = stateName;
  currentParams    = params;

  if (stateName === 'idle') {
    fadeOut();
    return;
  }

  if (stateName === 'listening') {
    showStatus('Listening...');
    return;
  }

  if (stateName === 'thinking') {
    showStatus('Thinking...');
    return;
  }

  if (stateName === 'speaking') {
    revealText(TEXT_CONFIG.demoResponse);
    return;
  }
}
