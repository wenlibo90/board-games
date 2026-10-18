// 国际象棋 AI：Alpha-Beta + 静态搜索（quiescence），子力 + 位置表评估

import {
  WHITE, BLACK, P, N, B, R, Q, K, SIZE,
  colorOf, typeOf, opponent, xOf, yOf,
  legalMoves, makeMove, unmakeMove, inCheck,
} from './engine.js';

const VAL = { [P]: 100, [N]: 320, [B]: 330, [R]: 500, [Q]: 900, [K]: 20000 };
const MATE = 100000;

const PST = {
  [P]: [
    0, 0, 0, 0, 0, 0, 0, 0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5, 5, 10, 25, 25, 10, 5, 5,
    0, 0, 0, 20, 20, 0, 0, 0,
    5, -5, -10, 0, 0, -10, -5, 5,
    5, 10, 10, -20, -20, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0,
  ],
  [N]: [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20, 0, 0, 0, 0, -20, -40,
    -30, 0, 10, 15, 15, 10, 0, -30,
    -30, 5, 15, 20, 20, 15, 5, -30,
    -30, 0, 15, 20, 20, 15, 0, -30,
    -30, 5, 10, 15, 15, 10, 5, -30,
    -40, -20, 0, 5, 5, 0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  [B]: [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 10, 10, 5, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10,
    -10, 0, 10, 10, 10, 10, 0, -10,
    -10, 10, 10, 10, 10, 10, 10, -10,
    -10, 5, 0, 0, 0, 0, 5, -10,
    -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  [R]: [
    0, 0, 0, 0, 0, 0, 0, 0,
    5, 10, 10, 10, 10, 10, 10, 5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    0, 0, 0, 5, 5, 0, 0, 0,
  ],
  [Q]: [
    -20, -10, -10, -5, -5, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5,
    0, 0, 5, 5, 5, 5, 0, -5,
    -10, 5, 5, 5, 5, 5, 0, -10,
    -10, 0, 5, 0, 0, 0, 0, -10,
    -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  [K]: [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    20, 20, 0, 0, 0, 0, 20, 20,
    20, 30, 10, 0, 0, 10, 30, 20,
  ],
};

function evaluate(board, color) {
  let score = 0;
  for (let i = 0; i < SIZE; i++) {
    const p = board[i];
    if (!p) continue;
    const t = typeOf(p);
    const c = colorOf(p);
    const mirrored = c === WHITE ? i : (7 - yOf(i)) * 8 + xOf(i);
    const v = VAL[t] + (PST[t] ? PST[t][mirrored] : 0);
    score += c === color ? v : -v;
  }
  return score;
}

function moveScore(board, m) {
  const cap = board[m.to];
  let s = 0;
  if (cap) s += 10 * (VAL[typeOf(cap)] || 0) - (VAL[typeOf(board[m.from])] || 0);
  else if (m.ep) s += 100;
  if (m.promotion) s += VAL[m.promotion] || 0;
  return s;
}

function order(board, moves) {
  for (const m of moves) m._s = moveScore(board, m);
  moves.sort((a, b) => b._s - a._s);
}

function quiesce(pos, color, alpha, beta, deadline, qdepth) {
  const stand = evaluate(pos.board, color);
  if (qdepth <= 0 || Date.now() > deadline) return stand;
  if (stand >= beta) return beta;
  if (stand > alpha) alpha = stand;
  const caps = legalMoves(pos, color).filter((m) => pos.board[m.to] || m.ep || m.promotion);
  order(pos.board, caps);
  for (const m of caps) {
    const u = makeMove(pos, m);
    const score = -quiesce(pos, opponent(color), -beta, -alpha, deadline, qdepth - 1);
    unmakeMove(pos, m, u);
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function negamax(pos, color, depth, alpha, beta, deadline) {
  if (Date.now() > deadline) return { score: evaluate(pos.board, color), aborted: true };
  const moves = legalMoves(pos, color);
  if (moves.length === 0) {
    return { score: inCheck(pos.board, color) ? -MATE + (10 - depth) : 0 };
  }
  if (depth <= 0) return { score: quiesce(pos, color, alpha, beta, deadline, 4) };
  order(pos.board, moves);
  let best = -Infinity;
  for (const m of moves) {
    const u = makeMove(pos, m);
    const r = negamax(pos, opponent(color), depth - 1, -beta, -alpha, deadline);
    unmakeMove(pos, m, u);
    if (r.aborted) return { score: best === -Infinity ? evaluate(pos.board, color) : best, aborted: true };
    if (r.score > best) best = r.score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return { score: best };
}

const DEPTH = { easy: 1, medium: 2, hard: 3 };
const BUDGET = { easy: 250, medium: 900, hard: 2000 };

export function chooseMove(game, difficulty = 'medium') {
  const color = game.turn;
  const roots = game.legalMoves(color);
  if (roots.length === 0) return null;

  if (difficulty === 'easy') {
    const caps = roots.filter((m) => game.board[m.to] || m.ep);
    if (caps.length && Math.random() < 0.45) return caps[(Math.random() * caps.length) | 0];
    return roots[(Math.random() * roots.length) | 0];
  }

  const pos = { board: game.board.slice(), turn: color, castling: game.castling, ep: game.ep, halfmove: game.halfmove };
  order(pos.board, roots);
  const deadline = Date.now() + (BUDGET[difficulty] || 900);
  const maxDepth = DEPTH[difficulty] || 2;
  let bestMove = roots[0];

  for (let depth = 1; depth <= maxDepth; depth++) {
    let alpha = -Infinity;
    let localBest = null;
    let aborted = false;
    const scored = [];
    for (const m of roots) {
      const u = makeMove(pos, m);
      const r = negamax(pos, opponent(color), depth - 1, -Infinity, -alpha, deadline);
      unmakeMove(pos, m, u);
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
