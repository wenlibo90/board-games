// 围棋 AI：启发式评估 + 蒙特卡洛推演（多难度）

import {
  EMPTY,
  BLACK,
  WHITE,
  opponent,
  neighborsOf,
  collectGroup,
  tryPlay,
  isTrueEye,
  computeScore,
} from './engine.js';

function localDensity(board, size, idx, radius) {
  const x = idx % size;
  const y = (idx / size) | 0;
  let count = 0;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue;
      if (board[ny * size + nx] !== EMPTY) count++;
    }
  }
  return count;
}

function edgeDistance(size, idx) {
  const x = idx % size;
  const y = (idx / size) | 0;
  return Math.min(x, y, size - 1 - x, size - 1 - y);
}

// 候选点：靠近已有棋子的空点
function candidateMoves(game) {
  const { board, size } = game;
  const out = [];
  let stoneCount = 0;
  for (let i = 0; i < board.length; i++) if (board[i] !== EMPTY) stoneCount++;

  if (stoneCount === 0) {
    const mid = Math.floor(size / 2);
    const star = size === 9 ? 2 : size === 13 ? 3 : 3;
    const preferred = [
      mid * size + mid,
      star * size + star,
      (size - 1 - star) * size + (size - 1 - star),
      star * size + (size - 1 - star),
      (size - 1 - star) * size + star,
    ];
    for (const p of preferred) {
      if (p >= 0 && p < board.length) return [p];
    }
  }

  const seen = new Uint8Array(board.length);
  for (let i = 0; i < board.length; i++) {
    if (board[i] === EMPTY) continue;
    for (const n of neighborsOf(size, i)) {
      if (board[n] === EMPTY && !seen[n]) {
        seen[n] = 1;
        out.push(n);
      }
    }
  }
  return out;
}

// 对单个落点做启发式打分
function evaluateMove(game, idx, color, opts) {
  const { board, size } = game;
  const koPoint = color === game.turn ? game.koPoint : -1;
  const opp = opponent(color);

  const before = board.slice();
  const copy = board.slice();
  const res = tryPlay(copy, size, idx, color, koPoint);
  if (!res) return null;

  let score = 0;

  if (res.captured.length) score += 14 * res.captured.length + 6;

  const own = collectGroup(copy, size, idx);
  score += Math.min(own.liberties.size, 6) * 1.6;

  // 连接己方棋块
  const seenFriendly = new Set();
  let connGroups = 0;
  for (const n of neighborsOf(size, idx)) {
    if (before[n] === color && !seenFriendly.has(n)) {
      const gb = collectGroup(before, size, n);
      for (const s of gb.stones) seenFriendly.add(s);
      connGroups++;
    }
  }
  if (connGroups >= 2) score += (connGroups - 1) * 5;

  // 不要紧贴对方强棋而自身无援
  if (connGroups === 0 && own.liberties.size <= 2) score -= 3;

  // 打吃对方
  const seenAtari = new Set();
  for (const n of neighborsOf(size, idx)) {
    if (before[n] === opp) {
      const g = collectGroup(copy, size, n);
      if (g.liberties.size === 1 && !seenAtari.has(g.stones[0])) {
        seenAtari.add(g.stones[0]);
        score += 7;
      }
    }
  }

  // 救活自己被打吃的棋块
  const seenSave = new Set();
  for (const n of neighborsOf(size, idx)) {
    if (before[n] === color && !seenSave.has(n)) {
      const gb = collectGroup(before, size, n);
      for (const s of gb.stones) seenSave.add(s);
      if (gb.liberties.size === 1) {
        const ga = collectGroup(copy, size, n);
        if (ga.liberties.size > 1) score += 10 + Math.min(ga.liberties.size, 4);
      }
    }
  }

  // 避免送死（自己只剩一口气且没提子）
  if (res.captured.length === 0 && own.liberties.size === 1) score -= 9;

  // 避免填自己的真眼
  if (isTrueEye(before, size, idx, color)) {
    score -= res.captured.length ? 0 : 40;
  }

  // 位置价值
  const density = localDensity(before, size, idx, 2);
  score += Math.min(density, 6) * 0.8;
  if (density === 0) score -= 2.5;

  const ed = edgeDistance(size, idx);
  const opening = 1 - Math.min(1, opts.stoneCount / (size * size * 0.35));
  if (ed === 0) score -= 4 * opening + 1;
  else if (ed === 1) score += 1.2;
  else if (ed === 2) score += 1.8;
  else if (ed === 3) score += 1.5;

  score += Math.random() * opts.noise;

  return { idx, score, captured: res.captured.length };
}

