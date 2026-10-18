// 将棋棋盘视图：9x9 棋盘、五角形棋子、持驹区、升变选择

import {
  BLACK, WHITE, P, L, N, S, G, B, R, PROMOTED, KANJI, SIZE,
  colorOf, typeOf, isPromoted, baseType, idx, xOf, yOf, opponent,
  legalMoves,
} from './engine.js';
import { BoardStage } from '../../core/stage.js';

export const palettes = {
  light: {
    board1: '#f0dcae', board2: '#e2c489', line: '#7a5a2e', tile1: '#fbf1da', tile2: '#ecd6a8', tileEdge: '#9c7a42',
    text: '#2a2118', red: '#b3261e', select: '#0d9488', target: 'rgba(13,148,136,0.85)', last: 'rgba(194,65,12,0.85)',
    hint: '#0d9488', decor: '#0d9488', hand: '#e6d3ab', handLabel: '#6b5330',
  },
  dark: {
    board1: '#c8a96a', board2: '#a98843', line: '#4a3418', tile1: '#f0e3c2', tile2: '#d8c395', tileEdge: '#8a6a34',
    text: '#241c12', red: '#d23b30', select: '#14b8a6', target: 'rgba(20,184,166,0.9)', last: 'rgba(249,115,22,0.9)',
    hint: '#14b8a6', decor: '#14b8a6', hand: '#c2a86f', handLabel: '#e8dcc0',
  },
};

