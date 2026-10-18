// 围棋棋盘视图：交点棋盘 + 棋子 + 气/提子/打劫标记

import { EMPTY, BLACK, WHITE, collectGroup, isLegal } from './engine.js';
import { BoardStage } from '../../core/stage.js';

const COORD_LETTERS = 'ABCDEFGHJKLMNOPQRSTUVWXYZ';

export const palettes = {
  light: {
    board1: '#e8c184', board2: '#d3a45f', boardEdge: '#b98a45', line: '#5b4322', coord: '#6b4f2a', star: '#5b4322',
    black1: '#7a7a7a', black2: '#050505', white1: '#ffffff', white2: '#d7d3c8', whiteEdge: '#b9b3a6',
    shadow: 'rgba(60, 40, 15, 0.35)', lastOnBlack: '#f5f2e8', lastOnWhite: '#1a1a1a',
    ko: '#c2410c', hint: '#0d9488', liberty: '#0d9488', legal: 'rgba(40, 40, 40, 0.28)',
    territoryBlack: 'rgba(10, 10, 10, 0.78)', territoryWhite: 'rgba(255, 255, 255, 0.92)',
    ghostBlack: 'rgba(10, 10, 10, 0.34)', ghostWhite: 'rgba(255, 255, 255, 0.55)',
  },
  dark: {
    board1: '#caa05f', board2: '#a97c3d', boardEdge: '#7c5a2a', line: '#3f2c14', coord: '#4a3418', star: '#3f2c14',
    black1: '#6f6f74', black2: '#020203', white1: '#ffffff', white2: '#cfcabd', whiteEdge: '#a49e8f',
    shadow: 'rgba(0, 0, 0, 0.5)', lastOnBlack: '#f7f4ea', lastOnWhite: '#111',
    ko: '#f97316', hint: '#14b8a6', liberty: '#14b8a6', legal: 'rgba(20, 20, 20, 0.28)',
    territoryBlack: 'rgba(5, 5, 5, 0.82)', territoryWhite: 'rgba(255, 255, 255, 0.94)',
    ghostBlack: 'rgba(0, 0, 0, 0.4)', ghostWhite: 'rgba(255, 255, 255, 0.55)',
  },
};

function starPoints(size) {
  if (size === 9) return [[2, 2], [6, 2], [2, 6], [6, 6], [4, 4]];
  if (size === 13) return [[3, 3], [9, 3], [3, 9], [9, 9], [6, 6]];
  const e = 3;
  const m = (size - 1) / 2;
  const pts = [];
  for (const y of [e, m, size - 1 - e]) for (const x of [e, m, size - 1 - e]) pts.push([x, y]);
  return pts;
}

