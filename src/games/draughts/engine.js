// 国际跳棋（10x10 国际跳棋/波兰跳棋）规则引擎
// 深色格行棋；吃子强制；必须选择吃子最多的走法（多数规则）；
// 兵可前后吃子但只能向前走，到达底线升为王；王可沿斜线任意距离行走与吃子（飞王）。

export const WHITE = 1; // 下方，先走
export const BLACK = 2;
export const MAN = 1;
export const KING = 2;
export const N = 10;
export const SIZE = N * N;

export const opponent = (c) => (c === WHITE ? BLACK : WHITE);
export const colorName = (c) => (c === WHITE ? '白' : '黑');
export const piece = (color, type) => color * 10 + type;
export const colorOf = (p) => (p / 10) | 0;
export const typeOf = (p) => p % 10;
export const idx = (x, y) => y * N + x;
export const xOf = (i) => i % N;
export const yOf = (i) => (i / N) | 0;
const inB = (x, y) => x >= 0 && x < N && y >= 0 && y < N;
export const playable = (x, y) => ((x + y) & 1) === 1;

const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

export function initialBoard() {
  const b = new Int8Array(SIZE);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (!playable(x, y)) continue;
      if (y <= 3) b[idx(x, y)] = piece(BLACK, MAN);
      else if (y >= 6) b[idx(x, y)] = piece(WHITE, MAN);
    }
  }
  return b;
}

const isEmpty = (board, i, captured) => board[i] === 0 || captured.has(i);
const isEnemy = (board, i, color, captured) => board[i] !== 0 && !captured.has(i) && colorOf(board[i]) !== color;

// 递归生成某一棋子的全部最大吃子序列（必须吃到不能再吃为止）
function captureSeqs(board, sq, color, isKing, captured, path) {
  const results = [];
  const x = xOf(sq), y = yOf(sq);
  for (const [dx, dy] of DIAG) {
    if (!isKing) {
      const mx = x + dx, my = y + dy, lx = x + 2 * dx, ly = y + 2 * dy;
      if (!inB(lx, ly)) continue;
      const mid = idx(mx, my), land = idx(lx, ly);
      if (isEnemy(board, mid, color, captured) && isEmpty(board, land, captured)) {
        const nc = new Set(captured); nc.add(mid);
        const np = [...path, land];
        const cont = captureSeqs(board, land, color, false, nc, np);
        if (cont.length === 0) results.push({ to: land, captures: [...nc], path: np });
        else results.push(...cont);
      }
    } else {
      let cx = x + dx, cy = y + dy;
      while (inB(cx, cy) && isEmpty(board, idx(cx, cy), captured)) { cx += dx; cy += dy; }
      if (!inB(cx, cy)) continue;
      const mid = idx(cx, cy);
      if (!isEnemy(board, mid, color, captured)) continue;
      let lx = cx + dx, ly = cy + dy;
      while (inB(lx, ly) && isEmpty(board, idx(lx, ly), captured)) {
        const land = idx(lx, ly);
        const nc = new Set(captured); nc.add(mid);
        const np = [...path, land];
        const cont = captureSeqs(board, land, color, true, nc, np);
        if (cont.length === 0) results.push({ to: land, captures: [...nc], path: np });
        else results.push(...cont);
        lx += dx; ly += dy;
      }
    }
  }
  return results;
}

export function allCaptures(board, color) {
  const out = [];
  for (let i = 0; i < SIZE; i++) {
    const p = board[i];
    if (!p || colorOf(p) !== color) continue;
    const isKing = typeOf(p) === KING;
    const seqs = captureSeqs(board, i, color, isKing, new Set(), [i]);
    for (const s of seqs) out.push({ from: i, to: s.to, captures: s.captures, path: s.path });
  }
  return out;
}

