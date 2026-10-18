// 五子棋 AI：威胁评估 + 浅层搜索

import { EMPTY, BLACK, WHITE, opponent, findFive } from './engine.js';

const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];

function lineScore(board, size, idx, color, dx, dy) {
  const x = idx % size;
  const y = (idx / size) | 0;
  let count = 1;
  let openEnds = 0;
  for (const s of [1, -1]) {
    let cx = x + dx * s;
    let cy = y + dy * s;
    while (cx >= 0 && cx < size && cy >= 0 && cy < size && board[cy * size + cx] === color) {
      count++;
      cx += dx * s;
      cy += dy * s;
    }
    if (cx >= 0 && cx < size && cy >= 0 && cy < size && board[cy * size + cx] === EMPTY) openEnds++;
  }
  if (count >= 5) return 10000000;
  if (count === 4) return openEnds === 2 ? 1000000 : openEnds === 1 ? 100000 : 0;
  if (count === 3) return openEnds === 2 ? 10000 : openEnds === 1 ? 1000 : 0;
  if (count === 2) return openEnds === 2 ? 100 : openEnds === 1 ? 10 : 0;
  return 1;
}

function pointScore(board, size, idx, color) {
  let s = 0;
  for (const [dx, dy] of DIRS) s += lineScore(board, size, idx, color, dx, dy);
  return s;
}

function candidates(game) {
  const { board, size } = game;
  const out = [];
  let any = false;
  const seen = new Uint8Array(board.length);
  for (let i = 0; i < board.length; i++) if (board[i] !== EMPTY) any = true;
  if (!any) return [((size / 2) | 0) * size + ((size / 2) | 0)];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === EMPTY) continue;
    const x = i % size;
    const y = (i / size) | 0;
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue;
        const j = ny * size + nx;
        if (board[j] === EMPTY && !seen[j]) {
          seen[j] = 1;
          out.push(j);
        }
      }
    }
  }
  return out;
}

export function chooseMove(game, difficulty = 'medium') {
  const { board, size } = game;
  const color = game.turn;
  const opp = opponent(color);
  const cands = candidates(game);
  if (cands.length === 0) return null;

  // 立即取胜
  for (const idx of cands) {
    board[idx] = color;
    const win = findFive(board, size, idx);
    board[idx] = EMPTY;
    if (win) return idx;
  }

  const scored = [];
  for (const idx of cands) {
    const own = pointScore(board, size, idx, color);
    const def = pointScore(board, size, idx, opp);
    scored.push({ idx, own, def, score: own + def * 0.85 });
  }
  scored.sort((a, b) => b.score - a.score);

  if (difficulty === 'easy') {
    if (Math.random() < 0.5) return cands[(Math.random() * cands.length) | 0];
    return scored[0].idx;
  }
  if (difficulty === 'medium') {
    return scored[0].idx;
  }

  // hard：对前列候选做一步前瞻（考虑对手最佳应手）
  const top = scored.slice(0, 12);
  let best = top[0];
  let bestVal = -Infinity;
  for (const cand of top) {
    board[cand.idx] = color;
    // 对手最佳应手威胁
    let oppBest = 0;
    for (const j of candidates(game)) {
      const os = pointScore(board, size, j, opp) + pointScore(board, size, j, color) * 0.3;
      if (os > oppBest) oppBest = os;
    }
    board[cand.idx] = EMPTY;
    const val = cand.own + cand.def * 0.85 - oppBest * 0.9;
    if (val > bestVal) {
      bestVal = val;
      best = cand;
    }
  }
  return best.idx;
}

export function suggestMove(game, color) {
  const saved = game.turn;
  game.turn = color;
  const mv = chooseMove(game, 'hard');
  game.turn = saved;
  return mv;
}
