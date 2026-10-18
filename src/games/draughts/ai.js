// 国际跳棋 AI：Alpha-Beta + 子力/位置评估

import {
  WHITE,
  MAN,
  KING,
  SIZE,
  colorOf,
  typeOf,
  opponent,
  xOf,
  yOf,
  legalMoves,
  applyMove,
} from './engine.js';

const MATE = 100000;

function evaluate(board, color) {
  let s = 0;
  for (let i = 0; i < SIZE; i++) {
    const p = board[i];
    if (!p) continue;
    const c = colorOf(p);
    const t = typeOf(p);
    let v = t === KING ? 285 : 100;
    const x = xOf(i), y = yOf(i);
    if (t === MAN) v += (c === WHITE ? 9 - y : y) * 4;
    v += 3 * (4 - Math.abs(x - 4.5));
    s += c === color ? v : -v;
  }
  return s;
}

function order(moves) {
  moves.sort((a, b) => b.captures.length - a.captures.length);
}

function negamax(board, color, depth, alpha, beta, deadline) {
  const moves = legalMoves(board, color);
  if (moves.length === 0) return -MATE + (10 - depth);
  if (depth <= 0) return evaluate(board, color);
  if (Date.now() > deadline) return evaluate(board, color);

  order(moves);
  let best = -Infinity;
  for (const m of moves) {
    const snapshot = board.slice();
    applyMove(board, m, color);
    const score = -negamax(board, opponent(color), depth - 1, -beta, -alpha, deadline);
    board.set(snapshot);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

const DEPTH = { easy: 1, medium: 3, hard: 5 };
const BUDGET = { easy: 150, medium: 800, hard: 2200 };

export function chooseMove(game, difficulty = 'medium') {
  const color = game.turn;
  const roots = game.legalMoves(color);
  if (roots.length === 0) return null;

  if (difficulty === 'easy') {
    const caps = roots.filter((m) => m.captures.length);
    if (caps.length && Math.random() < 0.6) return caps[(Math.random() * caps.length) | 0];
    if (Math.random() < 0.35) return roots[(Math.random() * roots.length) | 0];
  }

  const board = game.board.slice();
  order(roots);
  const deadline = Date.now() + (BUDGET[difficulty] || 800);
  const maxDepth = DEPTH[difficulty] || 3;
  let best = roots[0];

  for (let depth = 1; depth <= maxDepth; depth++) {
    let alpha = -Infinity;
    let localBest = null;
    let aborted = false;
    const scored = [];
    for (const m of roots) {
      const snapshot = board.slice();
      applyMove(board, m, color);
      const score = -negamax(board, opponent(color), depth - 1, -Infinity, -alpha, deadline);
      board.set(snapshot);
      if (Date.now() > deadline) { aborted = true; break; }
      scored.push({ m, score });
      if (score > alpha) { alpha = score; localBest = m; }
    }
    if (localBest) best = localBest;
    if (aborted) break;
    scored.sort((a, b) => b.score - a.score);
    for (let i = 0; i < scored.length; i++) roots[i] = scored[i].m;
  }
  return best;
}

export function suggestMove(game, color) {
  const saved = game.turn;
  game.turn = color;
  const mv = chooseMove(game, 'hard');
  game.turn = saved;
  return mv;
}