function simpleMoves(board, color) {
  const out = [];
  for (let i = 0; i < SIZE; i++) {
    const p = board[i];
    if (!p || colorOf(p) !== color) continue;
    const x = xOf(i), y = yOf(i);
    if (typeOf(p) === KING) {
      for (const [dx, dy] of DIAG) {
        let cx = x + dx, cy = y + dy;
        while (inB(cx, cy) && board[idx(cx, cy)] === 0) {
          out.push({ from: i, to: idx(cx, cy), captures: [], path: [i, idx(cx, cy)] });
          cx += dx; cy += dy;
        }
      }
    } else {
      const fdir = color === WHITE ? -1 : 1;
      for (const dx of [-1, 1]) {
        const nx = x + dx, ny = y + fdir;
        if (inB(nx, ny) && board[idx(nx, ny)] === 0) {
          out.push({ from: i, to: idx(nx, ny), captures: [], path: [i, idx(nx, ny)] });
        }
      }
    }
  }
  return out;
}

export function legalMoves(board, color) {
  const caps = allCaptures(board, color);
  if (caps.length) {
    let max = 0;
    for (const m of caps) if (m.captures.length > max) max = m.captures.length;
    return caps.filter((m) => m.captures.length === max);
  }
  return simpleMoves(board, color);
}

export function legalMovesFrom(board, from, color) {
  return legalMoves(board, color).filter((m) => m.from === from);
}

export function applyMove(board, move, color) {
  const p = board[move.from];
  board[move.from] = 0;
  for (const c of move.captures) board[c] = 0;
  let np = p;
  const promoteRow = color === WHITE ? 0 : N - 1;
  if (typeOf(p) === MAN && yOf(move.to) === promoteRow) np = piece(color, KING);
  board[move.to] = np;
  return np;
}

export class DraughtsGame {
  constructor() {
    this.size = N;
    this.reset();
  }

  reset() {
    this.board = initialBoard();
    this.turn = WHITE;
    this.history = [];
    this.moves = [];
    this.ended = false;
    this.result = null;
    this.lastMove = null;
    this.idlePlies = 0;
  }

  snapshot() {
    return {
      board: this.board.slice(), turn: this.turn, ended: this.ended, result: this.result,
      lastMove: this.lastMove, idlePlies: this.idlePlies, moveCount: this.moves.length,
    };
  }

  restore(s) {
    this.board = s.board.slice();
    this.turn = s.turn; this.ended = s.ended; this.result = s.result;
    this.lastMove = s.lastMove; this.idlePlies = s.idlePlies; this.moves.length = s.moveCount;
  }

  legalMoves(color) {
    return legalMoves(this.board, color === undefined ? this.turn : color);
  }

  legalMovesFrom(from) {
    return legalMoves(this.board, this.turn).filter((m) => m.from === from);
  }

  play(move) {
    if (this.ended) return { ok: false };
    const legal = this.legalMoves(this.turn).find(
      (m) => m.from === move.from && m.to === move.to &&
        m.captures.length === (move.captures ? move.captures.length : m.captures.length) &&
        (!move.captures || m.captures.every((c, i) => c === move.captures[i]))
    );
    if (!legal) return { ok: false };
    this.history.push(this.snapshot());
    const color = this.turn;
    const before = typeOf(this.board[move.from]);
    applyMove(this.board, legal, color);
    this.moves.push({
      color, from: legal.from, to: legal.to,
      captures: legal.captures.slice(), path: legal.path.slice(),
      captured: legal.captures.length,
    });
    this.lastMove = { from: legal.from, to: legal.to, path: legal.path.slice() };
    if (legal.captures.length > 0 || before === MAN) this.idlePlies = 0;
    else this.idlePlies++;
    this.turn = opponent(color);
    this._check();
    return { ok: true };
  }

  _check() {
    if (legalMoves(this.board, this.turn).length === 0) {
      const winner = opponent(this.turn);
      this.ended = true;
      this.result = { winner, text: `${colorName(winner)}胜（对方无子可动）` };
      return;
    }
    if (this.idlePlies >= 50) {
      this.ended = true;
      this.result = { winner: 0, text: '和棋（连续 25 回合无吃子无兵移动）' };
    }
  }

  undo() {
    if (this.history.length === 0) return false;
    this.restore(this.history.pop());
    return true;
  }

  resign(color) {
    if (this.ended) return { ok: false };
    const winner = opponent(color);
    this.ended = true;
    this.result = { winner, text: `${colorName(winner)}胜（${colorName(color)}认输）` };
    return { ok: true };
  }
}