export function createView(canvas, opts = {}) {
  const palette = opts.palette || palettes.light;
  const state = { game: null, decor: [], hint: null, overlay: null };
  let cell = 40, ox = 0, oy = 0, handH = 44;
  let selected = -1;
  let targets = [];
  let pendingDrop = 0;
  let hover = -1;
  let handRects = { [BLACK]: [], [WHITE]: [] };
  let promote = null;

  const hostEl = canvas.parentElement || document.body;
  hostEl.querySelectorAll('.promotion-overlay').forEach((n) => n.remove());
  const overlayEl = document.createElement('div');
  overlayEl.className = 'promotion-overlay is-hidden';
  hostEl.appendChild(overlayEl);
  overlayEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-promote]');
    const val = btn ? btn.dataset.promote === '1' : null;
    const p = promote;
    closePromotion();
    if (p && val != null) opts.onMove && opts.onMove({ from: p.from, to: p.to, promote: val });
  });

  const stage = new BoardStage(canvas, {
    onHover: (pt) => {
      const i = pt ? boardHit(pt.x, pt.y) : -1;
      if (i !== hover) { hover = i; stage.render(); }
    },
    onPick: (pt) => {
      if (!stage.interactive || !state.game) return;
      pick(pt.x, pt.y);
    },
  });

  function boardX(i) { return ox + xOf(i) * cell; }
  function boardY(i) { return oy + yOf(i) * cell; }
  function center(i) { return { x: boardX(i) + cell / 2, y: boardY(i) + cell / 2 }; }

  function boardHit(px, py) {
    const x = Math.floor((px - ox) / cell), y = Math.floor((py - oy) / cell);
    if (x < 0 || x >= 9 || y < 0 || y >= 9) return -1;
    return idx(x, y);
  }

  function layout(w, h) {
    const outer = Math.min(w, h) * 0.03;
    cell = (Math.min(w, h) - 2 * outer) / 11.2;
    handH = cell * 1.1;
    ox = (w - cell * 9) / 2;
    oy = (h - (cell * 9 + handH * 2)) / 2 + handH;
  }

  function pick(px, py) {
    const g = state.game;
    // 持驹区
    for (const color of [BLACK, WHITE]) {
      for (const slot of handRects[color]) {
        const r = slot.rect;
        if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
          if (color === g.turn) { pendingDrop = pendingDrop === slot.type ? 0 : slot.type; selected = -1; targets = []; }
          stage.render();
          return;
        }
      }
    }
    const i = boardHit(px, py);
    if (i < 0) { selected = -1; targets = []; pendingDrop = 0; stage.render(); return; }

    if (pendingDrop) {
      const move = g.legalMoves(g.turn).find((m) => m.drop === pendingDrop && m.to === i);
      if (move) { const d = pendingDrop; pendingDrop = 0; opts.onMove && opts.onMove(move); }
      return;
    }

    if (selected >= 0) {
      const opts2 = targets.filter((m) => m.to === i);
      if (opts2.length) {
        const promotes = opts2.filter((m) => m.promote);
        const plains = opts2.filter((m) => !m.promote);
        const from = selected;
        selected = -1; targets = [];
        if (promotes.length && plains.length) openPromotion(from, i);
        else opts.onMove && opts.onMove(opts2[0]);
        return;
      }
    }
    const p = g.board[i];
    if (p && colorOf(p) === g.turn) {
      selected = i;
      targets = g.legalMovesFrom(i);
    } else {
      selected = -1; targets = [];
    }
    stage.render();
  }

  function openPromotion(from, to) {
    promote = { from, to };
    const c = center(to);
    const offX = canvas.offsetLeft || 0;
    const offY = canvas.offsetTop || 0;
    overlayEl.style.left = `${c.x + offX - cell * 0.9}px`;
    overlayEl.style.top = `${c.y + offY - cell * 0.9}px`;
    overlayEl.style.width = `${cell * 1.8}px`;
    overlayEl.style.height = `${cell * 1.8}px`;
    overlayEl.innerHTML = `<button type="button" data-promote="1">成</button><button type="button" data-promote="0">不成</button>`;
    overlayEl.classList.remove('is-hidden');
  }

  function closePromotion() {
    promote = null;
    overlayEl.classList.add('is-hidden');
    stage.render();
  }

  function drawTile(ctx, cx, cy, p, opts2 = {}) {
    const gote = colorOf(p) === WHITE;
    const w = cell * 0.42, h = cell * 0.45, tip = cell * 0.15;
    ctx.save();
    ctx.translate(cx, cy);
    if (gote) ctx.rotate(Math.PI);
    if (opts2.shadow !== false) {
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = cell * 0.1;
      ctx.shadowOffsetY = cell * 0.04;
    }
    const grad = ctx.createLinearGradient(0, -h, 0, h);
    grad.addColorStop(0, palette.tile1);
    grad.addColorStop(1, palette.tile2);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-w, h);
    ctx.lineTo(-w, -h + tip);
    ctx.lineTo(0, -h);
    ctx.lineTo(w, -h + tip);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = palette.tileEdge;
    ctx.lineWidth = Math.max(1, cell * 0.03);
    ctx.stroke();

    const t = typeOf(p);
    ctx.fillStyle = isPromoted(t) ? palette.red : palette.text;
    ctx.font = `700 ${cell * 0.52}px "Yu Mincho", "Songti SC", "PingFang SC", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(KANJI[t] || '?', 0, cell * 0.02);
    ctx.restore();

    if (opts2.selected) {
      ctx.strokeStyle = palette.select;
      ctx.lineWidth = Math.max(2.5, cell * 0.07);
      ctx.strokeRect(cx - cell * 0.46, cy - cell * 0.48, cell * 0.92, cell * 0.96);
    }
  }

  function paint() {
    const ctx = stage.ctx, w = stage.width, h = stage.height;
    if (!state.game || w === 0) return;
    const g = state.game;
    const opp = opponent(g.turn);

    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, palette.board1);
    bg.addColorStop(1, palette.board2);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const bx = ox, by = oy, bs = cell * 9;
    ctx.strokeStyle = palette.line;
    ctx.lineWidth = Math.max(1, cell * 0.03);
    for (let i = 0; i <= 9; i++) {
      ctx.beginPath(); ctx.moveTo(bx + i * cell, by); ctx.lineTo(bx + i * cell, by + bs); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx, by + i * cell); ctx.lineTo(bx + bs, by + i * cell); ctx.stroke();
    }
    // 星（4 个）
    ctx.fillStyle = palette.line;
    for (const [sx, sy] of [[3, 3], [6, 3], [3, 6], [6, 6]]) {
      ctx.beginPath(); ctx.arc(bx + sx * cell, by + sy * cell, cell * 0.06, 0, Math.PI * 2); ctx.fill();
    }

    // 上一步
    if (g.lastMove && !g.lastMove.drop) {
      ctx.fillStyle = palette.last;
      for (const i of [g.lastMove.from, g.lastMove.to]) {
        ctx.fillRect(boardX(i) + cell * 0.05, boardY(i) + cell * 0.05, cell * 0.9, cell * 0.9);
      }
    } else if (g.lastMove && g.lastMove.drop) {
      ctx.fillStyle = palette.last;
      const i = g.lastMove.to;
      ctx.fillRect(boardX(i) + cell * 0.05, boardY(i) + cell * 0.05, cell * 0.9, cell * 0.9);
    }

    // 目标点
    for (const m of targets) {
      const c = center(m.to);
      ctx.fillStyle = palette.target;
      ctx.beginPath(); ctx.arc(c.x, c.y, cell * 0.14, 0, Math.PI * 2); ctx.fill();
    }

    for (let i = 0; i < SIZE; i++) {
      const p = g.board[i];
      if (!p) continue;
      const c = center(i);
      drawTile(ctx, c.x, c.y, p, { selected: i === selected });
    }

    // 提示
    if (state.hint) {
      const i = state.hint.to != null ? state.hint.to : -1;
      if (i >= 0) {
        ctx.strokeStyle = palette.hint;
        ctx.lineWidth = Math.max(3, cell * 0.07);
        ctx.strokeRect(boardX(i) + cell * 0.06, boardY(i) + cell * 0.06, cell * 0.88, cell * 0.88);
      }
      if (state.hint.from >= 0) {
        const j = state.hint.from;
        ctx.strokeStyle = palette.hint;
        ctx.strokeRect(boardX(j) + cell * 0.06, boardY(j) + cell * 0.06, cell * 0.88, cell * 0.88);
      }
    }

    // 装饰
    for (const d of state.decor) {
      if (d.idx == null || d.idx < 0) continue;
      const c = center(d.idx);
      if (d.kind === 'label') {
        ctx.fillStyle = d.color || palette.decor;
        ctx.font = `700 ${cell * 0.4}px "PingFang SC", sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(d.text, c.x, c.y - cell * 0.55);
      } else if (d.kind === 'dot') {
        ctx.fillStyle = d.color || palette.decor;
        ctx.beginPath(); ctx.arc(c.x, c.y, cell * 0.13, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.strokeStyle = d.color || palette.decor;
        ctx.lineWidth = Math.max(2, cell * 0.06);
        ctx.strokeRect(boardX(d.idx) + cell * 0.05, boardY(d.idx) + cell * 0.05, cell * 0.9, cell * 0.9);
      }
    }

    // 持驹区
    handRects = { [BLACK]: [], [WHITE]: [] };
    drawHand(ctx, WHITE, bx, by - handH);
    drawHand(ctx, BLACK, bx, by + bs);
  }

  function drawHand(ctx, color, startX, y) {
    const hand = state.game.hands[color];
    const types = [R, B, G, S, N, L, P];
    let x = startX + cell * 0.1;
    const size = cell * 0.78;
    ctx.fillStyle = palette.handLabel;
    ctx.font = `600 ${cell * 0.28}px "PingFang SC", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(color === BLACK ? '先手持驹' : '后手持驹', startX + cell * 0.1, y + size * 0.5);
    x = startX + cell * 3.0;
    for (const t of types) {
      const n = hand[t] || 0;
      if (!n) continue;
      const cx = x + size / 2, cy = y + size / 2;
      const p = color * 100 + t;
      const isSel = pendingDrop === t && color === state.game.turn;
      drawTile(ctx, cx, cy, p, { shadow: false, selected: isSel });
      ctx.fillStyle = palette.text;
      ctx.font = `700 ${Math.max(10, cell * 0.26)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(String(n), cx + size * 0.42, cy + size * 0.42);
      ctx.fillStyle = 'rgba(255,255,255,0.0)';
      handRects[color].push({ type: t, rect: { x: x, y: y, w: size, h: size } });
      x += size * 1.35;
    }
  }

  stage.bindDraw(() => { layout(stage.width, stage.height); paint(); });
  window.addEventListener('resize', () => { if (promote) closePromotion(); });

  return {
    get interactive() { return stage.interactive; },
    set interactive(v) { stage.interactive = v; selected = -1; targets = []; pendingDrop = 0; closePromotion(); stage.render(); },
    setPalette(p) { Object.assign(palette, p); stage.render(); },
    setDecor(l) { state.decor = l || []; },
    setHint(m) { state.hint = m ? m : null; },
    setOverlay() {},
    render(game) {
      if (game) {
        if (game !== state.game) { selected = -1; targets = []; pendingDrop = 0; if (promote) closePromotion(); }
        state.game = game;
      }
      stage.render();
    },
    resize() { stage.resize(); },
  };
}
