// 国际象棋棋盘视图：8x8 格子、Unicode 棋子、升变选择浮层

import {
  WHITE, BLACK, P, N, B, R, Q, K, SIZE,
  colorOf, typeOf, idx, xOf, yOf,
  inCheck, findKing,
} from './engine.js';
import { BoardStage } from '../../core/stage.js';

const GLYPH = { [K]: '♚', [Q]: '♛', [R]: '♜', [B]: '♝', [N]: '♞', [P]: '♟' };
const FILES = 'abcdefgh';

export const palettes = {
  light: {
    sqLight: '#eddfc5', sqDark: '#b58863', frame: '#4a3418',
    coordLight: '#8a6b45', coordDark: '#f0e6d2',
    sel: 'rgba(242,193,78,0.75)', target: 'rgba(30,30,30,0.32)', capture: 'rgba(190,40,40,0.55)',
    last: 'rgba(246,196,66,0.5)', check: '#e11d48', hint: '#0d9488', decor: '#0d9488',
    whitePiece: '#fafafa', whiteEdge: '#2b2b2b', blackPiece: '#1b1b1b', blackEdge: '#ececec',
  },
  dark: {
    sqLight: '#9aa7b2', sqDark: '#4e6a5b', frame: '#1a1d22',
    coordLight: '#33414d', coordDark: '#e6edf3',
    sel: 'rgba(250,204,21,0.6)', target: 'rgba(10,10,10,0.4)', capture: 'rgba(248,113,113,0.65)',
    last: 'rgba(250,204,21,0.4)', check: '#fb7185', hint: '#14b8a6', decor: '#14b8a6',
    whitePiece: '#f4f4f2', whiteEdge: '#2b2b2b', blackPiece: '#141414', blackEdge: '#e8e8e8',
  },
};

