// 韩国象棋棋盘视图

import {
  RED, K, SIZE, LABEL, colorOf, typeOf, idx, xOf, yOf, legalMovesFrom, inCheck, findKing,
} from './engine.js';
import { BoardStage } from '../../core/stage.js';

export const palettes = {
  light: {
    board1: '#edd7a6', board2: '#dfc184', line: '#6f5028', coord: '#7a5a2e',
    disc1: '#fcf3df', disc2: '#e8d3a6', edgeLight: '#c9ad78',
    redChar: '#b3261e', blueChar: '#1d4ed8', redRing: '#b3261e', blueRing: '#1d4ed8',
    select: '#0d9488', target: 'rgba(13,148,136,0.85)', hint: '#0d9488', last: 'rgba(194,65,12,0.9)',
    check: '#e11d48', decor: '#0d9488', palace: '#7a5a2e',
  },
  dark: {
    board1: '#c2a468', board2: '#a6863f', line: '#46331a', coord: '#5a4228',
    disc1: '#f2e7cd', disc2: '#dcc79c', edgeLight: '#b08f57',
    redChar: '#e2483d', blueChar: '#60a5fa', redRing: '#e2483d', blueRing: '#60a5fa',
    select: '#14b8a6', target: 'rgba(20,184,166,0.9)', hint: '#14b8a6', last: 'rgba(249,115,22,0.95)',
    check: '#fb7185', decor: '#14b8a6', palace: '#46331a',
  },
};

