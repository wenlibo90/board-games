// 斗兽棋棋盘视图

import {
  RED, BLUE, SIZE, RANK_NAME, colorOf, rankOf, idx, xOf, yOf,
  inWater, isTrapOf, DEN, genMovesFrom,
} from './engine.js';
import { BoardStage } from '../../core/stage.js';

export const palettes = {
  light: {
    land1: '#e6d3a3', land2: '#d8c088', line: '#7a5a2e', water1: '#8fc4e0', water2: '#6fa9cf',
    denRed: '#f2c9b0', denBlue: '#bcd3ee', trap: '#c98a3a',
    disc1: '#fcf3df', disc2: '#e8d3a6', edgeLight: '#b08b52',
    red: '#b3261e', blue: '#1d4ed8', select: '#0d9488', target: 'rgba(13,148,136,0.85)',
    last: 'rgba(194,65,12,0.9)', hint: '#0d9488', decor: '#0d9488',
  },
  dark: {
    land1: '#4a4326', land2: '#3a341c', line: '#241f0f', water1: '#2b4a63', water2: '#1f3a4f',
    denRed: '#5c2f22', denBlue: '#22355c', trap: '#7a5524',
    disc1: '#f0e6cc', disc2: '#d6c295', edgeLight: '#8f7038',
    red: '#e2483d', blue: '#60a5fa', select: '#14b8a6', target: 'rgba(20,184,166,0.9)',
    last: 'rgba(249,115,22,0.95)', hint: '#14b8a6', decor: '#14b8a6',
  },
};

