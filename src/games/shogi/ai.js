// 将棋 AI：Alpha-Beta + 子力/成子/持驹评估

import {
  BLACK, WHITE, P, L, N, S, G, B, R, K, PROMOTED,
  SIZE, colorOf, typeOf, baseType, isPromoted, opponent, idx, xOf, yOf,
  findKing, legalMoves, applyMove, unapplyMove,
} from './engine.js';

const VAL = {
  [P]: 90, [L]: 300, [N]: 350, [S]: 500, [G]: 600, [B]: 830, [R]: 1000, [K]: 100000,
  [P + PROMOTED]: 560, [L + PROMOTED]: 560, [N + PROMOTED]: 560, [S + PROMOTED]: 560,
  [B + PROMOTED]: 1120, [R + PROMOTED]: 1250,
};

function pieceValue(t) {
  return VAL[t] || 100;
}

function evaluate(state, color) {
  const b = state.board;
  let s = 0;
  for (let i = 0; i < SIZE; i++) {
    const p = b[i];
    if (!p) continue;
    const c = colorOf(p);
    const t = typeOf(p);
    let v = pieceValue(t);
    if (background(t) && c === BLACK) v += (8 - yOf(i)) * 2;
    if (background(t) && c === WHITE) v += yOf(i) * 2;
    // 靠近对方阵营略加
    s += c === color ? v : -v;
  }
  for (const c of [BLACK, WHITE]) {
    const hand = state.hands[c];
    let hv = 0;
    for (const t of [P, L, N, S, G, B, R]) hv += (hand[t] || 0) * pieceValue(t) * 0.95;
    s += c === color ? hv : -hv;
  }
  return s;
}

function background(t) {
  const bt = baseType(t);
  return bt === P || bt === L || bt === N || bt === S;
}

function moveScore(state, m) {
  if (m.drop) return 40 + pieceValue(m.drop) * 0.05;
  const cap = state.board[m.to];
  let s = cap ? pieceValue(typeOf(cap)) : 0;
  if (m.promote) s += 120;
  return s;
}

function dist(a, b) {
  return Math.abs(xOf(a) - xOf(b)) + Math.abs(yOf(a) - yOf(b));
}

function aiMoves(state, color) {
  const all = legalMoves(state, color);
  const boardMoves = [];
  const drops = [];
  for (const m of all) {
    if (m.drop) drops.push(m);
    else boardMoves.push(m);
  }
  if (drops.length) {
    const ek = findKing(state.board, opponent(color));
    drops.sort((a, b) => dist(a.to, ek) - dist(b.to, ek));
    return boardMoves.concat(drops.slice(0, 20));
  }
  return boardMoves;
}

const MATE = 1000000;

function quiesce(state, color, alpha, beta, deadline, qdepth) {
  const stand = evaluate(state, color);
  if (qdepth <= 0 || Date.now() > deadline) return stand;
  if (stand >= beta) return beta;
  if (stand > alpha) alpha = stand;
  const caps = legalMoves(state, color).filter((m) => !m.drop && state.board[m.to]);
  caps.sort((a, b) => moveScore(state, b) - moveScore(state, a));
  for (const m of caps) {
    const info = applyMove(state, m);
    const sc = -quiesce(state, opponent(color), -beta, -alpha, deadline, qdepth - 1);
    unapplyMove(state, m, info);
    if (sc >= beta) return beta;
    if (sc > alpha) alpha = sc;
  }
  return alpha;
}

function negamax(state, color, depth, alpha, beta, deadline) {
  if (Date.now() > deadline) return evaluate(state, color);
  const moves = aiMoves(state, color);
  if (moves.length === 0) return -MATE + (4 - depth);
  if (depth <= 0) return quiesce(state, color, alpha, beta, deadline, 2);
  moves.sort((a, b) => moveScore(state, b) - moveScore(state, a));
  let best = -Infinity;
  for (const m of moves) {
    const info = applyMove(state, m);
    const score = -negamax(state, opponent(color), depth - 1, -beta, -alpha, deadline);
    unapplyMove(state, m, info);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

const DEPTH = { easy: 1, medium: 3, hard: 6 };
const BUDGET = { easy: 150, medium: 700, hard: 2200 };

export function chooseMove(game, difficulty = 'medium') {
  const color = game.turn;
  const state = { board: game.board, hands: game.hands, turn: color };
  const roots = aiMoves(state, color);
  if (roots.length === 0) return null;

  if (difficulty === 'easy') {
    const caps = roots.filter((m) => !m.drop && state.board[m.to]);
    if (caps.length && Math.random() < 0.5) return caps[(Math.random() * caps.length) | 0];
    if (Math.random() < 0.35) return roots[(Math.random() * roots.length) | 0];
  }

  roots.sort((a, b) => moveScore(state, b) - moveScore(state, a));
  const deadline = Date.now() + (BUDGET[difficulty] || 500);
  const maxDepth = DEPTH[difficulty] || 2;
  let best = roots[0];

  for (let depth = 1; depth <= maxDepth; depth++) {
    let alpha = -Infinity;
    let localBest = null;
    let aborted = false;
    const scored = [];
    for (const m of roots) {
      const info = applyMove(state, m);
      const score = -negamax(state, opponent(color), depth - 1, -Infinity, -alpha, deadline);
      unapplyMove(state, m, info);
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
