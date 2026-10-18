// 国际跳棋棋盘视图：10x10 深色格、王棋标记、强制吃子提示

import {
  WHITE, KING, N,
  colorOf, typeOf, idx, xOf, yOf, playable, legalMoves, legalMovesFrom,
} from './engine.js';
import { BoardStage } from '../../core/stage.js';

export const palettes = {
  light: {
    lightSq: '#e8d3a6', darkSq: '#8a6a3f', frame: '#4a3418', border: '#3a2a12',
    white1: '#fbf6ea', white2: '#d9cdb2', whiteEdge: '#b3a483',
    black1: '#6f6f74', black2: '#111', blackEdge: '#000',
    crown: '#ca8a04', must: '#dc2626', target: 'rgba(20,20,20,0.35)', last: 'rgba(202,138,4,0.6)',
    hint: '#0d9488', decor: '#0d9488',
  },
  dark: {
    lightSq: '#5a5138', darkSq: '#2f2a1b', frame: '#1c1910', border: '#0f0d07',
    white1: '#f4efe2', white2: '#cdc3aa', whiteEdge: '#a89a7c',
    black1: '#6f6f74', black2: '#0a0a0a', blackEdge: '#000',
    crown: '#facc15', must: '#f87171', target: 'rgba(20,20,20,0.4)', last: 'rgba(250,204,21,0.45)',
    hint: '#14b8a6', decor: '#14b8a6',
  },
};