export function createView(canvas, opts = {}) {
  const palette = opts.palette || palettes.light;
  const state = { game: null, decor: [], hint: null, overlay: null };
  let cell = 40, ox = 0, oy = 0, r = 17;
  let selected = -1, targets = [], hover = -1;

  const stage = new BoardStage(canvas, {
    onHover: (pt) => { const i = pt ? hit(pt.x, pt.y) : -1; if (i !== hover) { hover = i; stage.render(); } },
    onPick: (pt) => { if (stage.interactive && state.game) pick(hit(pt.x, pt.y)); },
  });

  function point(i) { return { x: ox + xOf(i) * cell, y: oy + yOf(i) * cell }; }
  function hit(px, py) {
    const x = Math.round((px - ox) / cell), y = Math.round((py - oy) / cell);
    if (x < 0 || x >= 7 || y < 0 || y >= 9) return -1;
    const p = point(idx(x, y));
    if (Math.hypot(px - p.x, py - p.y) > cell * 0.55) return -1;
    return idx(x, y);
  }
  function layout(w, h) {
    const m = Math.min(w, h) * 0.06;
    cell = Math.min((w - 2 * m) / 6, (h - 2 * m) / 8);
    r = cell * 0.42;
    ox = (w - cell * 6) / 2;
    oy = (h - cell * 8) / 2;
  }

  function pick(i) {
    const g = state.game;
    if (i < 0) { selected = -1; targets = []; stage.render(); return; }
    if (selected >= 0 && targets.includes(i)) {
      const from = selected; selected = -1; targets = [];
      opts.onMove && opts.onMove({ from, to: i });
      return;
    }
    const p = g.board[i];
    if (p && colorOf(p) === g.turn) { selected = i; targets = genMovesFrom(g.board, i, g.turn).map((m) => m.to); }
    else { selected = -1; targets = []; }
    stage.render();
  }

  function draw(ctx, w, h) {
    const g = state.game;
    if (!g || w === 0) return;
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, palette.land1); grad.addColorStop(1, palette.land2);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);

    // 水面
    const wx = ox + 1 * cell, wy = oy + 3 * cell, ww = cell * 5, wh = cell * 3;
    const wg = ctx.createLinearGradient(wx, wy, wx, wy + wh);
    wg.addColorStop(0, palette.water1); wg.addColorStop(1, palette.water2);
    ctx.fillStyle = wg;
    ctx.fillRect(wx - cell * 0.5, wy - cell * 0.5, ww + cell, wh + cell);
    ctx.save();
    ctx.globalAlpha = 0.35; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, cell * 0.03);
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      for (let x = wx; x <= wx + ww; x += cell * 0.2) {
        const yy = wy + k * cell + Math.sin(x * 0.05) * cell * 0.08;
        if (x === wx) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.restore();

    // 网格
    ctx.strokeStyle = palette.line; ctx.lineWidth = Math.max(1, cell * 0.03);
    for (let y = 0; y < 9; y++) { ctx.beginPath(); ctx.moveTo(ox, oy + y * cell); ctx.lineTo(ox + 6 * cell, oy + y * cell); ctx.stroke(); }
    for (let x = 0; x < 7; x++) { ctx.beginPath(); ctx.moveTo(ox + x * cell, oy); ctx.lineTo(ox + x * cell, oy + 8 * cell); ctx.stroke(); }

    // 兽穴与陷阱
    const den = (i, color) => {
      const c = point(i);
      ctx.fillStyle = color === RED ? palette.denRed : palette.denBlue;
      ctx.fillRect(c.x - cell * 0.45, c.y - cell * 0.45, cell * 0.9, cell * 0.9);
      ctx.fillStyle = color === RED ? palette.red : palette.blue;
      ctx.font = `700 ${cell * 0.34}px "PingFang SC", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('穴', c.x, c.y + cell * 0.5);
    };
    den(DEN[BLUE], BLUE);
    den(DEN[RED], RED);
    for (const [color, traps] of [[BLUE, [idx(2, 0), idx(4, 0), idx(3, 1)]], [RED, [idx(2, 8), idx(4, 8), idx(3, 7)]]]) {
      for (const t of traps) {
        const c = point(t);
        ctx.strokeStyle = color === RED ? palette.red : palette.blue;
        ctx.lineWidth = Math.max(2, cell * 0.05);
        ctx.beginPath(); ctx.arc(c.x, c.y, cell * 0.34, 0, Math.PI * 2); ctx.stroke();
      }
    }

    // 上一步
    if (g.lastMove) {
      for (const i of [g.lastMove.from, g.lastMove.to]) {
        const c = point(i);
        ctx.strokeStyle = palette.last; ctx.lineWidth = Math.max(2, cell * 0.06);
        ctx.strokeRect(c.x - cell * 0.46, c.y - cell * 0.46, cell * 0.92, cell * 0.92);
      }
    }

    // 可走点
    for (const t of targets) {
      const c = point(t);
      ctx.fillStyle = palette.target;
      ctx.beginPath(); ctx.arc(c.x, c.y, Math.max(3, cell * 0.16), 0, Math.PI * 2); ctx.fill();
    }

    // 棋子
    for (let i = 0; i < SIZE; i++) {
      const p = g.board[i];
      if (!p) continue;
      const c = point(i);
      const isRed = colorOf(p) === RED;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = r * 0.4; ctx.shadowOffsetY = r * 0.13;
      const dg = ctx.createRadialGradient(c.x - r * 0.3, c.y - r * 0.35, r * 0.15, c.x, c.y, r);
      dg.addColorStop(0, palette.disc1); dg.addColorStop(1, palette.disc2);
      ctx.fillStyle = dg;
      ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = isRed ? palette.red : palette.blue;
      ctx.lineWidth = Math.max(1.5, r * 0.12);
      ctx.beginPath(); ctx.arc(c.x, c.y, r * 0.96, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = isRed ? palette.red : palette.blue;
      ctx.font = `700 ${r * 1.15}px "KaiTi", "STKaiti", "PingFang SC", serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(RANK_NAME[rankOf(p)], c.x, c.y + r * 0.04);
      if (i === selected) {
        ctx.strokeStyle = palette.select; ctx.lineWidth = Math.max(2.5, r * 0.16);
        ctx.beginPath(); ctx.arc(c.x, c.y, r * 1.14, 0, Math.PI * 2); ctx.stroke();
      }
    }

    for (const d of state.decor) {
      if (d.idx == null || d.idx < 0) continue;
      const c = point(d.idx);
      if (d.kind === 'label') {
        ctx.fillStyle = d.color || palette.decor;
        ctx.font = `700 ${Math.max(11, cell * 0.4)}px "PingFang SC", sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(d.text, c.x, c.y + cell * 0.62);
      } else if (d.kind === 'dot') {
        ctx.fillStyle = d.color || palette.decor;
        ctx.beginPath(); ctx.arc(c.x, c.y, Math.max(3, cell * 0.15), 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.strokeStyle = d.color || palette.decor; ctx.lineWidth = Math.max(2, cell * 0.07);
        ctx.beginPath(); ctx.arc(c.x, c.y, r * 1.12, 0, Math.PI * 2); ctx.stroke();
      }
    }

    if (state.hint) {
      for (const i of [state.hint.from, state.hint.to]) {
        const c = point(i);
        ctx.strokeStyle = palette.hint; ctx.lineWidth = Math.max(2.5, cell * 0.08);
        ctx.beginPath(); ctx.arc(c.x, c.y, r * 1.2, 0, Math.PI * 2); ctx.stroke();
      }
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