function randomLegalMove(board, size, color, ko) {
  let empties = [];
  let adjacent = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] !== EMPTY) continue;
    let touches = false;
    for (const n of neighborsOf(size, i)) {
      if (board[n] !== EMPTY) {
        touches = true;
        break;
      }
    }
    if (touches) adjacent.push(i);
    else empties.push(i);
  }
  const pool = adjacent.length > empties.length ? adjacent : empties;
  const other = adjacent.length > empties.length ? empties : adjacent;
  const tries = pool.length + other.length;
  for (let t = 0; t < tries; t++) {
    const usePool = t < pool.length;
    const src = usePool ? pool : other;
    const i = usePool ? t : t - pool.length;
    const idx = src[(Math.random() * src.length) | 0];
    if (idx === undefined) continue;
    if (isTrueEye(board, size, idx, color)) continue;
    const copy = board.slice();
    const r = tryPlay(copy, size, idx, color, ko);
    if (r) return { idx, res: r };
  }
  // 兜底：任意合法点
  for (let i = 0; i < board.length; i++) {
    if (board[i] !== EMPTY) continue;
    const copy = board.slice();
    const r = tryPlay(copy, size, i, color, ko);
    if (r) return { idx: i, res: r };
  }
  return null;
}

// 随机推演到终局，返回黑-白分差
function randomPlayout(board, size, colorToMove, komi, maxMoves) {
  const b = board.slice();
  let turn = colorToMove;
  let ko = -1;
  let passes = 0;
  for (let m = 0; m < maxMoves && passes < 2; m++) {
    const mv = randomLegalMove(b, size, turn, ko);
    if (!mv) {
      passes++;
      turn = opponent(turn);
      ko = -1;
      continue;
    }
    passes = 0;
    ko = mv.res.ko;
    turn = opponent(turn);
  }
  return computeScore(b, size, komi).diff;
}

const DIFFICULTY = {
  easy: { noise: 6, randomChance: 0.55, topK: 1, playouts: 0, budget: 0 },
  medium: { noise: 1.6, randomChance: 0.1, topK: 4, playouts: 0, budget: 300 },
  hard: { noise: 1.2, randomChance: 0, topK: 8, playouts: 0, budget: 700 },
};

function playoutsFor(difficulty, size) {
  const cap = difficulty === 'hard' ? 1 : 0.55;
  let base;
  if (size <= 9) base = 40;
  else if (size <= 13) base = 18;
  else base = 7;
  return Math.max(4, Math.round(base * cap));
}

/**
 * 选择落点。
 * @returns {{idx:number, pass:boolean}}
 */
export function chooseMove(game, difficulty = 'medium') {
  const opts = DIFFICULTY[difficulty] || DIFFICULTY.medium;
  const { board, size } = game;
  const color = game.turn;

  let stoneCount = 0;
  for (let i = 0; i < board.length; i++) if (board[i] !== EMPTY) stoneCount++;

  const candidates = candidateMoves(game);
  if (candidates.length === 0) {
    return { idx: -1, pass: true };
  }

  const evalOpts = { noise: opts.noise, stoneCount };
  const scored = [];
  for (const idx of candidates) {
    const e = evaluateMove(game, idx, color, evalOpts);
    if (e) scored.push(e);
  }

  if (scored.length === 0) {
    return { idx: -1, pass: true };
  }
  scored.sort((a, b) => b.score - a.score);

  // 随机性（新手难度）
  if (Math.random() < opts.randomChance) {
    const pick = scored[(Math.random() * Math.min(scored.length, 12)) | 0];
    return { idx: pick.idx, pass: false };
  }

  let best = scored[0];

  // 中高级：蒙特卡洛推演，细化前若干候选
  if (opts.budget > 0) {
    const topK = scored.slice(0, opts.topK);
    const nPlayouts = playoutsFor(difficulty, size);
    const budget = opts.budget || 0;
    const start = Date.now();
    let bestAvg = -Infinity;
    let timedOut = false;

    for (const cand of topK) {
      let sum = 0;
      let n = 0;
      for (let p = 0; p < nPlayouts; p++) {
        const sim = board.slice();
        const r = tryPlay(sim, size, cand.idx, color, game.koPoint);
        if (!r) break;
        const diff = randomPlayout(sim, size, opponent(color), game.komi, size * size);
        const value = color === BLACK ? diff : -diff;
        sum += value;
        n++;
        if (budget && Date.now() - start > budget) {
          timedOut = true;
          break;
        }
      }
      const avg = n ? sum / n + cand.score * 0.15 : -Infinity;
      if (avg > bestAvg) {
        bestAvg = avg;
        best = cand;
      }
      if (timedOut) break;
    }
  }

  // 开孏阶段避免立即停一手；对手停一手且自己领先时收束
  const passOk =
    (game.consecutivePasses >= 1 && best.score < 2) ||
    best.score < -20;
  if (passOk && game.consecutivePasses >= 1) {
    return { idx: -1, pass: true };
  }

  return { idx: best.idx, pass: false };
}

/**
 * 给人类玩家的提示（启发式最佳点）。
 */
export function suggestMove(game, color) {
  const opts = { noise: 0.6 };
  let stoneCount = 0;
  for (let i = 0; i < game.board.length; i++) if (game.board[i] !== EMPTY) stoneCount++;
  opts.stoneCount = stoneCount;

  const candidates = candidateMoves(game);
  const scored = [];
  for (const idx of candidates) {
    const e = evaluateMove(game, idx, color, opts);
    if (e) scored.push(e);
  }
  if (!scored.length) return -1;
  scored.sort((a, b) => b.score - a.score);
  return scored[0].idx;
}
