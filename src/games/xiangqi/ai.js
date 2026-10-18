// 中国象棋 AI：Alpha-Beta 迭代加深

import {
  RED, BLACK, K, A, E, H, R, C, P,
  SIZE, xOf, yOf, colorOf, typeOf, opponent,
  legalMoves, makeMove, unmakeMove,
} from './engine.js';

const VAL = { [K]: 60000, [R]: 900, [H]: 420, [C]: 450, [A]: 200, [E]: 200, [P]: 100 };
const MATE = 90000;

function valueOf(board, i, p) {
  const t = typeOf(p);
  let v = VAL[t] || 0;
  const x = xOf(i);
  const y = yOf(i);
  if (t === P) {
    const c = colorOf(p);
    if (c === RED) v += (9 - y) * 8;
    else v += y * 8;
    if (c === RED ? y <= 4 : y >= 5) v += 40;
  } else if (t === H || t === C) {
    v += 6 * (4 - Math.abs(x - 4));
  }
  return v;
}

function evaluate(board, color) {
  let score = 0;
  for (let i = 0; i < SIZE; i++) {
    const p = board[i];
    if (!p) continue;
    score += (colorOf(p) === color ? 1 : -1) * valueOf(board, i, p);
  }
  return score;
}

function orderMoves(board, moves) {
  for (const m of moves) {
    const cap = board[m.to];
    m._score = cap ? (VAL[typeOf(cap)] || 0) - (VAL[typeOf(board[m.from])] || 0) / 10 : 0;
  }
  moves.sort((a, b) => b._score - a._score);
}

function search(board, color, depth, alpha, beta, deadline) {
  if (Date.now() > deadline) return { score: evaluate(board, color), aborted: true };
  const moves = legalMoves(board, color);
  if (moves.length === 0) return { score: -MATE + (4 - depth) };
  if (depth <= 0) return { score: evaluate(board, color) };

  orderMoves(board, moves);
  let best = -Infinity;
  for (const m of moves) {
    const { moved, captured } = makeMove(board, m.from, m.to);
    const r = search(board, opponent(color), depth - 1, -beta, -alpha, deadline);
    unmakeMove(board, m.from, m.to, moved, captured);
    if (r.aborted) return { score: best === -Infinity ? evaluate(board, color) : best, aborted: true };
    if (r.score > best) best = r.score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return { score: best };
}

const DEPTH = { easy: 1, medium: 2, hard: 3 };
const BUDGET = { easy: 200, medium: 700, hard: 1800 };

export function chooseMove(game, difficulty = 'medium') {
  const color = game.turn;
  const roots = game.legalMoves(color);
  if (roots.length === 0) return null;

  if (difficulty === 'easy') {
    // 入门：随机为主，偶尔走吃子
    const caps = roots.filter((m) => game.board[m.to] && typeOf(game.board[m.to]) !== K);
    if (caps.length && Math.random() < 0.5) return caps[(Math.random() * caps.length) | 0];
    return roots[(Math.random() * roots.length) | 0];
  }

  const board = game.board.slice();
  orderMoves(board, roots);
  let bestMove = roots[0];
  const deadline = Date.now() + (BUDGET[difficulty] || 700);
  const maxDepth = DEPTH[difficulty] || 2;

  for (let depth = 1; depth <= maxDepth; depth++) {
    let alpha = -Infinity;
    let localBest = null;
    let aborted = false;
    const scored = [];
    for (const m of roots) {
      const { moved, captured } = makeMove(board, m.from, m.to);
      const r = search(board, opponent(color), depth - 1, -Infinity, -alpha, deadline);
      unmakeMove(board, m.from, m.to, moved, captured);
      if (r.aborted) {
        aborted = true;
        break;
      }
      scored.push({ m, score: r.score });
      if (r.score > alpha) {
        alpha = r.score;
        localBest = m;
      }
    }
    if (localBest) bestMove = localBest;
    if (aborted) break;
    // 依分数重排根着法，提升下一层剪枝效率
    scored.sort((a, b) => b.score - a.score);
    for (let i = 0; i < scored.length; i++) roots[i] = scored[i].m;
  }

  return bestMove;
}

export function suggestMove(game, color) {
  const saved = game.turn;
  game.turn = color;
  const mv = chooseMove(game, 'hard');
  game.turn = saved;
  return mv;
}
