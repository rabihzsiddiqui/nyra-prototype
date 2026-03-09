export const TEXT_CONFIG = {
  fontFamily: "'IBM Plex Sans', sans-serif",
  fontSize: '16px',
  letterSpacing: '0.02em',
  lineHeight: '1.65',
  maxWidth: '500px',
  textAlign: 'left',
  opacityByState: {
    idle:      0,
    listening: 0.6,
    thinking:  0.6,
    speaking:  0.8,
  },
  fadeDuration: 500,    // ms
  revealSpeed: 40,      // characters per second
  demoResponse: "Hello. I'm Nyra, your ambient assistant. How can I help you today?",
};