export function createView(canvas, opts = {}) {
  const palette = opts.palette || palettes.light;
  const state = { game: null, decor: [], hint: null, overlay: null };
  let cell = 40, ox = 0, oy = 0;
  let selected = -1;
  let moveTargets = [];
  let hover = -1;
  let promote = null; // {from,to,color}

  const hostEl = canvas.parentElement || document.body;
  hostEl.querySelectorAll('.promotion-overlay').forEach((n) => n.remove());
  const overlayEl = document.createElement('div');
  overlayEl.className = 'promotion-overlay is-hidden';
  hostEl.appendChild(overlayEl);
  overlayEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-promo]');
    if (!btn) {
      closePromotion();
      return;
    }
    const type = Number(btn.dataset.promo);
    const p = promote;
    closePromotion();
    if (p) opts.onMove && opts.onMove({ from: p.from, to: p.to, promotion: type });
  });

  const stage = new BoardStage(canvas, {
    onHover: (pt) => {
      const i = pt ? hit(pt.x, pt.y) : -1;
      if (i !== hover) {
        hover = i;
        stage.render();
      }
    },
    onPick: (pt) => {
      if (!stage.interactive || !state.game || promote) return;
      pick(hit(pt.x, pt.y));
    },
  });

  function sqPoint(i) {
    return { x: ox + xOf(i) * cell, y: oy + yOf(i) * cell };
  }

  function hit(px, py) {
    const x = Math.floor((px - ox) / cell);
    const y = Math.floor((py - oy) / cell);
    if (x < 0 || x >= 8 || y < 0 || y >= 8) return -1;
    return idx(x, y);
  }

  function layout(w, h) {
    const m = Math.min(w, h) * 0.045;
    cell = (Math.min(w, h) - 2 * m) / 8;
    ox = (w - cell * 8) / 2;
    oy = (h - cell * 8) / 2;
  }

  function pick(i) {
    const g = state.game;
    if (i < 0) {
      selected = -1; moveTargets = []; stage.render(); return;
    }
    if (selected >= 0) {
      const opts4 = moveTargets.filter((m) => m.to === i);
      if (opts4.length) {
        const from = selected;
        const promos = opts4.filter((m) => m.promotion);
        if (promos.length) {
          openPromotion(from, i, g.turn);
        } else {
          selected = -1; moveTargets = [];
          opts.onMove && opts.onMove({ from, to: i });
        }
        return;
      }
    }
    const p = g.board[i];
    if (p && colorOf(p) === g.turn) {
      selected = i;
      moveTargets = g.legalMovesFrom(i);
    } else {
      selected = -1; moveTargets = [];
    }
    stage.render();
  }

  function openPromotion(from, to, color) {
    promote = { from, to, color };
    const p = sqPoint(to);
    const size = cell * 0.9;
    const offX = canvas.offsetLeft || 0;
    const offY = canvas.offsetTop || 0;
    const bottomHalf = yOf(to) >= 4;
    overlayEl.style.left = `${p.x + offX}px`;
    overlayEl.style.width = `${cell}px`;
    overlayEl.style.height = `${size * 4 + 8}px`;
    if (bottomHalf) {
      overlayEl.style.top = `${p.y + offY - (size * 4 + 8) + cell}px`;
    } else {
      overlayEl.style.top = `${p.y + offY}px`;
    }
    overlayEl.classList.toggle('up', bottomHalf);
    overlayEl.innerHTML = [Q, R, B, N]
      .map(
        (t) => `<button type="button" data-promo="${t}" title="升变为${t === Q ? '后' : t === R ? '车' : t === B ? '象' : '马'}" style="height:${size}px">${GLYPH[t]}</button>`
      )
      .join('');
    overlayEl.classList.remove('is-hidden');
  }

  function closePromotion() {
    promote = null;
    selected = -1;
    moveTargets = [];
    overlayEl.classList.add('is-hidden');
    stage.render();
  }

  function drawPieces(ctx, g) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < SIZE; i++) {
      const p = g.board[i];
      if (!p) continue;
      const c = sqPoint(i);
      const cx = c.x + cell / 2;
      const cy = c.y + cell / 2;
      const isWhite = colorOf(p) === WHITE;
      ctx.font = `${cell * 0.82}px "Segoe UI Symbol", "Noto Sans Symbols 2", "Apple Symbols", serif`;
      ctx.lineWidth = Math.max(1.5, cell * 0.03);
      ctx.strokeStyle = isWhite ? palette.whiteEdge : palette.blackEdge;
      ctx.strokeText(GLYPH[typeOf(p)], cx, cy + cell * 0.02);
      ctx.fillStyle = isWhite ? palette.whitePiece : palette.blackPiece;
      ctx.fillText(GLYPH[typeOf(p)], cx, cy + cell * 0.02);
    }
  }

  function paint() {
    const ctx = stage.ctx;
    const w = stage.width, h = stage.height;
    if (!state.game || w === 0) return;
    const g = state.game;

    ctx.fillStyle = palette.frame;
    ctx.fillRect(0, 0, w, h);

    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? palette.sqLight : palette.sqDark;
        ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
      }
    }

    // 坐标
    ctx.font = `${Math.max(9, cell * 0.24)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let x = 0; x < 8; x++) {
      const c = ox + x * cell + cell / 2;
      ctx.fillStyle = palette.coordLight;
      ctx.fillText(FILES[x], c, oy + 8 * cell + cell * 0.42);
    }
    for (let y = 0; y < 8; y++) {
      ctx.fillStyle = palette.coordDark;
      ctx.fillText(String(8 - y), ox - cell * 0.4, oy + y * cell + cell / 2);
    }

    // 上一步
    if (g.lastMove) {
      ctx.fillStyle = palette.last;
      for (const i of [g.lastMove.from, g.lastMove.to]) {
        const c = sqPoint(i);
        ctx.fillRect(c.x, c.y, cell, cell);
      }
    }

    // 选中格
    if (selected >= 0) {
      const c = sqPoint(selected);
      ctx.fillStyle = palette.sel;
      ctx.fillRect(c.x, c.y, cell, cell);
    }

    // 可走点
    const seen = new Set();
    for (const m of moveTargets) {
      if (m.to === selected || seen.has(m.to)) continue;
      seen.add(m.to);
      const c = sqPoint(m.to);
      const cx = c.x + cell / 2, cy = c.y + cell / 2;
      if (g.board[m.to] || m.ep) {
        ctx.strokeStyle = palette.capture;
        ctx.lineWidth = Math.max(2, cell * 0.08);
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.42, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = palette.target;
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.16, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawPieces(ctx, g);

    // 将军
    if (g.inCheck && g.inCheck(g.turn)) {
      const kp = findKing(g.board, g.turn);
      if (kp >= 0) {
        const c = sqPoint(kp);
        ctx.strokeStyle = palette.check;
        ctx.lineWidth = Math.max(2.5, cell * 0.09);
        ctx.strokeRect(c.x + 2, c.y + 2, cell - 4, cell - 4);
      }
    }

    for (const d of state.decor) {
      if (d.idx == null || d.idx < 0) continue;
      const c = sqPoint(d.idx);
      const cx = c.x + cell / 2, cy = c.y + cell / 2;
      if (d.kind === 'label') {
        const fs = Math.max(11, cell * 0.42);
        ctx.font = `700 ${fs}px "PingFang SC", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = Math.max(3, fs * 0.25);
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.strokeText(d.text, cx, cy);
        ctx.fillStyle = d.color || palette.decor;
        ctx.fillText(d.text, cx, cy);
      } else if (d.kind === 'dot' || d.kind === 'target') {
        ctx.fillStyle = d.color || palette.decor;
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.14, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = d.color || palette.decor;
        ctx.lineWidth = Math.max(2, cell * 0.07);
        ctx.strokeRect(c.x + 3, c.y + 3, cell - 6, cell - 6);
      }
    }

    if (state.hint) {
      for (const i of [state.hint.from, state.hint.to]) {
        const c = sqPoint(i);
        ctx.strokeStyle = palette.hint;
        ctx.lineWidth = Math.max(2.5, cell * 0.08);
        ctx.strokeRect(c.x + 3, c.y + 3, cell - 6, cell - 6);
      }
    }
  }

  stage.bindDraw(() => {
    layout(stage.width, stage.height);
    paint();
  });
  window.addEventListener('resize', () => {
    if (promote) closePromotion();
  });

  return {
    get interactive() {
      return stage.interactive;
    },
    set interactive(v) {
      stage.interactive = v;
      selected = -1;
      moveTargets = [];
      closePromotion();
      stage.render();
    },
    setPalette(p) {
      Object.assign(palette, p);
      stage.render();
    },
    setDecor(list) {
      state.decor = list || [];
    },
    setHint(m) {
      state.hint = m && m.from != null ? m : null;
    },
    setOverlay(o) {
      state.overlay = o || null;
    },
    render(game) {
      if (game) {
        if (game !== state.game) {
          selected = -1;
          moveTargets = [];
          if (promote) closePromotion();
        }
        state.game = game;
      }
      stage.render();
    },
    resize() {
      stage.resize();
    },
  };
}
