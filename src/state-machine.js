export class StateMachine {
  constructor(config) {
    this.config = config;
    this.currentState = 'idle';
    this.current = { ...config.states.idle };
    this.target = { ...config.states.idle };
    this.transitioning = false;
    this.transitionStart = 0;
    this.transitionDuration = 0;
    this.from = { ...config.states.idle };
  }
  setState(name) {
    if (name === this.currentState && !this.transitioning) return;
    this.currentState = name;
    this.from = { ...this.current };
    this.target = { ...this.config.states[name] };
    this.transitioning = true;
    this.transitionStart = performance.now();
    this.transitionDuration = name === 'idle' ? this.config.transitions.toIdle : this.config.transitions.default;
  }
  update(now) {
    if (!this.transitioning) return;
    const elapsed = now - this.transitionStart;
    let t = Math.min(elapsed / this.transitionDuration, 1);
    t = this.config.transitions.easing(t);
    for (const key of Object.keys(this.target)) {
      if (typeof this.target[key] === 'string') {
        this.current[key] = t > 0.5 ? this.target[key] : this.from[key];
      } else if (Array.isArray(this.target[key])) {
        this.current[key] = this.from[key].map((v, i) => v + (this.target[key][i] - v) * t);
      } else {
        this.current[key] = this.from[key] + (this.target[key] - this.from[key]) * t;
      }
    }
    if (elapsed >= this.transitionDuration) {
      this.transitioning = false;
      this.current = { ...this.target };
    }
  }
  get params() { return this.current; }
}
