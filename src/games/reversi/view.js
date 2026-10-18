// 黑白棋棋盘视图

import { EMPTY, BLACK, WHITE, N, idx, xOf, yOf, legalMovesAt } from './engine.js';
import { BoardStage } from '../../core/stage.js';

export const palettes = {
  light: {
    boardA: '#3f8459', boardB: '#357148', line: '#264f34', frame: '#2a5c3c',
    black1: '#6f6f74', black2: '#050505', white1: '#ffffff', white2: '#d7d3c8', whiteEdge: '#b9b3a6',
    shadow: 'rgba(0,0,0,0.45)', legal: 'rgba(255,255,255,0.32)', last: 'rgba(250,204,21,0.95)',
    hint: '#facc15', decor: '#facc15', coord: '#dfeee3',
  },
  dark: {
    boardA: '#2c5f42', boardB: '#245036', line: '#183122', frame: '#1b3a28',
    black1: '#6f6f74', black2: '#020203', white1: '#ffffff', white2: '#cfcabd', whiteEdge: '#a49e8f',
    shadow: 'rgba(0,0,0,0.6)', legal: 'rgba(255,255,255,0.3)', last: 'rgba(250,204,21,0.9)',
    hint: '#facc15', decor: '#facc15', coord: '#c8e0d2',
  },
};

export function createView(canvas, opts = {}) {
  const palette = opts.palette || palettes.light;
  const state = { game: null, decor: [], hint: -1, overlay: null, showCoordinates: true };
  let cell = 60, ox = 0, oy = 0, r = 26, hover = -1;

  const stage = new BoardStage(canvas, {
    onHover: (pt) => {
      const i = pt ? hit(pt.x, pt.y) : -1;
      if (i !== hover) { hover = i; stage.render(); }
    },
    onPick: (pt) => {
      if (!stage.interactive || !state.game) return;
      const i = hit(pt.x, pt.y);
      if (i < 0) return;
      if (state.game.board[i] !== EMPTY) return;
      if (state.game.turn !== undefined && !legalMovesAt(state.game.board, state.game.turn).includes(i)) return;
      opts.onMove && opts.onMove(i);
    },
  });

  function center(i) { return { x: ox + (xOf(i) + 0.5) * cell, y: oy + (yOf(i) + 0.5) * cell }; }
  function hit(px, py) {
    const x = Math.floor((px - ox) / cell), y = Math.floor((py - oy) / cell);
    if (x < 0 || x >= N || y < 0 || y >= N) return -1;
    return idx(x, y);
  }
  function layout(w, h) {
    const m = Math.min(w, h) * 0.05;
    cell = (Math.min(w, h) - 2 * m) / N;
    r = cell * 0.4;
    ox = (w - cell * N) / 2;
    oy = (h - cell * N) / 2;
  }

  function disc(ctx, x, y, color) {
    ctx.save();
    ctx.shadowColor = palette.shadow;
    ctx.shadowBlur = r * 0.5;
    ctx.shadowOffsetY = r * 0.16;
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.38, r * 0.1, x, y, r * 1.05);
    if (color === BLACK) { g.addColorStop(0, palette.black1); g.addColorStop(0.55, '#2a2a2a'); g.addColorStop(1, palette.black2); }
    else { g.addColorStop(0, palette.white1); g.addColorStop(0.8, '#efece4'); g.addColorStop(1, palette.white2); }
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = color === BLACK ? 'rgba(0,0,0,0.4)' : palette.whiteEdge;
    ctx.lineWidth = Math.max(1, r * 0.06);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  }

  function paint() {
    const ctx = stage.ctx, w = stage.width, h = stage.height;
    if (!state.game || w === 0) return;
    const g = state.game;

    ctx.fillStyle = palette.frame;
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? palette.boardA : palette.boardB;
        ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
      }
    }
    ctx.strokeStyle = palette.line;
    ctx.lineWidth = 1;
    for (let i = 0; i <= N; i++) {
      ctx.beginPath(); ctx.moveTo(ox + i * cell, oy); ctx.lineTo(ox + i * cell, oy + N * cell); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox, oy + i * cell); ctx.lineTo(ox + N * cell, oy + i * cell); ctx.stroke();
    }

    if (state.showCoordinates) {
      ctx.fillStyle = palette.coord;
      ctx.font = `${Math.max(9, cell * 0.24)}px system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const files = 'abcdefgh';
      for (let x = 0; x < N; x++) ctx.fillText(files[x], ox + x * cell + cell / 2, oy + N * cell + cell * 0.42);
      for (let y = 0; y < N; y++) ctx.fillText(String(y + 1), ox - cell * 0.4, oy + y * cell + cell / 2);
    }

    // 合法落点
    if (stage.interactive && !g.ended) {
      for (const m of legalMovesAt(g.board, g.turn)) {
        const c = center(m);
        ctx.fillStyle = palette.legal;
        ctx.beginPath(); ctx.arc(c.x, c.y, cell * 0.14, 0, Math.PI * 2); ctx.fill();
      }
    }

    for (let i = 0; i < g.board.length; i++) {
      const v = g.board[i];
      if (v === EMPTY) continue;
      const c = center(i);
      disc(ctx, c.x, c.y, v);
    }

    // 上一步
    if (g.lastMove >= 0) {
      const c = center(g.lastMove);
      ctx.strokeStyle = palette.last;
      ctx.lineWidth = Math.max(2, cell * 0.06);
      ctx.strokeRect(c.x - cell / 2 + 2, c.y - cell / 2 + 2, cell - 4, cell - 4);
    }

    for (const d of state.decor) {
      if (d.idx == null || d.idx < 0) continue;
      const c = center(d.idx);
      if (d.kind === 'label') {
        ctx.fillStyle = d.color || palette.decor;
        ctx.font = `700 ${cell * 0.4}px "PingFang SC", sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(d.text, c.x, c.y);
      } else if (d.kind === 'dot') {
        ctx.fillStyle = d.color || palette.decor;
        ctx.beginPath(); ctx.arc(c.x, c.y, cell * 0.13, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.strokeStyle = d.color || palette.decor;
        ctx.lineWidth = Math.max(2, cell * 0.05);
        ctx.strokeRect(c.x - cell / 2 + 3, c.y - cell / 2 + 3, cell - 6, cell - 6);
      }
    }

    if (state.hint >= 0 && g.board[state.hint] === EMPTY) {
      const c = center(state.hint);
      ctx.strokeStyle = palette.hint;
      ctx.lineWidth = Math.max(3, cell * 0.07);
      ctx.strokeRect(c.x - cell / 2 + 3, c.y - cell / 2 + 3, cell - 6, cell - 6);
    }
  }

  stage.bindDraw(() => { layout(stage.width, stage.height); paint(); });

  return {
    get interactive() { return stage.interactive; },
    set interactive(v) { stage.interactive = v; stage.render(); },
    setPalette(p) { Object.assign(palette, p); stage.render(); },
    setDecor(l) { state.decor = l || []; },
    setHint(m) { state.hint = typeof m === 'number' ? m : -1; },
    setOverlay() {},
    render(game) { if (game) state.game = game; stage.render(); },
    resize() { stage.resize(); },
  };
}