export function createView(canvas, opts = {}) {
  const palette = opts.palette || palettes.light;
  const state = { game: null, decor: [], hint: null, overlay: null };
  let cell = 30, ox = 0, oy = 0, r = 13, selected = -1, targets = [], hover = -1;

  const stage = new BoardStage(canvas, {
    onHover: (pt) => { const i = pt ? hit(pt.x, pt.y) : -1; if (i !== hover) { hover = i; stage.render(); } },
    onPick: (pt) => { if (stage.interactive && state.game) pick(hit(pt.x, pt.y)); },
  });

  function point(i) { return { x: ox + xOf(i) * cell, y: oy + yOf(i) * cell }; }
  function hit(px, py) {
    const x = Math.round((px - ox) / cell), y = Math.round((py - oy) / cell);
    if (x < 0 || x >= 9 || y < 0 || y >= 10) return -1;
    const p = point(idx(x, y));
    if (Math.hypot(px - p.x, py - p.y) > cell * 0.55) return -1;
    return idx(x, y);
  }
  function layout(w, h) {
    const m = Math.min(w, h) * 0.05;
    cell = Math.min((w - 2 * m) / 8, (h - 2 * m) / 9);
    r = cell * 0.42;
    ox = (w - cell * 8) / 2; oy = (h - cell * 9) / 2;
  }
  function pick(i) {
    const g = state.game;
    if (i < 0) { selected = -1; targets = []; stage.render(); return; }
    if (selected >= 0 && targets.includes(i)) { const from = selected; selected = -1; targets = []; opts.onMove && opts.onMove({ from, to: i }); return; }
    const p = g.board[i];
    if (p && colorOf(p) === g.turn) { selected = i; targets = legalMovesFrom(g.board, i, g.turn).map((m) => m.to); }
    else { selected = -1; targets = []; }
    stage.render();
  }

  function draw(ctx, w, h) {
    const g = state.game;
    if (!g || w === 0) return;
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, palette.board1); grad.addColorStop(1, palette.board2);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);

    const gx1 = ox + 8 * cell, gy1 = oy + 9 * cell;
    ctx.strokeStyle = palette.line; ctx.lineWidth = Math.max(1, cell * 0.03);
    ctx.beginPath();
    for (let i = 0; i < 9; i++) { ctx.moveTo(ox + i * cell, oy); ctx.lineTo(ox + i * cell, gy1); }
    for (let j = 0; j < 10; j++) { ctx.moveTo(ox, oy + j * cell); ctx.lineTo(gx1, oy + j * cell); }
    ctx.stroke();
    ctx.lineWidth = Math.max(1.5, cell * 0.06);
    ctx.strokeRect(ox, oy, 8 * cell, 9 * cell);

    // 九宫斜线
    ctx.lineWidth = Math.max(1, cell * 0.03);
    ctx.beginPath();
    ctx.moveTo(ox + 3 * cell, oy); ctx.lineTo(ox + 5 * cell, oy + 2 * cell);
    ctx.moveTo(ox + 5 * cell, oy); ctx.lineTo(ox + 3 * cell, oy + 2 * cell);
    ctx.moveTo(ox + 3 * cell, oy + 7 * cell); ctx.lineTo(ox + 5 * cell, oy + 9 * cell);
    ctx.moveTo(ox + 5 * cell, oy + 7 * cell); ctx.lineTo(ox + 3 * cell, oy + 9 * cell);
    ctx.stroke();

    ctx.fillStyle = palette.coord;
    ctx.font = `${cell * 0.5}px "PingFang SC", serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('楚', ox + 2 * cell, oy + 4.5 * cell);
    ctx.fillText('漢', ox + 6 * cell, oy + 4.5 * cell);

    if (g.lastMove) {
      for (const i of [g.lastMove.from, g.lastMove.to]) {
        const c = point(i);
        ctx.strokeStyle = palette.last; ctx.lineWidth = Math.max(2, cell * 0.07);
        const s = r * 1.15; ctx.strokeRect(c.x - s, c.y - s, s * 2, s * 2);
      }
    }
    if (g.inCheck && g.inCheck(g.turn)) {
      const kp = findKing(g.board, g.turn);
      if (kp >= 0) { const c = point(kp); ctx.strokeStyle = palette.check; ctx.lineWidth = Math.max(2.5, r * 0.16); ctx.beginPath(); ctx.arc(c.x, c.y, r * 1.16, 0, Math.PI * 2); ctx.stroke(); }
    }
    for (const t of targets) { const c = point(t); ctx.fillStyle = palette.target; ctx.beginPath(); ctx.arc(c.x, c.y, Math.max(3, cell * 0.15), 0, Math.PI * 2); ctx.fill(); }

    for (let i = 0; i < SIZE; i++) {
      const p = g.board[i]; if (!p) continue;
      const c = point(i); const isRed = colorOf(p) === RED;
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = r * 0.4; ctx.shadowOffsetY = r * 0.13;
      const dg = ctx.createRadialGradient(c.x - r * 0.3, c.y - r * 0.35, r * 0.15, c.x, c.y, r);
      dg.addColorStop(0, palette.disc1); dg.addColorStop(1, palette.disc2);
      ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = isRed ? palette.redRing : palette.blueRing; ctx.lineWidth = Math.max(1.5, r * 0.12);
      ctx.beginPath(); ctx.arc(c.x, c.y, r * 0.94, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = Math.max(1, r * 0.05); ctx.beginPath(); ctx.arc(c.x, c.y, r * 0.78, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = isRed ? palette.redChar : palette.blueChar;
      ctx.font = `700 ${r * 1.12}px "KaiTi", "STKaiti", "PingFang SC", serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(LABEL[p], c.x, c.y + r * 0.04);
      if (i === selected) { ctx.strokeStyle = palette.select; ctx.lineWidth = Math.max(2.5, r * 0.16); ctx.beginPath(); ctx.arc(c.x, c.y, r * 1.12, 0, Math.PI * 2); ctx.stroke(); }
    }

    for (const d of state.decor) {
      if (d.idx == null || d.idx < 0) continue; const c = point(d.idx);
      if (d.kind === 'label') { ctx.fillStyle = d.color || palette.decor; ctx.font = `700 ${cell * 0.5}px "PingFang SC", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(d.text, c.x, c.y); }
      else if (d.kind === 'dot') { ctx.fillStyle = d.color || palette.decor; ctx.beginPath(); ctx.arc(c.x, c.y, Math.max(3, cell * 0.15), 0, Math.PI * 2); ctx.fill(); }
      else { ctx.strokeStyle = d.color || palette.decor; ctx.lineWidth = Math.max(2, cell * 0.07); ctx.beginPath(); ctx.arc(c.x, c.y, r * 1.12, 0, Math.PI * 2); ctx.stroke(); }
    }

    if (state.hint) {
      for (const i of [state.hint.from, state.hint.to]) { const c = point(i); ctx.strokeStyle = palette.hint; ctx.lineWidth = Math.max(2.5, cell * 0.08); ctx.beginPath(); ctx.arc(c.x, c.y, r * 1.2, 0, Math.PI * 2); ctx.stroke(); }
    }
  }

  stage.bindDraw(() => { layout(stage.width, stage.height); draw(stage.ctx, stage.width, stage.height); });

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
