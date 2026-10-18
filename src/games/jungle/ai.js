// 斗兽棋 AI：Alpha-Beta + 子力/推进评估

import {
  RED, BLUE, RAT, CAT, DOG, WOLF, LEOPARD, TIGER, LION, ELEPHANT,
  SIZE, COLS, ROWS, colorOf, rankOf, opponent, xOf, yOf, DEN, isTrapOf, genMovesFrom,
} from './engine.js';

const VAL = {
  [RAT]: 45, [CAT]: 25, [DOG]: 35, [WOLF]: 50, [LEOPARD]: 65, [TIGER]: 90, [LION]: 100, [ELEPHANT]: 110,
};
const MATE = 100000;

function evaluate(board, color) {
  let s = 0;
  for (let i = 0; i < SIZE; i++) {
    const p = board[i];
    if (!p) continue;
    const c = colorOf(p);
    const r = rankOf(p);
    let v = VAL[r] || 40;
    // 推进：靠近对方兽穴加分
    const target = DEN[opponent(c)];
    const d = Math.abs(xOf(i) - xOf(target)) + Math.abs(yOf(i) - yOf(target));
    v += (16 - d) * 1.5;
    if (isTrapOf(i, opponent(c))) v -= 20;
    s += c === color ? v : -v;
  }
  return s;
}

function allMoves(board, color) {
  const out = [];
  for (let i = 0; i < SIZE; i++) {
    const p = board[i];
    if (p && colorOf(p) === color) out.push(...genMovesFrom(board, i, color));
  }
  return out;
}

function apply(board, m, color) {
  const captured = board[m.to];
  board[m.to] = board[m.from];
  board[m.from] = 0;
  return captured;
}
function unapply(board, m, captured) {
  board[m.from] = board[m.to];
  board[m.to] = captured;
}

function negamax(board, color, depth, alpha, beta, deadline) {
  if (Date.now() > deadline) return evaluate(board, color);
  const moves = allMoves(board, color);
  if (moves.length === 0) return -MATE + (10 - depth);
  if (depth <= 0) return evaluate(board, color);
  moves.sort((a, b) => (board[b.to] ? VAL[rankOf(board[b.to])] || 0 : 0) - (board[a.to] ? VAL[rankOf(board[a.to])] || 0 : 0));
  let best = -Infinity;
  for (const m of moves) {
    const cap = apply(board, m, color);
    if (m.to === DEN[opponent(color)]) { unapply(board, m, cap); return MATE - (10 - depth); }
    const score = -negamax(board, opponent(color), depth - 1, -beta, -alpha, deadline);
    unapply(board, m, cap);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

const DEPTH = { easy: 1, medium: 3, hard: 5 };
const BUDGET = { easy: 150, medium: 700, hard: 2000 };

export function chooseMove(game, difficulty = 'medium') {
  const color = game.turn;
  const roots = game.legalMoves(color);
  if (roots.length === 0) return null;
  if (difficulty === 'easy') {
    const caps = roots.filter((m) => game.board[m.to]);
    if (caps.length && Math.random() < 0.5) return caps[(Math.random() * caps.length) | 0];
    if (Math.random() < 0.35) return roots[(Math.random() * roots.length) | 0];
  }
  const board = game.board.slice();
  roots.sort((a, b) => (board[b.to] ? VAL[rankOf(board[b.to])] || 0 : 0) - (board[a.to] ? VAL[rankOf(board[a.to])] || 0 : 0));
  const deadline = Date.now() + (BUDGET[difficulty] || 700);
  const maxDepth = DEPTH[difficulty] || 3;
  let best = roots[0];
  for (let depth = 1; depth <= maxDepth; depth++) {
    let alpha = -Infinity, localBest = null, aborted = false;
    const scored = [];
    for (const m of roots) {
      const cap = apply(board, m, color);
      if (m.to === DEN[opponent(color)]) { unapply(board, m, cap); return m; }
      const score = -negamax(board, opponent(color), depth - 1, -Infinity, -alpha, deadline);
      unapply(board, m, cap);
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