export function createView(canvas, opts = {}) {
  const palette = opts.palette || palettes.light;
  const state = { game: null, decor: [], hint: null, overlay: null };
  let cell = 50, ox = 0, oy = 0, r = 20, hover = -1;
  let selected = -1;
  let targets = [];

  const stage = new BoardStage(canvas, {
    onHover: (pt) => {
      const i = pt ? hit(pt.x, pt.y) : -1;
      if (i !== hover) { hover = i; stage.render(); }
    },
    onPick: (pt) => {
      if (!stage.interactive || !state.game) return;
      pick(hit(pt.x, pt.y));
    },
  });

  function center(i) { return { x: ox + (xOf(i) + 0.5) * cell, y: oy + (yOf(i) + 0.5) * cell }; }
  function hit(px, py) {
    const x = Math.floor((px - ox) / cell), y = Math.floor((py - oy) / cell);
    if (x < 0 || x >= N || y < 0 || y >= N) return -1;
    return idx(x, y);
  }
  function layout(w, h) {
    const m = Math.min(w, h) * 0.045;
    cell = (Math.min(w, h) - 2 * m) / N;
    r = cell * 0.38;
    ox = (w - cell * N) / 2;
    oy = (h - cell * N) / 2;
  }

  function pick(i) {
    if (!state.game || i < 0) { selected = -1; targets = []; stage.render(); return; }
    const g = state.game;
    if (selected >= 0) {
      const options = targets.filter((t) => t.to === i);
      if (options.length) {
        const move = options[0];
        selected = -1; targets = [];
        opts.onMove && opts.onMove(move);
        return;
      }
    }
    const p = g.board[i];
    if (p && colorOf(p) === g.turn) {
      selected = i;
      targets = legalMovesFrom(g.board, i, g.turn);
    } else {
      selected = -1; targets = [];
    }
    stage.render();
  }

  function disc(ctx, x, y, p) {
    const isWhite = colorOf(p) === WHITE;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = r * 0.45;
    ctx.shadowOffsetY = r * 0.16;
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.38, r * 0.1, x, y, r * 1.05);
    if (isWhite) { g.addColorStop(0, palette.white1); g.addColorStop(0.8, palette.white2); g.addColorStop(1, palette.whiteEdge); }
    else { g.addColorStop(0, palette.black1); g.addColorStop(0.55, '#2a2a2a'); g.addColorStop(1, palette.black2); }
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (typeOf(p) === KING) {
      ctx.strokeStyle = palette.crown;
      ctx.lineWidth = Math.max(2, r * 0.16);
      ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = palette.crown;
      ctx.beginPath();
      const s = r * 0.34;
      ctx.moveTo(x - s, y + s * 0.6);
      ctx.lineTo(x - s, y - s * 0.5);
      ctx.lineTo(x - s * 0.4, y);
      ctx.lineTo(x, y - s * 0.7);
      ctx.lineTo(x + s * 0.4, y);
      ctx.lineTo(x + s, y - s * 0.5);
      ctx.lineTo(x + s, y + s * 0.6);
      ctx.closePath();
      ctx.fill();
    }
  }

  function paint() {
    const ctx = stage.ctx, w = stage.width, h = stage.height;
    if (!state.game || w === 0) return;
    const g = state.game;

    ctx.fillStyle = palette.frame;
    ctx.fillRect(0, 0, w, h);

    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const pl = playable(x, y);
        ctx.fillStyle = pl ? palette.darkSq : palette.lightSq;
        ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
        if (pl) {
          ctx.strokeStyle = palette.border;
          ctx.lineWidth = 1;
          ctx.strokeRect(ox + x * cell + 0.5, oy + y * cell + 0.5, cell - 1, cell - 1);
        }
      }
    }

    // 必须吃子的棋子
    const all = legalMoves(g.board, g.turn);
    const forced = all.length && all[0].captures.length > 0;
    const movedFrom = new Set(all.map((m) => m.from));

    // 目标点
    for (const t of targets) {
      const c = center(t.to);
      ctx.fillStyle = palette.target;
      ctx.beginPath(); ctx.arc(c.x, c.y, cell * 0.14, 0, Math.PI * 2); ctx.fill();
    }

    // 棋子
    for (let i = 0; i < g.board.length; i++) {
      const p = g.board[i];
      if (!p) continue;
      const c = center(i);
      if (forced && colorOf(p) === g.turn && movedFrom.has(i) && i !== selected) {
        ctx.strokeStyle = palette.must;
        ctx.lineWidth = Math.max(2, cell * 0.05);
        ctx.strokeRect(c.x - cell / 2 + 2, c.y - cell / 2 + 2, cell - 4, cell - 4);
      }
      disc(ctx, c.x, c.y, p);
      if (i === selected) {
        ctx.strokeStyle = palette.hint;
        ctx.lineWidth = Math.max(3, cell * 0.06);
        ctx.beginPath(); ctx.arc(c.x, c.y, r * 1.15, 0, Math.PI * 2); ctx.stroke();
      }
    }

    if (g.lastMove) {
      for (const i of [g.lastMove.from, g.lastMove.to]) {
        const c = center(i);
        ctx.strokeStyle = palette.last;
        ctx.lineWidth = Math.max(2, cell * 0.06);
        ctx.strokeRect(c.x - cell / 2 + 2, c.y - cell / 2 + 2, cell - 4, cell - 4);
      }
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
        ctx.beginPath(); ctx.arc(c.x, c.y, cell * 0.14, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.strokeStyle = d.color || palette.decor;
        ctx.lineWidth = Math.max(2, cell * 0.05);
        ctx.strokeRect(c.x - cell / 2 + 3, c.y - cell / 2 + 3, cell - 6, cell - 6);
      }
    }

    if (state.hint) {
      for (const i of [state.hint.from, state.hint.to]) {
        const c = center(i);
        ctx.strokeStyle = palette.hint;
        ctx.lineWidth = Math.max(3, cell * 0.07);
        ctx.strokeRect(c.x - cell / 2 + 3, c.y - cell / 2 + 3, cell - 6, cell - 6);
      }
    }
  }

  stage.bindDraw(() => { layout(stage.width, stage.height); paint(); });

  return {
    get interactive() { return stage.interactive; },
    set interactive(v) { stage.interactive = v; selected = -1; targets = []; stage.render(); },
    setPalette(p) { Object.assign(palette, p); stage.render(); },
    setDecor(l) { state.decor = l || []; },
    setHint(m) { state.hint = m && m.from != null ? m : null; },
    setOverlay() {},
    render(game) {
      if (game) {
        if (game !== state.game) { selected = -1; targets = []; }
        state.game = game;
      }
      stage.render();
    },
    resize() { stage.resize(); },
  };
}
