// 黑白棋 AI：Alpha-Beta + 位置权重 + 行动力

import {
  EMPTY, BLACK, WHITE, N, opponent, xOf, yOf,
  legalMovesAt, flipsAt, countDiscs,
} from './engine.js';

// 经典位置权重表（角位最高，角旁为负）
const WEIGHT = [
  120, -20, 20, 5, 5, 20, -20, 120,
  -20, -40, -5, -5, -5, -5, -40, -20,
  20, -5, 15, 3, 3, 15, -5, 20,
  5, -5, 3, 3, 3, 3, -5, 5,
  5, -5, 3, 3, 3, 3, -5, 5,
  20, -5, 15, 3, 3, 15, -5, 20,
  -20, -40, -5, -5, -5, -5, -40, -20,
  120, -20, 20, 5, 5, 20, -20, 120,
];

function phase(board) {
  let empties = 0;
  for (const v of board) if (v === EMPTY) empties++;
  return empties > 44 ? 'opening' : empties > 12 ? 'mid' : 'end';
}

function evaluate(board, color) {
  const opp = opponent(color);
  const ph = phase(board);
  let positional = 0;
  let discs = countDiscs(board);
  for (let i = 0; i < board.length; i++) {
    if (board[i] === color) positional += WEIGHT[i];
    else if (board[i] === opp) positional -= WEIGHT[i];
  }
  const myMob = legalMovesAt(board, color).length;
  const opMob = legalMovesAt(board, opp).length;
  if (ph === 'end') {
    return (discs.black - discs.white) * (color === BLACK ? 1 : -1) * 10;
  }
  const mobility = (myMob - opMob) * (ph === 'opening' ? 8 : 3);
  const corner = positional;
  return corner + mobility;
}

function applyMove(board, pos, color) {
  const flips = flipsAt(board, pos, color);
  board[pos] = color;
  for (const f of flips) board[f] = color;
}

function negamax(board, color, depth, alpha, beta) {
  const moves = legalMovesAt(board, color);
  const opp = opponent(color);
  if (moves.length === 0) {
    if (legalMovesAt(board, opp).length === 0) {
      const d = countDiscs(board);
      const diff = (d.black - d.white) * (color === BLACK ? 1 : -1);
      return diff > 0 ? 100000 + diff : diff < 0 ? -100000 + diff : 0;
    }
    return -negamax(board, opp, depth, -beta, -alpha); // 跳过
  }
  if (depth <= 0) return evaluate(board, color);

  // 排序：角位优先
  moves.sort((a, b) => WEIGHT[b] - WEIGHT[a]);
  let best = -Infinity;
  for (const m of moves) {
    const snapshot = board.slice();
    applyMove(board, m, color);
    const score = -negamax(board, opp, depth - 1, -beta, -alpha);
    board.set(snapshot);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

const DEPTH = { easy: 1, medium: 3, hard: 5 };

export function chooseMove(game, difficulty = 'medium') {
  const color = game.turn;
  const moves = game.legalMoves(color);
  if (moves.length === 0) return null;
  if (difficulty === 'easy') {
    if (Math.random() < 0.4) return moves[(Math.random() * moves.length) | 0];
  }
  const board = game.board.slice();
  moves.sort((a, b) => WEIGHT[b] - WEIGHT[a]);
  const depth = DEPTH[difficulty] || 3;
  let best = moves[0];
  let bestScore = -Infinity;
  let alpha = -Infinity;
  for (const m of moves) {
    const snapshot = board.slice();
    applyMove(board, m, color);
    const score = -negamax(board, opponent(color), depth - 1, -Infinity, -alpha);
    board.set(snapshot);
    if (score > bestScore) { bestScore = score; best = m; }
    if (score > alpha) alpha = score;
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
