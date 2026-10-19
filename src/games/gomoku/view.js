// 五子棋棋盘视图：木纹棋盘、落子动画、最后落子脉冲、连珠发光
import { EMPTY, BLACK, WHITE } from './engine.js';
import { BoardStage } from '../../core/stage.js';

const COORD_LETTERS = 'ABCDEFGHJKLMNOPQRSTUVWXYZ';

// 木纹与棋子配色
const PALETTE = {
  board1: '#e7af5c', board2: '#d8983c', board3: '#c07d24',
  line: 'rgba(0, 0, 0, 0.45)', star: 'rgba(0, 0, 0, 0.85)',
  coord: 'rgba(60, 40, 12, 0.5)',
  black1: '#444444', black2: '#1a1a1a', black3: '#000000',
  white1: '#ffffff', white2: '#ececec', white3: '#bbbbbb', whiteEdge: 'rgba(120,120,120,0.5)',
  shadow: 'rgba(0, 0, 0, 0.5)',
  accent: '#d29034', hint: '#d29034', ghost: 'rgba(255,255,255,0.35)',
  lastOnBlack: '#d29034', lastOnWhite: '#d29034',
};

export const palettes = { light: PALETTE, dark: PALETTE };

function starPoints(size) {
  if (size === 15) return [[3, 3], [11, 3], [3, 11], [11, 11], [7, 7]];
  if (size === 13) return [[3, 3], [9, 3], [3, 9], [9, 9], [6, 6]];
  const e = 3, m = (size - 1) / 2;
  const pts = [];
  for (const y of [e, m, size - 1 - e]) for (const x of [e, m, size - 1 - e]) pts.push([x, y]);
  return pts;
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const RAF = (cb) => (typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame(cb) : setTimeout(cb, 16));

function ease(t) { return t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3); }

