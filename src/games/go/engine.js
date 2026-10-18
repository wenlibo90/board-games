// 围棋规则引擎：棋盘、气的计算、提子、禁着点、打劫、数子（中国规则）

export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;

export function opponent(color) {
  return color === BLACK ? WHITE : BLACK;
}

export function colorName(color) {
  return color === BLACK ? '黑' : color === WHITE ? '白' : '空';
}

const neighborCache = new Map();

export function neighborsOf(size, idx) {
  let tbl = neighborCache.get(size);
  if (!tbl) {
    tbl = new Array(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = y * size + x;
        const arr = [];
        if (x > 0) arr.push(i - 1);
        if (x < size - 1) arr.push(i + 1);
        if (y > 0) arr.push(i - size);
        if (y < size - 1) arr.push(i + size);
        tbl[i] = arr;
      }
    }
    neighborCache.set(size, tbl);
  }
  return tbl[idx];
}

export function diagonalsOf(size, idx) {
  const x = idx % size;
  const y = (idx / size) | 0;
  const out = [];
  if (x > 0 && y > 0) out.push(idx - size - 1);
  if (x < size - 1 && y > 0) out.push(idx - size + 1);
  if (x > 0 && y < size - 1) out.push(idx + size - 1);
  if (x < size - 1 && y < size - 1) out.push(idx + size + 1);
  return out;
}

// 收集某点所属棋块：棋子列表与气（空邻点）集合
export function collectGroup(board, size, idx) {
  const color = board[idx];
  const stones = [idx];
  const seen = new Set([idx]);
  const liberties = new Set();
  const stack = [idx];
  while (stack.length) {
    const p = stack.pop();
    const nb = neighborsOf(size, p);
    for (let k = 0; k < nb.length; k++) {
      const n = nb[k];
      const v = board[n];
      if (v === EMPTY) {
        liberties.add(n);
      } else if (v === color && !seen.has(n)) {
        seen.add(n);
        stones.push(n);
        stack.push(n);
      }
    }
  }
  return { color, stones, liberties };
}

// 尝试落子（就地修改 board）。返回 null 表示非法，否则返回 { captured, ko }
export function tryPlay(board, size, idx, color, koPoint = -1) {
  if (idx < 0 || idx >= board.length) return null;
  if (board[idx] !== EMPTY) return null;
  if (idx === koPoint) return null;

  const opp = opponent(color);
  const captured = [];
  board[idx] = color;

  const nb = neighborsOf(size, idx);
  for (let k = 0; k < nb.length; k++) {
    const n = nb[k];
    if (board[n] === opp) {
      const g = collectGroup(board, size, n);
      if (g.liberties.size === 0) {
        for (const s of g.stones) {
          board[s] = EMPTY;
          captured.push(s);
        }
      }
    }
  }

  const own = collectGroup(board, size, idx);
  if (captured.length === 0 && own.liberties.size === 0) {
    board[idx] = EMPTY;
    return null; // 自杀（禁着点）
  }

  let ko = -1;
  if (captured.length === 1 && own.stones.length === 1 && own.liberties.size === 1) {
    ko = captured[0];
  }
  return { captured, ko };
}

export function isLegal(board, size, idx, color, koPoint = -1) {
  if (board[idx] !== EMPTY) return false;
  if (idx === koPoint) return false;
  const copy = board.slice();
  return tryPlay(copy, size, idx, color, koPoint) !== null;
}

// 真眼判定：用于 AI 避免自填眼
export function isTrueEye(board, size, idx, color) {
  if (board[idx] !== EMPTY) return false;
  const nb = neighborsOf(size, idx);
  for (let k = 0; k < nb.length; k++) {
    if (board[nb[k]] !== color) return false;
  }
  const diag = diagonalsOf(size, idx);
  if (diag.length === 0) return true;
  let friendly = 0;
  for (let k = 0; k < diag.length; k++) {
    if (board[diag[k]] === color) friendly++;
  }
  return friendly >= diag.length - 1;
}

// 中国规则数子：己方棋子 + 己方所围空点
export function computeScore(board, size, komi) {
  let blackStones = 0;
  let whiteStones = 0;
  for (let i = 0; i < board.length; i++) {
    if (board[i] === BLACK) blackStones++;
    else if (board[i] === WHITE) whiteStones++;
  }

  const visited = new Uint8Array(board.length);
  const blackTerritory = [];
  const whiteTerritory = [];
  const neutral = [];

  for (let i = 0; i < board.length; i++) {
    if (board[i] !== EMPTY || visited[i]) continue;
    const region = [];
    const borders = new Set();
    visited[i] = 1;
    const stack = [i];
    while (stack.length) {
      const p = stack.pop();
      region.push(p);
      const nb = neighborsOf(size, p);
      for (let k = 0; k < nb.length; k++) {
        const n = nb[k];
        if (board[n] === EMPTY) {
          if (!visited[n]) {
            visited[n] = 1;
            stack.push(n);
          }
        } else {
          borders.add(board[n]);
        }
      }
    }
    if (borders.size === 1) {
      const c = borders.values().next().value;
      if (c === BLACK) {
        for (const p of region) blackTerritory.push(p);
      } else {
        for (const p of region) whiteTerritory.push(p);
      }
    } else {
      for (const p of region) neutral.push(p);
    }
  }

  const black = blackStones + blackTerritory.length;
  const white = whiteStones + whiteTerritory.length + komi;
  return {
    black,
    white,
    blackStones,
    whiteStones,
    blackTerritory,
    whiteTerritory,
    neutral,
    komi,
    diff: black - white,
  };
}