export function createView(canvas, opts = {}) {
  const palette = opts.palette || palettes.light;
  const state = {
    game: null,
    size: 9,
    stars: starPoints(9),
    decor: [],
    hint: -1,
    overlay: null,
    showCoordinates: opts.showCoordinates !== false,
    showLiberties: !!opts.showLiberties,
    showLegal: !!opts.showLegal,
    ghost: opts.ghost !== false,
  };

  let cell = 20;
  let originX = 0;
  let originY = 0;
  let radius = 9;
  let margin = 20;
  let hover = -1;

  const stage = new BoardStage(canvas, {
    onHover: (pt) => {
      const idx = pt ? hitTest(pt.x, pt.y) : -1;
      if (idx !== hover) {
        hover = idx;
        stage.render();
      }
    },
    onPick: (pt) => {
      if (!stage.interactive) return;
      const idx = hitTest(pt.x, pt.y);
      if (idx < 0) return;
      if (state.game && state.game.board[idx] !== EMPTY) return;
      opts.onMove && opts.onMove(idx);
    },
  });

  function point(idx) {
    const n = state.size;
    return { x: originX + (idx % n) * cell, y: originY + ((idx / n) | 0) * cell };
  }

  function hitTest(px, py) {
    const col = Math.round((px - originX) / cell);
    const row = Math.round((py - originY) / cell);
    const n = state.size;
    if (col < 0 || col >= n || row < 0 || row >= n) return -1;
    const p = point(row * n + col);
    if (Math.hypot(px - p.x, py - p.y) > cell * 0.62) return -1;
    return row * n + col;
  }

  function layout(w, h) {
    const n = state.size;
    margin = Math.max(w * 0.058, state.showCoordinates ? 22 : 10);
    const usable = Math.min(w, h) - margin * 2;
    cell = usable / (n - 1);
    radius = cell * 0.465;
    originX = (w - cell * (n - 1)) / 2;
    originY = (h - cell * (n - 1)) / 2;
  }

  function drawWood(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, palette.board1);
    g.addColorStop(1, palette.board2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = palette.boardEdge;
    ctx.lineWidth = 1;
    const step = Math.max(14, h / 26);
    for (let y = step * 0.5; y < h; y += step) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += w / 12) {
        const wobble = Math.sin((x / w) * Math.PI * 3 + y) * (step * 0.25);
        if (x === 0) ctx.moveTo(x, y + wobble);
        else ctx.lineTo(x, y + wobble);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCoords(ctx) {
    const n = state.size;
    const fs = Math.max(9, Math.min(margin * 0.62, cell * 0.5));
    ctx.fillStyle = palette.coord;
    ctx.font = `${fs}px "PingFang SC", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const off = margin * 0.52;
    for (let i = 0; i < n; i++) {
      const x = originX + i * cell;
      const y = originY + i * cell;
      ctx.fillText(COORD_LETTERS[i], x, originY - off);
      ctx.fillText(COORD_LETTERS[i], x, originY + cell * (n - 1) + off);
      ctx.fillText(String(n - i), originX - off, y);
      ctx.fillText(String(n - i), originX + cell * (n - 1) + off, y);
    }
  }

  function drawStone(ctx, x, y, color) {
    const r = radius;
    ctx.save();
    ctx.shadowColor = palette.shadow;
    ctx.shadowBlur = r * 0.5;
    ctx.shadowOffsetY = r * 0.16;
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.38, r * 0.1, x, y, r * 1.05);
    if (color === BLACK) {
      g.addColorStop(0, palette.black1);
      g.addColorStop(0.55, '#2a2a2a');
      g.addColorStop(1, palette.black2);
    } else {
      g.addColorStop(0, palette.white1);
      g.addColorStop(0.8, '#efece4');
      g.addColorStop(1, palette.white2);
    }
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = color === BLACK ? 'rgba(0,0,0,0.5)' : palette.whiteEdge;
    ctx.lineWidth = Math.max(1, r * 0.06);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    if (color === WHITE) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.ellipse(x - r * 0.3, y - r * 0.34, r * 0.28, r * 0.2, -0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawDecorItem(ctx, d) {
    if (d.idx < 0) return;
    const { x, y } = point(d.idx);
    ctx.save();
    if (d.kind === 'label') {
      const fs = Math.max(11, cell * 0.6);
      ctx.font = `600 ${fs}px "PingFang SC", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = Math.max(3, fs * 0.25);
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.strokeText(d.text, x, y);
      ctx.fillStyle = d.color || palette.line;
      ctx.fillText(d.text, x, y);
    } else if (d.kind === 'liberty') {
      ctx.fillStyle = d.color || palette.liberty;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(2, cell * 0.12), 0, Math.PI * 2);
      ctx.fill();
    } else if (d.kind === 'eye') {
      ctx.fillStyle = d.color || 'rgba(13, 148, 136, 0.18)';
      ctx.beginPath();
      ctx.arc(x, y, cell * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = d.color2 || palette.hint;
      ctx.lineWidth = Math.max(2, cell * 0.06);
      ctx.beginPath();
      ctx.arc(x, y, cell * 0.42, 0, Math.PI * 2);
      ctx.stroke();
    } else if (d.kind === 'cross') {
      ctx.strokeStyle = d.color || '#dc2626';
      ctx.lineWidth = Math.max(2, cell * 0.09);
      const s = cell * 0.26;
      ctx.beginPath();
      ctx.moveTo(x - s, y - s);
      ctx.lineTo(x + s, y + s);
      ctx.moveTo(x + s, y - s);
      ctx.lineTo(x - s, y + s);
      ctx.stroke();
    } else {
      // ring / star
      ctx.strokeStyle = d.color || (d.kind === 'star' ? palette.line : palette.hint);
      ctx.lineWidth = Math.max(1.5, cell * (d.kind === 'star' ? 0.06 : 0.075));
      ctx.beginPath();
      ctx.arc(x, y, cell * (d.kind === 'star' ? 0.36 : 0.4), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function paint() {
    const ctx = stage.ctx;
    const w = stage.width;
    const h = stage.height;
    if (!state.game || w === 0) return;
    const game = state.game;
    const n = state.size;
    ctx.clearRect(0, 0, w, h);
    drawWood(ctx, w, h);

    const gridEnd = originX + cell * (n - 1);
    ctx.strokeStyle = palette.line;
    ctx.lineWidth = Math.max(1, cell * 0.028);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = originX + i * cell;
      const y = originY + i * cell;
      ctx.moveTo(x, originY);
      ctx.lineTo(x, gridEnd);
      ctx.moveTo(originX, y);
      ctx.lineTo(gridEnd, y);
    }
    ctx.stroke();
    ctx.lineWidth = Math.max(1.5, cell * 0.05);
    ctx.strokeRect(originX, originY, gridEnd - originX, gridEnd - originY);

    ctx.fillStyle = palette.star;
    for (const [x, y] of state.stars) {
      ctx.beginPath();
      ctx.arc(originX + x * cell, originY + y * cell, Math.max(1.6, cell * 0.085), 0, Math.PI * 2);
      ctx.fill();
    }

    if (state.showCoordinates) drawCoords(ctx);

    if (state.overlay && state.overlay.territory) {
      const side = cell * 0.3;
      const draw = (pts, color) => {
        ctx.fillStyle = color;
        for (const idx of pts) {
          if (game.board[idx] !== EMPTY) continue;
          const { x, y } = point(idx);
          ctx.fillRect(x - side / 2, y - side / 2, side, side);
        }
      };
      draw(state.overlay.territory.black || [], palette.territoryBlack);
      draw(state.overlay.territory.white || [], palette.territoryWhite);
    }

    if (state.showLegal && stage.interactive) {
      ctx.fillStyle = palette.legal;
      for (let i = 0; i < game.board.length; i++) {
        if (game.board[i] !== EMPTY) continue;
        if (!isLegal(game.board, n, i, game.turn, game.koPoint)) continue;
        const { x, y } = point(i);
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1.4, cell * 0.07), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (state.showLiberties && hover >= 0 && game.board[hover] !== EMPTY) {
      const g = collectGroup(game.board, n, hover);
      ctx.strokeStyle = palette.liberty;
      ctx.lineWidth = Math.max(1.5, cell * 0.05);
      for (const s of g.stones) {
        const { x, y } = point(s);
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.04, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = palette.liberty;
      for (const l of g.liberties) {
        const { x, y } = point(l);
        ctx.beginPath();
        ctx.arc(x, y, Math.max(2, cell * 0.11), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < game.board.length; i++) {
      const v = game.board[i];
      if (v === EMPTY) continue;
      const { x, y } = point(i);
      drawStone(ctx, x, y, v);
      if (i === game.lastMove) {
        ctx.beginPath();
        if (v === BLACK) {
          ctx.strokeStyle = palette.lastOnBlack;
          ctx.lineWidth = Math.max(1.5, radius * 0.16);
          ctx.arc(x, y, radius * 0.42, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = palette.lastOnWhite;
          ctx.arc(x, y, radius * 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    for (const d of state.decor) drawDecorItem(ctx, d);

    if (game.koPoint >= 0 && game.board[game.koPoint] === EMPTY) {
      const { x, y } = point(game.koPoint);
      ctx.strokeStyle = palette.ko;
      ctx.lineWidth = Math.max(1.5, cell * 0.06);
      const s = cell * 0.22;
      ctx.strokeRect(x - s, y - s, s * 2, s * 2);
    }

    if (state.hint >= 0 && game.board[state.hint] === EMPTY) {
      const { x, y } = point(state.hint);
      ctx.strokeStyle = palette.hint;
      ctx.lineWidth = Math.max(2, cell * 0.08);
      ctx.beginPath();
      ctx.arc(x, y, cell * 0.34, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = palette.hint;
      ctx.beginPath();
      ctx.arc(x, y, cell * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }

    if (state.ghost && stage.interactive && hover >= 0 && game.board[hover] === EMPTY && hover !== game.koPoint) {
      const { x, y } = point(hover);
      ctx.fillStyle = game.turn === BLACK ? palette.ghostBlack : palette.ghostWhite;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
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
      stage.render();
    },
    setPalette(p) {
      Object.assign(palette, p);
      stage.render();
    },
    setDecor(list) {
      state.decor = list || [];
    },
    setHint(move) {
      state.hint = typeof move === 'number' ? move : -1;
    },
    setOverlay(o) {
      state.overlay = o || null;
    },
    setShowLiberties(v) {
      state.showLiberties = !!v;
      stage.render();
    },
    setShowLegal(v) {
      state.showLegal = !!v;
      stage.render();
    },
    render(game) {
      if (game) {
        if (game.size !== state.size) {
          state.size = game.size;
          state.stars = starPoints(game.size);
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
