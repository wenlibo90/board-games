// 中国象棋棋盘视图：9x10 交点棋盘、九宫、楚河汉界、棋子圆盘

import {
  RED, BLACK, K, A, E, H, R, C, P,
  COLS, ROWS, SIZE, PIECE_LABEL,
  idx, xOf, yOf, colorOf, typeOf,
  legalMovesFrom, inCheck, findKing,
} from './engine.js';
import { BoardStage } from '../../core/stage.js';

export const palettes = {
  light: {
    board1: '#efd9a8', board2: '#e3c485', line: '#7a5a2e', river: '#8a6a38',
    disc1: '#fcf3df', disc2: '#e8d3a6', edgeLight: '#c9ad78',
    redChar: '#b3261e', blackChar: '#1b1b1b', redRing: '#b3261e', blackRing: '#2a2a2a',
    select: '#0d9488', target: 'rgba(13,148,136,0.85)', hint: '#0d9488', last: 'rgba(194,65,12,0.9)',
    check: '#e11d48', decor: '#0d9488',
  },
  dark: {
    board1: '#c8a96a', board2: '#a98843', line: '#4a3418', river: '#5a4020',
    disc1: '#f4ead2', disc2: '#dcc79c', edgeLight: '#b08f57',
    redChar: '#e2483d', blackChar: '#141414', redRing: '#e2483d', blackRing: '#1c1c1c',
    select: '#14b8a6', target: 'rgba(20,184,166,0.9)', hint: '#14b8a6', last: 'rgba(249,115,22,0.95)',
    check: '#fb7185', decor: '#14b8a6',
  },
};