export function createView(canvas, opts = {}) {
  const palette = opts.palette || PALETTE;
  const state = { game: null, size: 15, stars: starPoints(15), decor: [], hint: -1, overlay: null, ghost: true };
  let cell = 30, ox = 0, oy = 0, r = 13, margin = 22, hover = -1;
  let animIdx = -1, animStart = 0, lastSeenMove = -1;
  let loopActive = false, rafId = null;

  const stage = new BoardStage(canvas, {
    onHover: (pt) => {
      const i = pt ? hit(pt.x, pt.y) : -1;
      if (i !== hover) { hover = i; stage.render(); }
    },
    onPick: (pt) => {
      if (!stage.interactive || !state.game) return;
      const i = hit(pt.x, pt.y);
      if (i < 0 || state.game.board[i] !== EMPTY) return;
      opts.onMove && opts.onMove(i);
    },
  });

  function point(i) { return { x: ox + (i % state.size) * cell, y: oy + ((i / state.size) | 0) * cell }; }
  function hit(px, py) {
    const c = Math.round((px - ox) / cell), rw = Math.round((py - oy) / cell);
    const n = state.size;
    if (c < 0 || c >= n || rw < 0 || rw >= n) return -1;
    const p = point(rw * n + c);
    if (Math.hypot(px - p.x, py - p.y) > cell * 0.62) return -1;
    return rw * n + c;
  }
  function layout(w, h) {
    const n = state.size;
    margin = Math.max(w * 0.045, 16);
    const usable = Math.min(w, h) - margin * 2;
    cell = usable / (n - 1);
    r = cell * 0.46;
    ox = (w - cell * (n - 1)) / 2;
    oy = (h - cell * (n - 1)) / 2;
  }

  function drawWood(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, palette.board1);
    g.addColorStop(0.5, palette.board2);
    g.addColorStop(1, palette.board3);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // 顶部高光
    const hl = ctx.createRadialGradient(w * 0.5, -h * 0.2, 0, w * 0.5, -h * 0.2, h * 0.9);
    hl.addColorStop(0, 'rgba(255,255,255,0.16)');
    hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl;
    ctx.fillRect(0, 0, w, h);
    // 木纹
    ctx.save();
    ctx.strokeStyle = 'rgba(82, 48, 10, 0.06)';
    ctx.lineWidth = Math.max(1, cell * 0.05);
    for (let x = w * 0.03; x < w; x += cell * 0.7) {
      ctx.beginPath();
      for (let y = 0; y <= h; y += h / 24) {
        const wob = Math.sin(y * 0.03 + x) * cell * 0.06;
        if (y === 0) ctx.moveTo(x + wob, y); else ctx.lineTo(x + wob, y);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(82, 48, 10, 0.03)';
    for (let y = h * 0.05; y < h; y += cell * 0.9) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.restore();
  }

  function stone(ctx, x, y, color, scale = 1, dyOff = 0) {
    const rr = r * scale;
    const cy = y + dyOff;
    ctx.save();
    ctx.shadowColor = palette.shadow;
    ctx.shadowBlur = rr * 0.6;
    ctx.shadowOffsetY = rr * 0.18;
    const g = ctx.createRadialGradient(x - rr * 0.32, cy - rr * 0.35, rr * 0.05, x, cy, rr * 1.05);
    if (color === BLACK) {
      g.addColorStop(0, palette.black1);
      g.addColorStop(0.45, palette.black2);
      g.addColorStop(0.8, '#0a0a0a');
      g.addColorStop(1, palette.black3);
    } else {
      g.addColorStop(0, palette.white1);
      g.addColorStop(0.25, '#fdfdfd');
      g.addColorStop(0.55, palette.white2);
      g.addColorStop(0.8, '#dfdfdf');
      g.addColorStop(1, palette.white3);
    }
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, cy, rr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function paint() {
    const ctx = stage.ctx, w = stage.width, h = stage.height;
    if (!state.game || w === 0) return;
    const g = state.game;
    const n = state.size;
    const t = now();
    ctx.clearRect(0, 0, w, h);
    drawWood(ctx, w, h);

    const end = ox + cell * (n - 1);
    const endY = oy + cell * (n - 1);
    ctx.strokeStyle = palette.line;
    ctx.lineWidth = Math.max(1, cell * 0.03);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = ox + i * cell, y = oy + i * cell;
      ctx.moveTo(x, oy); ctx.lineTo(x, endY);
      ctx.moveTo(ox, y); ctx.lineTo(end, y);
    }
    ctx.stroke();
    ctx.lineWidth = Math.max(1.5, cell * 0.05);
    ctx.strokeRect(ox, oy, end - ox, endY - oy);

    ctx.fillStyle = palette.star;
    for (const [x, y] of state.stars) {
      ctx.beginPath();
      ctx.arc(ox + x * cell, oy + y * cell, Math.max(2, cell * 0.1), 0, Math.PI * 2);
      ctx.fill();
    }

    // 棋子（最后落子带下落动画）
    for (let i = 0; i < g.board.length; i++) {
      const v = g.board[i];
      if (v === EMPTY) continue;
      const p = point(i);
      if (i === animIdx && i === g.lastMove) {
        // 落子动画：棋子从观者正前方落到盘面——由大缩小（近→落定），投影由虚大收缩到实
        const prog = ease((t - animStart) / 300);
        const lift = 1 - prog; // 悬空程度
        const scale = 1 + lift * lift * 0.6 - Math.sin(prog * Math.PI) * 0.06;
        ctx.save();
        ctx.globalAlpha = 0.3 * (0.35 + 0.65 * prog);
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + r * 0.2, r * (0.72 + lift * 0.85), r * (0.34 + lift * 0.48), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(scale, scale);
        stone(ctx, 0, 0, v, 1, 0);
        ctx.restore();
      } else {
        stone(ctx, p.x, p.y, v, 1, 0);
      }
    }

    // 连珠获胜高亮（脉冲）
    if (g.winLine) {
      const a = point(g.winLine[0]);
      const b = point(g.winLine[g.winLine.length - 1]);
      const dash = (-(t / 24) % 40);
      ctx.save();
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = Math.max(4, cell * 0.18);
      ctx.lineCap = 'round';
      ctx.setLineDash([20, 20]);
      ctx.lineDashOffset = dash;
      ctx.shadowColor = palette.accent;
      ctx.shadowBlur = (Math.sin(t / 200) * 0.5 + 0.5) * 14 + 6;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.restore();
      // 获胜棋子脉冲
      const pulse = 1 + Math.sin(t / 180) * 0.06;
      for (const i of g.winLine) {
        const p = point(i);
        ctx.save();
        ctx.shadowColor = palette.accent;
        ctx.shadowBlur = 16;
        stone(ctx, p.x, p.y, g.board[i], pulse, 0);
        ctx.restore();
      }
    }

    // 装饰
    for (const d of state.decor) {
      if (d.idx == null || d.idx < 0) continue;
      const p = point(d.idx);
      if (d.kind === 'label') {
        ctx.fillStyle = d.color || palette.accent;
        ctx.font = `700 ${Math.max(11, cell * 0.5)}px "Noto Serif SC", serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(d.text, p.x, p.y);
      } else if (d.kind === 'dot' || d.kind === 'liberty') {
        ctx.fillStyle = d.color || palette.accent;
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(2, cell * 0.13), 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.strokeStyle = d.color || palette.accent;
        ctx.lineWidth = Math.max(2, cell * 0.07);
        ctx.beginPath(); ctx.arc(p.x, p.y, cell * 0.4, 0, Math.PI * 2); ctx.stroke();
      }
    }

    // 最后落子脉冲金点
    if (g.lastMove >= 0 && g.board[g.lastMove] !== EMPTY && !g.winLine) {
      const p = point(g.lastMove);
      const pulse = 1 + Math.sin(t / 300) * 0.35;
      ctx.save();
      ctx.fillStyle = palette.accent;
      ctx.shadowColor = palette.accent;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 0.24 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 提示点
    if (state.hint >= 0 && g.board[state.hint] === EMPTY) {
      const p = point(state.hint);
      ctx.strokeStyle = palette.hint;
      ctx.lineWidth = Math.max(2, cell * 0.08);
      ctx.beginPath(); ctx.arc(p.x, p.y, cell * 0.36, 0, Math.PI * 2); ctx.stroke();
    }

    // 悬停预览（半透明光点）
    if (state.ghost && stage.interactive && hover >= 0 && g.board[hover] === EMPTY && !g.ended) {
      const p = point(hover);
      ctx.save();
      ctx.fillStyle = palette.ghost;
      ctx.shadowColor = 'rgba(255,255,255,0.55)';
      ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(p.x, p.y, cell * 0.24, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  function needsAnim(g, t) {
    if (!g) return false;
    if (g.winLine) return true;
    if (animIdx >= 0 && t - animStart < 500) return true;
    return false;
  }
  function loop() {
    rafId = null;
    const g = state.game;
    if (!g || !stage.canvas.isConnected) { loopActive = false; return; }
    stage.render();
    if (needsAnim(g, now())) { rafId = RAF(loop); } else { loopActive = false; }
  }
  function kick() {
    if (loopActive) return;
    loopActive = true;
    rafId = RAF(loop);
  }

  stage.bindDraw(() => { layout(stage.width, stage.height); paint(); });

  return {
    get interactive() { return stage.interactive; },
    set interactive(v) { stage.interactive = v; stage.render(); },
    setPalette(p) { Object.assign(palette, p); stage.render(); },
    setDecor(l) { state.decor = l || []; },
    setHint(m) { state.hint = typeof m === 'number' ? m : -1; },
    setOverlay() {},
    render(game) {
      if (game) {
        if (game.size !== state.size) { state.size = game.size; state.stars = starPoints(game.size); }
        if (game.lastMove >= 0 && game.lastMove !== lastSeenMove) {
          lastSeenMove = game.lastMove;
          animIdx = game.lastMove;
          animStart = now();
        }
        state.game = game;
      }
      stage.render();
      kick();
    },
    resize() { stage.resize(); kick(); },
  };
}
