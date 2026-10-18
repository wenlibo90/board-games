// 黑白棋（奥赛罗）规则引擎

export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;
export const N = 8;

export const opponent = (c) => (c === BLACK ? WHITE : BLACK);
export const colorName = (c) => (c === BLACK ? '黑' : c === WHITE ? '白' : '空');
export const idx = (x, y) => y * N + x;
export const xOf = (i) => i % N;
export const yOf = (i) => (i / N) | 0;

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

export function initialBoard() {
  const b = new Int8Array(N * N);
  b[idx(3, 3)] = WHITE;
  b[idx(4, 4)] = WHITE;
  b[idx(4, 3)] = BLACK;
  b[idx(3, 4)] = BLACK;
  return b;
}

export function flipsAt(board, pos, color) {
  if (board[pos] !== EMPTY) return [];
  const opp = opponent(color);
  const x = xOf(pos), y = yOf(pos);
  const out = [];
  for (const [dx, dy] of DIRS) {
    const line = [];
    let cx = x + dx, cy = y + dy;
    while (cx >= 0 && cx < N && cy >= 0 && cy < N && board[cy * N + cx] === opp) {
      line.push(cy * N + cx);
      cx += dx; cy += dy;
    }
    if (line.length && cx >= 0 && cx < N && cy >= 0 && cy < N && board[cy * N + cx] === color) {
      for (const p of line) out.push(p);
    }
  }
  return out;
}

export function isLegal(board, pos, color) {
  return board[pos] === EMPTY && flipsAt(board, pos, color).length > 0;
}

export function legalMovesAt(board, color) {
  const out = [];
  for (let i = 0; i < board.length; i++) if (isLegal(board, i, color)) out.push(i);
  return out;
}

export function applyAt(board, pos, color) {
  const flips = flipsAt(board, pos, color);
  board[pos] = color;
  for (const f of flips) board[f] = color;
  return flips;
}

export function countDiscs(board) {
  let black = 0, white = 0;
  for (const v of board) { if (v === BLACK) black++; else if (v === WHITE) white++; }
  return { black, white };
}

export class ReversiGame {
  constructor() {
    this.size = N;
    this.reset();
  }

  reset() {
    this.board = initialBoard();
    this.turn = BLACK;
    this.history = [];
    this.moves = [];
    this.ended = false;
    this.result = null;
    this.lastMove = -1;
    this.lastFlips = [];
    this.passed = false;
  }

  snapshot() {
    return {
      board: this.board.slice(), turn: this.turn, ended: this.ended, result: this.result,
      lastMove: this.lastMove, lastFlips: this.lastFlips.slice(), passed: this.passed,
      moveCount: this.moves.length,
    };
  }

  restore(s) {
    this.board = s.board.slice();
    this.turn = s.turn; this.ended = s.ended; this.result = s.result;
    this.lastMove = s.lastMove; this.lastFlips = s.lastFlips.slice(); this.passed = s.passed;
    this.moves.length = s.moveCount;
  }

  legalMoves(color) {
    return legalMovesAt(this.board, color === undefined ? this.turn : color);
  }

  play(pos) {
    if (this.ended) return { ok: false };
    if (!isLegal(this.board, pos, this.turn)) return { ok: false };
    this.history.push(this.snapshot());
    const color = this.turn;
    const flips = applyAt(this.board, pos, color);
    this.moves.push({ color, idx: pos, flips: flips.length });
    this.lastMove = pos;
    this.lastFlips = flips;
    this.passed = false;
    this._advance();
    return { ok: true, flips };
  }

  _advance() {
    const next = opponent(this.turn);
    if (legalMovesAt(this.board, next).length > 0) {
      this.turn = next;
      return;
    }
    this.moves.push({ color: next, pass: true });
    this.passed = true;
    if (legalMovesAt(this.board, this.turn).length > 0) return; // 对手跳过，己方继续
    this._finish();
  }

  _finish() {
    const { black, white } = countDiscs(this.board);
    this.ended = true;
    const winner = black > white ? BLACK : white > black ? WHITE : 0;
    this.result = {
      winner,
      score: { black, white },
      text: winner === 0 ? `平局（黑 ${black} : 白 ${white}）` : `${colorName(winner)}胜（黑 ${black} : 白 ${white}）`,
    };
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
