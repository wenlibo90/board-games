// 韩国象棋 AI：Alpha-Beta 迭代加深

import {
  RED, BLUE, K, A, E, H, R, C, P,
  SIZE, xOf, yOf, colorOf, typeOf, opponent,
  legalMoves, makeMove, unmakeMove,
} from './engine.js';

const VAL = { [K]: 60000, [R]: 900, [H]: 420, [C]: 500, [A]: 220, [E]: 220, [P]: 110 };
const MATE = 90000;

function valueOf(board, i, p) {
  const t = typeOf(p);
  let v = VAL[t] || 0;
  const x = xOf(i), y = yOf(i);
  if (t === P) { v += (colorOf(p) === RED ? 9 - y : y) * 6; v += (x >= 3 && x <= 5) ? 10 : 0; }
  else if (t === H || t === C) v += 5 * (4 - Math.abs(x - 4));
  return v;
}
function evaluate(board, color) {
  let s = 0;
  for (let i = 0; i < SIZE; i++) { const p = board[i]; if (!p) continue; s += (colorOf(p) === color ? 1 : -1) * valueOf(board, i, p); }
  return s;
}
function order(board, moves) {
  for (const m of moves) { const cap = board[m.to]; m._s = cap ? (VAL[typeOf(cap)] || 0) : 0; }
  moves.sort((a, b) => b._s - a._s);
}
function search(board, color, depth, alpha, beta, deadline) {
  if (Date.now() > deadline) return evaluate(board, color);
  const moves = legalMoves(board, color);
  if (moves.length === 0) return -MATE + (4 - depth);
  if (depth <= 0) return evaluate(board, color);
  order(board, moves);
  let best = -Infinity;
  for (const m of moves) {
    const { moved, captured } = makeMove(board, m.from, m.to);
    const sc = -search(board, opponent(color), depth - 1, -beta, -alpha, deadline);
    unmakeMove(board, m.from, m.to, moved, captured);
    if (sc > best) best = sc;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}
const DEPTH = { easy: 1, medium: 2, hard: 3 };
const BUDGET = { easy: 200, medium: 700, hard: 1800 };

export function chooseMove(game, difficulty = 'medium') {
  const color = game.turn;
  const roots = game.legalMoves(color);
  if (roots.length === 0) return null;
  if (difficulty === 'easy') {
    const caps = roots.filter((m) => game.board[m.to] && typeOf(game.board[m.to]) !== K);
    if (caps.length && Math.random() < 0.5) return caps[(Math.random() * caps.length) | 0];
    return roots[(Math.random() * roots.length) | 0];
  }
  const board = game.board.slice();
  order(board, roots);
  const deadline = Date.now() + (BUDGET[difficulty] || 700);
  const maxDepth = DEPTH[difficulty] || 2;
  let best = roots[0];
  for (let depth = 1; depth <= maxDepth; depth++) {
    let alpha = -Infinity, localBest = null, aborted = false;
    const scored = [];
    for (const m of roots) {
      const { moved, captured } = makeMove(board, m.from, m.to);
      const sc = search(board, opponent(color), depth - 1, -Infinity, -alpha, deadline);
      unmakeMove(board, m.from, m.to, moved, captured);
      if (Date.now() > deadline) { aborted = true; break; }
      scored.push({ m, sc });
      if (sc > alpha) { alpha = sc; localBest = m; }
    }
    if (localBest) best = localBest;
    if (aborted) break;
    scored.sort((a, b) => b.sc - a.sc);
    for (let i = 0; i < scored.length; i++) roots[i] = scored[i].m;
  }
  return best;
}
export function suggestMove(game, color) { const s = game.turn; game.turn = color; const mv = chooseMove(game, 'hard'); game.turn = s; return mv; }
