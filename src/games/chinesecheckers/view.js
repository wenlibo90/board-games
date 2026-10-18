// 六角跳棋棋盘视图（六角星 121 孔位）

import { BOARD, N, EMPTY, RED, BLUE, colorName } from './engine.js';
import { BoardStage } from '../../core/stage.js';

export const palettes = {
  light: {
    bg1: '#f2ead8', bg2: '#e6dabf', hole: '#b9a680', holeEdge: '#9a8760',
    red1: '#e2483d', red2: '#a8281f', blue1: '#4f7ff0', blue2: '#1f3fa8',
    redZone: 'rgba(226,72,61,0.14)', blueZone: 'rgba(79,127,240,0.14)',
    sel: '#0d9488', target: 'rgba(13,148,136,0.85)', last: 'rgba(202,138,4,0.9)', hint: '#0d9488', decor: '#0d9488', text: '#5a4a2e',
  },
  dark: {
    bg1: '#33302a', bg2: '#26241f', hole: '#6a5f47', holeEdge: '#4a4232',
    red1: '#f87171', red2: '#b91c1c', blue1: '#60a5fa', blue2: '#1d4ed8',
    redZone: 'rgba(248,113,113,0.14)', blueZone: 'rgba(96,165,250,0.16)',
    sel: '#14b8a6', target: 'rgba(20,184,166,0.9)', last: 'rgba(250,204,21,0.9)', hint: '#14b8a6', decor: '#14b8a6', text: '#d8cdb5',
  },
};

export function createView(canvas, opts = {}) {
  const palette = opts.palette || palettes.light;
  const state = { game: null, decor: [], hint: null, overlay: null };
  let scale = 20, ox = 0, oy = 0, minX = 0, minY = 0;
  let selected = -1, targets = [], hover = -1;

  const stage = new BoardStage(canvas, {
    onHover: (pt) => { const i = pt ? hit(pt.x, pt.y) : -1; if (i !== hover) { hover = i; stage.render(); } },
    onPick: (pt) => { if (stage.interactive && state.game) pick(hit(pt.x, pt.y)); },
  });

  function px(i) { const c = BOARD.coords[i]; return { x: ox + (c.x - minX) * scale, y: oy + (c.y - minY) * scale }; }
  function hit(ax, ay) {
    let best = -1, bd = 1e9;
    for (let i = 0; i < N; i++) {
      const p = px(i); const d = Math.hypot(ax - p.x, ay - p.y);
      if (d < bd) { bd = d; best = i; }
    }
    return bd < scale * 0.6 ? best : -1;
  }
  function layout(w, h) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const c of BOARD.coords) { x0 = Math.min(x0, c.x); x1 = Math.max(x1, c.x); y0 = Math.min(y0, c.y); y1 = Math.max(y1, c.y); }
    minX = x0; minY = y0;
    const m = Math.min(w, h) * 0.06;
    scale = Math.min((w - 2 * m) / (x1 - x0), (h - 2 * m) / (y1 - y0));
    ox = (w - (x1 - x0) * scale) / 2;
    oy = (h - (y1 - y0) * scale) / 2;
  }
  function pick(i) {
    const g = state.game;
    if (i < 0) { selected = -1; targets = []; stage.render(); return; }
    if (selected >= 0 && targets.includes(i)) { const from = selected; selected = -1; targets = []; opts.onMove && opts.onMove({ from, to: i }); return; }
    if (g.cells[i] === g.turn) { selected = i; targets = g.legalMovesFrom(i).map((m) => m.to); }
    else { selected = -1; targets = []; }
    stage.render();
  }

  function marble(ctx, x, y, color) {
    const r = scale * 0.4;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = r * 0.5; ctx.shadowOffsetY = r * 0.15;
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.38, r * 0.1, x, y, r);
    if (color === RED) { g.addColorStop(0, palette.red1); g.addColorStop(1, palette.red2); }
    else { g.addColorStop(0, palette.blue1); g.addColorStop(1, palette.blue2); }
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function paint() {
    const ctx = stage.ctx, w = stage.width, h = stage.height;
    if (!state.game || w === 0) return;
    const g = state.game;
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, palette.bg1); bg.addColorStop(1, palette.bg2);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

    // 三角区着色
    const zone = (ids, color) => { ctx.fillStyle = color; for (const i of ids) { const p = px(i); ctx.beginPath(); ctx.arc(p.x, p.y, scale * 0.52, 0, Math.PI * 2); ctx.fill(); } };
    zone(BOARD.top, palette.redZone);
    zone(BOARD.bottom, palette.blueZone);

    // 孔位
    for (let i = 0; i < N; i++) {
      const p = px(i);
      ctx.fillStyle = palette.hole; ctx.beginPath(); ctx.arc(p.x, p.y, scale * 0.42, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = palette.holeEdge; ctx.lineWidth = Math.max(1, scale * 0.03); ctx.stroke();
    }

    if (g.lastMove) { for (const i of [g.lastMove.from, g.lastMove.to]) { const p = px(i); ctx.strokeStyle = palette.last; ctx.lineWidth = Math.max(2, scale * 0.06); ctx.beginPath(); ctx.arc(p.x, p.y, scale * 0.5, 0, Math.PI * 2); ctx.stroke(); } }
    for (const t of targets) { const p = px(t); ctx.fillStyle = palette.target; ctx.beginPath(); ctx.arc(p.x, p.y, scale * 0.18, 0, Math.PI * 2); ctx.fill(); }

    for (let i = 0; i < N; i++) { if (g.cells[i] === EMPTY) continue; const p = px(i); marble(ctx, p.x, p.y, g.cells[i]); if (i === selected) { ctx.strokeStyle = palette.sel; ctx.lineWidth = Math.max(2.5, scale * 0.07); ctx.beginPath(); ctx.arc(p.x, p.y, scale * 0.5, 0, Math.PI * 2); ctx.stroke(); } }

    for (const d of state.decor) {
      if (d.idx == null || d.idx < 0) continue; const p = px(d.idx);
      if (d.kind === 'label') { ctx.fillStyle = d.color || palette.decor; ctx.font = `700 ${scale * 0.5}px "PingFang SC", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(d.text, p.x, p.y); }
      else if (d.kind === 'dot') { ctx.fillStyle = d.color || palette.decor; ctx.beginPath(); ctx.arc(p.x, p.y, scale * 0.18, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.strokeStyle = d.color || palette.decor; ctx.lineWidth = Math.max(2, scale * 0.07); ctx.beginPath(); ctx.arc(p.x, p.y, scale * 0.5, 0, Math.PI * 2); ctx.stroke(); }
    }
    if (state.hint) { for (const i of [state.hint.from, state.hint.to]) { const p = px(i); ctx.strokeStyle = palette.hint; ctx.lineWidth = Math.max(2.5, scale * 0.07); ctx.beginPath(); ctx.arc(p.x, p.y, scale * 0.52, 0, Math.PI * 2); ctx.stroke(); } }
  }

  stage.bindDraw(() => { layout(stage.width, stage.height); paint(); });

  return {
    get interactive() { return stage.interactive; },
    set interactive(v) { stage.interactive = v; selected = -1; targets = []; stage.render(); },
    setPalette(p) { Object.assign(palette, p); stage.render(); },
    setDecor(l) { state.decor = l || []; },
    setHint(m) { state.hint = m && m.from != null ? m : null; },
    setOverlay() {},
    render(game) { if (game) { if (game !== state.game) { selected = -1; targets = []; } state.game = game; } stage.render(); },
    resize() { stage.resize(); },
  };
}
