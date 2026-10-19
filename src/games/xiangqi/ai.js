// 中国象棋 AI：位置评估 + 静态搜索(quiescence) + 杀手/历史启发 + 迭代加深

import {
  RED, K, A, E, H, R, C, P,
  SIZE, xOf, yOf, colorOf, typeOf, opponent,
  legalMoves, makeMove, unmakeMove,
} from './engine.js';

const VAL = { [K]: 100000, [R]: 1000, [C]: 480, [H]: 460, [A]: 220, [E]: 220, [P]: 100 };
const MATE = 1000000;

function posValue(p, x, y) {
  const t = typeOf(p);
  const ry = colorOf(p) === RED ? 9 - y : y; // ry: 0=己方底线, 9=对方底线
  const cx = 4 - Math.abs(x - 4); // 0..4 中心度
  let v = VAL[t];
  if (t === P) {
    v += ry * 8 + cx * 6;
    if (ry >= 5) v += 60; // 过河
  } else if (t === H) {
    v += cx * 8;
    if (x === 0 || x === 8) v -= 30; // 边马
  } else if (t === C) {
    v += cx * 6;
  } else if (t === R) {
    v += cx * 2;
  } else if (t === A || t === E) {
    if (ry <= 1 || ry >= 9 - 1) v += 15; // 守家
  }
  return v;
}

function evaluate(board, color) {
  let s = 0;
  for (let i = 0; i < SIZE; i++) {
    const p = board[i];
    if (!p) continue;
    const v = posValue(p, xOf(i), yOf(i));
    s += colorOf(p) === color ? v : -v;
  }
  return s;
}

let killers = [];
let historyTable = new Map();
const key = (m) => m.from * 100 + m.to;

function orderMoves(board, moves, ply) {
  const k = killers[ply] || [];
  for (const m of moves) {
    const cap = board[m.to];
    const mvFrom = VAL[typeOf(board[m.from])] || 0;
    if (cap) m._s = 1000000 + (VAL[typeOf(cap)] || 0) * 10 - mvFrom;
    else if (k[0] === key(m) || k[1] === key(m)) m._s = 900000;
    else m._s = historyTable.get(key(m)) || 0;
  }
  moves.sort((a, b) => b._s - a._s);
}

function quiesce(board, color, alpha, beta, deadline, qdepth) {
  const stand = evaluate(board, color);
  if (qdepth <= 0 || Date.now() > deadline) return stand;
  if (stand >= beta) return beta;
  if (stand > alpha) alpha = stand;
  const caps = legalMoves(board, color).filter((m) => board[m.to]);
  orderMoves(board, caps, 0);
  for (const m of caps) {
    const { moved, captured } = makeMove(board, m.from, m.to);
    const sc = -quiesce(board, opponent(color), -beta, -alpha, deadline, qdepth - 1);
    unmakeMove(board, m.from, m.to, moved, captured);
    if (sc >= beta) return beta;
    if (sc > alpha) alpha = sc;
  }
  return alpha;
}

function negamax(board, color, depth, alpha, beta, ply, deadline) {
  if (Date.now() > deadline) return { score: evaluate(board, color), aborted: true };
  const moves = legalMoves(board, color);
  if (moves.length === 0) return { score: -MATE + ply }; // 象棋无子可动即负
  if (depth <= 0) return { score: quiesce(board, color, alpha, beta, deadline, 3) };

  orderMoves(board, moves, ply);
  let best = -Infinity;
  for (const m of moves) {
    const { moved, captured } = makeMove(board, m.from, m.to);
    const r = negamax(board, opponent(color), depth - 1, -beta, -alpha, ply + 1, deadline);
    unmakeMove(board, m.from, m.to, moved, captured);
    if (r.aborted) return { score: best === -Infinity ? evaluate(board, color) : best, aborted: true };
    if (r.score > best) best = r.score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) {
      if (!captured) {
        const k = killers[ply] || (killers[ply] = []);
        if (k[0] !== key(m)) { k[1] = k[0]; k[0] = key(m); }
        historyTable.set(key(m), (historyTable.get(key(m)) || 0) + depth * depth);
      }
      break;
    }
  }
  return { score: best };
}

const DEPTH = { easy: 2, medium: 5, hard: 12 };
const BUDGET = { easy: 250, medium: 600, hard: 2000 };

export function chooseMove(game, difficulty = 'medium') {
  const color = game.turn;
  const roots = game.legalMoves(color);
  if (roots.length === 0) return null;

  if (difficulty === 'easy') {
    if (Math.random() < 0.5) return roots[(Math.random() * roots.length) | 0];
  }

  const board = game.board.slice();
  killers = [];
  historyTable = new Map();
  const deadline = Date.now() + (BUDGET[difficulty] || 900);
  const maxDepth = DEPTH[difficulty] || 4;
  let bestMove = roots[0];

  orderMoves(board, roots, 0);
  for (let depth = 1; depth <= maxDepth; depth++) {
    let alpha = -Infinity;
    let localBest = null;
    let aborted = false;
    const scored = [];
    for (const m of roots) {
      const { moved, captured } = makeMove(board, m.from, m.to);
      const r = negamax(board, opponent(color), depth - 1, -Infinity, -alpha, 1, deadline);
      unmakeMove(board, m.from, m.to, moved, captured);
      if (r.aborted) { aborted = true; break; }
      scored.push({ m, score: r.score });
      if (r.score > alpha) { alpha = r.score; localBest = m; }
    }
    if (localBest) bestMove = localBest;
    if (aborted) break;
    scored.sort((a, b) => b.score - a.score);
    for (let i = 0; i < scored.length; i++) roots[i] = scored[i].m;
    if (Math.abs(alpha) >= MATE - 100) break; // 已找到杀棋
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