/**
 * 一局棋的完整状态机。
 */
export class GoGame {
  constructor(size = 9, komi = 6.5) {
    this.size = size;
    this.komi = komi;
    this.reset();
  }

  reset() {
    this.board = new Int8Array(this.size * this.size);
    this.turn = BLACK;
    this.koPoint = -1;
    this.captures = { [BLACK]: 0, [WHITE]: 0 };
    this.history = [];
    this.moves = [];
    this.lastMove = -1;
    this.lastColor = EMPTY;
    this.consecutivePasses = 0;
    this.ended = false;
    this.result = null;
  }

  snapshot() {
    return {
      board: this.board.slice(),
      turn: this.turn,
      koPoint: this.koPoint,
      captures: { ...this.captures },
      lastMove: this.lastMove,
      lastColor: this.lastColor,
      consecutivePasses: this.consecutivePasses,
      ended: this.ended,
      result: this.result,
      moveCount: this.moves.length,
    };
  }

  restore(snap) {
    this.board = snap.board.slice();
    this.turn = snap.turn;
    this.koPoint = snap.koPoint;
    this.captures = { ...snap.captures };
    this.lastMove = snap.lastMove;
    this.lastColor = snap.lastColor;
    this.consecutivePasses = snap.consecutivePasses;
    this.ended = snap.ended;
    this.result = snap.result;
    this.moves.length = snap.moveCount;
  }

  legal(idx) {
    if (this.ended) return false;
    return isLegal(this.board, this.size, idx, this.turn, this.koPoint);
  }

  play(idx) {
    if (this.ended) return { ok: false, reason: 'ended' };
    if (!this.legal(idx)) return { ok: false, reason: 'illegal' };
    const snap = this.snapshot();
    const res = tryPlay(this.board, this.size, idx, this.turn, this.koPoint);
    if (!res) return { ok: false, reason: 'illegal' };
    this.captures[this.turn] += res.captured.length;
    this.moves.push({ idx, color: this.turn, captured: res.captured.slice() });
    this.history.push(snap);
    this.koPoint = res.ko;
    this.lastMove = idx;
    this.lastColor = this.turn;
    this.consecutivePasses = 0;
    this.turn = opponent(this.turn);
    return { ok: true, captured: res.captured, ko: res.ko };
  }

  pass() {
    if (this.ended) return { ok: false };
    this.history.push(this.snapshot());
    this.moves.push({ idx: -1, color: this.turn, pass: true });
    this.koPoint = -1;
    this.lastMove = -1;
    this.consecutivePasses++;
    this.turn = opponent(this.turn);
    if (this.consecutivePasses >= 2) {
      this.finishByScore();
    }
    return { ok: true };
  }

  resign(color) {
    if (this.ended) return { ok: false };
    const winner = opponent(color);
    this.ended = true;
    this.result = {
      reason: 'resign',
      resigned: color,
      winner,
      text: `${colorName(winner)}胜（${colorName(color)}认输）`,
    };
    return { ok: true };
  }

  finishByScore() {
    const score = computeScore(this.board, this.size, this.komi);
    let winner;
    if (score.diff > 0) winner = BLACK;
    else if (score.diff < 0) winner = WHITE;
    else winner = EMPTY;
    const margin = Math.abs(score.diff);
    this.ended = true;
    this.result = {
      reason: 'score',
      winner,
      score,
      text:
        winner === EMPTY
          ? `和棋（黑 ${score.black} : 白 ${score.white}）`
          : `${colorName(winner)}胜 ${margin} 子（黑 ${score.black} : 白 ${score.white}）`,
    };
    return this.result;
  }

  undo() {
    if (this.history.length === 0) return false;
    const snap = this.history.pop();
    this.restore(snap);
    this.ended = snap.ended;
    this.result = snap.result;
    return true;
  }

  score() {
    return computeScore(this.board, this.size, this.komi);
  }

  legalMoves(color) {
    color = color === undefined ? this.turn : color;
    const out = [];
    for (let i = 0; i < this.board.length; i++) {
      if (this.board[i] !== EMPTY) continue;
      if (isLegal(this.board, this.size, i, color, this.koPoint)) out.push(i);
    }
    return out;
  }

  toAscii() {
    const rows = [];
    for (let y = 0; y < this.size; y++) {
      let row = '';
      for (let x = 0; x < this.size; x++) {
        const v = this.board[y * this.size + x];
        row += v === BLACK ? 'X' : v === WHITE ? 'O' : '.';
      }
      rows.push(row);
    }
    return rows.join('\n');
  }
}