export function createView(canvas, opts = {}) {
  const palette = opts.palette || palettes.light;
  const state = { game: null, decor: [], hint: null, overlay: null };
  let cell = 30, ox = 0, oy = 0, r = 13;
  let selected = -1;
  let targets = [];
  let hover = -1;

  const stage = new BoardStage(canvas, {
    onHover: (pt) => {
      const i = pt ? hit(pt.x, pt.y) : -1;
      if (i !== hover) {
        hover = i;
        stage.render();
      }
    },
    onPick: (pt) => {
      if (!stage.interactive || !state.game) return;
      const i = hit(pt.x, pt.y);
      pick(i);
    },
  });

  function pt(i) {
    return { x: ox + xOf(i) * cell, y: oy + yOf(i) * cell };
  }

  function hit(px, py) {
    const x = Math.round((px - ox) / cell);
    const y = Math.round((py - oy) / cell);
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return -1;
    const i = idx(x, y);
    const c = pt(i);
    if (Math.hypot(px - c.x, py - c.y) > cell * 0.55) return -1;
    return i;
  }

  function layout(w, h) {
    const m = w * 0.06;
    cell = Math.min((w - 2 * m) / (COLS - 1), (h - 2 * m) / (ROWS - 1));
    r = cell * 0.44;
    ox = (w - cell * (COLS - 1)) / 2;
    oy = (h - cell * (ROWS - 1)) / 2;
  }

  function pick(i) {
    if (i < 0) {
      selected = -1; targets = []; stage.render(); return;
    }
    const g = state.game;
    if (selected >= 0 && targets.includes(i)) {
      const from = selected;
      selected = -1; targets = [];
      opts.onMove && opts.onMove({ from, to: i });
      return;
    }
    const p = g.board[i];
    if (p && colorOf(p) === g.turn) {
      selected = i;
      targets = legalMovesFrom(g.board, i, g.turn).map((m) => m.to);
    } else {
      selected = -1; targets = [];
    }
    stage.render();
  }

  function drawBoard(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, palette.board1);
    g.addColorStop(1, palette.board2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const gx0 = ox, gx1 = ox + cell * (COLS - 1);
    const gy0 = oy, gy1 = oy + cell * (ROWS - 1);
    ctx.strokeStyle = palette.line;
    ctx.lineWidth = Math.max(1, cell * 0.035);

    // 横线
    for (let y = 0; y < ROWS; y++) {
      const cy = oy + y * cell;
      ctx.beginPath();
      ctx.moveTo(gx0, cy);
      ctx.lineTo(gx1, cy);
      ctx.stroke();
    }
    // 竖线（河界处 1..7 断开）
    for (let x = 0; x < COLS; x++) {
      const cx = ox + x * cell;
      ctx.beginPath();
      if (x === 0 || x === COLS - 1) {
        ctx.moveTo(cx, gy0);
        ctx.lineTo(cx, gy1);
      } else {
        ctx.moveTo(cx, gy0);
        ctx.lineTo(cx, oy + 4 * cell);
        ctx.moveTo(cx, oy + 5 * cell);
        ctx.lineTo(cx, gy1);
      }
      ctx.stroke();
    }
    // 外框
    ctx.lineWidth = Math.max(1.5, cell * 0.06);
    ctx.strokeRect(gx0, gy0, gx1 - gx0, gy1 - gy0);

    // 九宫斜线
    ctx.lineWidth = Math.max(1, cell * 0.035);
    const palace = (yt) => {
      ctx.beginPath();
      ctx.moveTo(ox + 3 * cell, oy + yt * cell);
      ctx.lineTo(ox + 5 * cell, oy + (yt + 2) * cell);
      ctx.moveTo(ox + 5 * cell, oy + yt * cell);
      ctx.lineTo(ox + 3 * cell, oy + (yt + 2) * cell);
      ctx.stroke();
    };
    palace(0);
    palace(7);

    // 楚河汉界
    ctx.fillStyle = palette.river;
    ctx.font = `600 ${cell * 0.62}px "PingFang SC", "STKaiti", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const ry = oy + 4.5 * cell;
    ctx.fillText('楚  河', ox + cell * 2, ry);
    ctx.fillText('漢  界', ox + cell * 6, ry);
  }

  function drawPiece(ctx, i, p, isSelected) {
    const c = pt(i);
    ctx.save();
    ctx.shadowColor = 'rgba(60, 40, 15, 0.35)';
    ctx.shadowBlur = r * 0.45;
    ctx.shadowOffsetY = r * 0.14;
    const grad = ctx.createRadialGradient(c.x - r * 0.3, c.y - r * 0.35, r * 0.15, c.x, c.y, r);
    grad.addColorStop(0, palette.disc1);
    grad.addColorStop(1, palette.disc2);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const isRed = colorOf(p) === RED;
    ctx.strokeStyle = isRed ? palette.redRing : palette.blackRing;
    ctx.lineWidth = Math.max(1.5, r * 0.12);
    ctx.beginPath();
    ctx.arc(c.x, c.y, r * 0.94, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = Math.max(1, r * 0.06);
    ctx.beginPath();
    ctx.arc(c.x, c.y, r * 0.78, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = isRed ? palette.redChar : palette.blackChar;
    ctx.font = `700 ${r * 1.15}px "KaiTi", "STKaiti", "PingFang SC", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(PIECE_LABEL[p], c.x, c.y + r * 0.04);

    if (isSelected) {
      ctx.strokeStyle = palette.select;
      ctx.lineWidth = Math.max(2.5, r * 0.16);
      ctx.beginPath();
      ctx.arc(c.x, c.y, r * 1.12, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawDecorItem(ctx, d) {
    if (d.idx == null || d.idx < 0) return;
    const c = pt(d.idx);
    ctx.save();
    if (d.kind === 'label') {
      const fs = Math.max(11, cell * 0.5);
      ctx.font = `700 ${fs}px "PingFang SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = Math.max(3, fs * 0.25);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.strokeText(d.text, c.x, c.y);
      ctx.fillStyle = d.color || palette.decor;
      ctx.fillText(d.text, c.x, c.y);
    } else if (d.kind === 'target' || d.kind === 'dot') {
      ctx.fillStyle = d.color || palette.target;
      ctx.beginPath();
      ctx.arc(c.x, c.y, Math.max(3, cell * 0.16), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = d.color || palette.decor;
      ctx.lineWidth = Math.max(2, cell * 0.08);
      ctx.beginPath();
      ctx.arc(c.x, c.y, r * 1.1, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function paint() {
    const ctx = stage.ctx;
    const w = stage.width, h = stage.height;
    if (!state.game || w === 0) return;
    const g = state.game;
    ctx.clearRect(0, 0, w, h);
    drawBoard(ctx, w, h);

    // 上一步标记
    if (g.lastMove) {
      for (const i of [g.lastMove.from, g.lastMove.to]) {
        const c = pt(i);
        ctx.strokeStyle = palette.last;
        ctx.lineWidth = Math.max(2, cell * 0.07);
        const s = r * 1.15;
        ctx.strokeRect(c.x - s, c.y - s, s * 2, s * 2);
      }
    }

    // 将军提示
    if (g.inCheck && g.inCheck(g.turn)) {
      const kp = findKing(g.board, g.turn);
      if (kp >= 0) {
        const c = pt(kp);
        ctx.strokeStyle = palette.check;
        ctx.lineWidth = Math.max(2.5, r * 0.16);
        ctx.beginPath();
        ctx.arc(c.x, c.y, r * 1.16, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 可走点
    for (const t of targets) {
      const c = pt(t);
      ctx.fillStyle = palette.target;
      ctx.beginPath();
      ctx.arc(c.x, c.y, Math.max(3, cell * 0.15), 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < SIZE; i++) {
      const p = g.board[i];
      if (!p) continue;
      drawPiece(ctx, i, p, i === selected);
      if (i === hover && g.board[i] && colorOf(p) === g.turn) {
        // 悬停微提示
      }
    }

    for (const d of state.decor) drawDecorItem(ctx, d);

    if (state.hint) {
      for (const i of [state.hint.from, state.hint.to]) {
        const c = pt(i);
        ctx.strokeStyle = palette.hint;
        ctx.lineWidth = Math.max(2.5, cell * 0.08);
        ctx.beginPath();
        ctx.arc(c.x, c.y, r * 1.2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  stage.bindDraw(() => {
    layout(stage.width, stage.height);
    paint();
  });

  return {
    get interactive() {
      return stage.interactive;
    },
    set interactive(v) {
      stage.interactive = v;
      selected = -1; targets = [];
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
          targets = [];
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
