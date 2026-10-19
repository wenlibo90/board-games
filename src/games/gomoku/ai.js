// 五子棋 AI：进攻导向策略
// 1) 立即成五 → 2) 紧急堵四 → 3) 进攻/防守加权评分（进攻权重高于防守）
// 评分按“五格窗口”统计并区分活/眠型（活型价值远高于眠型），hard 额外做一步前瞻。

import { EMPTY, opponent, findFive } from './engine.js';

const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];

// 五格窗口评分表：区分活性（窗口两端是否为空），活型价值远高于眠型
function patternScore(virtualStones, openEnds) {
  if (virtualStones >= 5) return 10000000;
  if (virtualStones === 4) return openEnds === 2 ? 1000000 : openEnds === 1 ? 100000 : 0;
  if (virtualStones === 3) return openEnds === 2 ? 12000 : openEnds === 1 ? 1000 : 0;
  if (virtualStones === 2) return openEnds === 2 ? 120 : openEnds === 1 ? 12 : 0;
  return 1;
}

// 评估在 idx 落 playerRole 子的价值：扫描所有经过该点的 5 格窗口
function scorePosition(board, size, idx, playerRole) {
  const opp = opponent(playerRole);
  const x0 = idx % size;
  const y0 = (idx / size) | 0;
  let score = 0;
  for (const [dx, dy] of DIRS) {
    for (let offset = -4; offset <= 0; offset++) {
      let blocked = false;
      let self = 0;
      for (let i = 0; i < 5; i++) {
        const step = offset + i;
        const x = x0 + step * dx;
        const y = y0 + step * dy;
        if (x < 0 || x >= size || y < 0 || y >= size) { blocked = true; break; } // 出界视为被堵
        const v = board[y * size + x];
        if (v === opp) { blocked = true; break; }
        if (v === playerRole) self++;
      }
      if (blocked) continue;
      // 活性：窗口两侧端点为空视为活型，进攻价值更高
      let openEnds = 0;
      for (const s of [offset - 1, offset + 5]) {
        const x = x0 + s * dx;
        const y = y0 + s * dy;
        if (x >= 0 && x < size && y >= 0 && y < size && board[y * size + x] === EMPTY) openEnds++;
      }
      score += patternScore(self + 1, openEnds);
    }
  }
  return score;
}

const WEIGHTS = {
  easy: { offense: 1.0, defense: 0.7, noise: 15 },
  medium: { offense: 1.15, defense: 0.9, noise: 0 },
  hard: { offense: 1.2, defense: 1.0, noise: 0 },
};

export function chooseMove(game, difficulty = 'medium') {
  const { board, size } = game;
  const color = game.turn;
  const opp = opponent(color);
  const w = WEIGHTS[difficulty] || WEIGHTS.medium;
  const mid = ((size - 1) / 2) | 0;

  // 统计棋子
  let stones = 0;
  let centerStone = false;
  for (let i = 0; i < board.length; i++) {
    if (board[i] === EMPTY) continue;
    stones++;
    if (i === mid * size + mid) centerStone = true;
  }

  // 空盘：走中央
  if (stones === 0) return mid * size + mid;
  // 仅中央一子（对手或自己）：走邻位
  if (stones === 1 && centerStone) {
    const adj = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const x = mid + dx, y = mid + dy;
      if (x >= 0 && x < size && y >= 0 && y < size && board[y * size + x] === EMPTY) adj.push(y * size + x);
    }
    if (adj.length) return adj[(Math.random() * adj.length) | 0];
  }

  // 立即成五 / 紧急堵四
  let immediateWin = -1;
  let emergencyDefend = -1;
  for (let i = 0; i < board.length; i++) {
    if (board[i] !== EMPTY) continue;
    board[i] = color;
    if (findFive(board, size, i)) immediateWin = i;
    board[i] = opp;
    if (findFive(board, size, i)) emergencyDefend = i;
    board[i] = EMPTY;
    if (immediateWin >= 0) break;
  }
  if (immediateWin >= 0) return immediateWin;
  if (emergencyDefend >= 0) return emergencyDefend;

  // 评分选点：先按静态分排序，hard 对头部候选做一步前瞻（考虑对手最佳应手）
  const scored = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] !== EMPTY) continue;
    const x = i % size;
    const y = (i / size) | 0;
    const centerDist = Math.abs(x - (size - 1) / 2) + Math.abs(y - (size - 1) / 2);
    const positional = Math.max(0, (size - 1) - centerDist) * 0.15;
    const aiScore = scorePosition(board, size, i, color);
    const playerScore = scorePosition(board, size, i, opp);
    let total = aiScore * w.offense + playerScore * w.defense + positional;
    if (w.noise) total += Math.random() * w.noise;
    scored.push({ idx: i, total });
  }
  if (!scored.length) return null;
  scored.sort((a, b) => b.total - a.total);

  // hard：一步前瞻，避免只顾单步得分而放任对手连型
  if (difficulty === 'hard') {
    const top = scored.slice(0, 12);
    let best = top[0];
    let bestVal = -Infinity;
    for (const cand of top) {
      board[cand.idx] = color;
      let oppBest = 0;
      for (const s of scored) {
        if (board[s.idx] !== EMPTY) continue;
        const os = scorePosition(board, size, s.idx, opp) + scorePosition(board, size, s.idx, color) * 0.3;
        if (os > oppBest) oppBest = os;
      }
      board[cand.idx] = EMPTY;
      const val = cand.total - oppBest * 0.9;
      if (val > bestVal) { bestVal = val; best = cand; }
    }
    return best.idx;
  }

  // easy/medium：头部候选内随机，保证多样性
  const pool = difficulty === 'easy' ? scored.slice(0, 8) : scored.slice(0, 2);
  return pool[(Math.random() * pool.length) | 0].idx;
}

export function suggestMove(game, color) {
  const saved = game.turn;
  game.turn = color;
  const mv = chooseMove(game, 'hard');
  game.turn = saved;
  return mv;
}
