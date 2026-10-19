// 五子棋 AI：延续原整页那套策略
// 1) 立即成五 → 2) 紧急堵四 → 3) 进攻/防守加权评分（按难度调整权重），并按中心位置微调
// 评估方式为“五格窗口”模式统计（含虚拟落子），与原策略一致。

import { EMPTY, opponent, findFive } from './engine.js';

const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];

// 五格窗口的权重矩阵（虚拟落子后窗口内己方子数 → 分值）
function patternScore(virtualStones) {
  switch (virtualStones) {
    case 5: return 80000;
    case 4: return 4500;
    case 3: return 800;
    case 2: return 80;
    case 1: return 5;
    default: return 0;
  }
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
      if (!blocked) score += patternScore(self + 1); // 加上虚拟落子
    }
  }
  return score;
}

const WEIGHTS = {
  easy: { offense: 0.6, defense: 0.55, noise: 15 },
  medium: { offense: 1.0, defense: 0.95, noise: 0 },
  hard: { offense: 1.0, defense: 1.25, noise: 0 },
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

  // 评分选点
  let bestScore = -Infinity;
  let candidates = [];
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
    if (total > bestScore) { bestScore = total; candidates = [i]; }
    else if (total === bestScore) candidates.push(i);
  }
  if (!candidates.length) return null;
  return candidates[(Math.random() * candidates.length) | 0];
}

export function suggestMove(game, color) {
  const saved = game.turn;
  game.turn = color;
  const mv = chooseMove(game, 'hard');
  game.turn = saved;
  return mv;
}
