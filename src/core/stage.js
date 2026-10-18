// 共享 Canvas 舞台：负责 DPR、尺寸测量、指针事件归一化
// 各棋种的 view 只需实现绘制与命中测试

export class BoardStage {
  constructor(canvas, handlers = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onPick = handlers.onPick || (() => {});
    this.onHover = handlers.onHover || (() => {});
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this._draw = null;
    this._interactive = true;
    this._hoverEnabled = true;
    this._bindPointer();
    this._observe();
  }

  bindDraw(fn) {
    this._draw = fn;
  }

  get interactive() {
    return this._interactive;
  }

  set interactive(v) {
    this._interactive = !!v;
  }

  get hoverEnabled() {
    return this._hoverEnabled;
  }

  set hoverEnabled(v) {
    this._hoverEnabled = !!v;
  }

  _bindPointer() {
    const c = this.canvas;
    c.addEventListener('mousemove', (e) => {
      if (!this._hoverEnabled) return;
      this.onHover(this.toLocal(e));
    });
    c.addEventListener('mouseleave', () => {
      if (this._hoverEnabled) this.onHover(null);
    });
    c.addEventListener('click', (e) => {
      if (this._interactive) this.onPick(this.toLocal(e));
    });
    c.addEventListener(
      'touchstart',
      (e) => {
        if (this._hoverEnabled && e.touches.length === 1) this.onHover(this.toLocal(e.touches[0]));
      },
      { passive: true }
    );
    c.addEventListener(
      'touchend',
      (e) => {
        if (!this._interactive) return;
        const t = e.changedTouches[0];
        if (!t) return;
        this.onPick(this.toLocal(t));
        e.preventDefault();
      },
      { passive: false }
    );
    c.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  _observe() {
    if (typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(() => this.resize());
      this._ro.observe(this.canvas);
    } else {
      window.addEventListener('resize', () => this.resize());
    }
  }

  measure() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(rect.width || this.canvas.clientWidth || 300, 200);
    const height = Math.max(rect.height || this.canvas.clientHeight || 300, 200);
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    return { width, height };
  }

  resize() {
    this.measure();
    this.render();
  }

  render() {
    if (this.width === 0 || this.height === 0) this.measure();
    if (this._draw) this._draw(this.ctx, this.width, this.height);
  }

  toLocal(e) {
    const src = e.touches ? e.touches[0] : e;
    if (!src) return null;
    const rect = this.canvas.getBoundingClientRect();
    const sx = this.width / (rect.width || 1);
    const sy = this.height / (rect.height || 1);
    return { x: (src.clientX - rect.left) * sx, y: (src.clientY - rect.top) * sy };
  }
}
