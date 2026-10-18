// 五子棋规则引擎（自由规则，无禁手）

export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;

export const opponent = (c) => (c === BLACK ? WHITE : BLACK);
export const colorName = (c) => (c === BLACK ? '黑' : c === WHITE ? '白' : '空');

export const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];

export function initialBoard(size) {
  return new Int8Array(size * size);
}

// 检查落子后是否形成五连，返回连子坐标数组或 null
export function findFive(board, size, idx) {
  const color = board[idx];
  if (!color) return null;
  const x = idx % size;
  const y = (idx / size) | 0;
  for (const [dx, dy] of DIRS) {
    const line = [idx];
    for (const s of [1, -1]) {
      let cx = x + dx * s;
      let cy = y + dy * s;
      while (cx >= 0 && cx < size && cy >= 0 && cy < size && board[cy * size + cx] === color) {
        line.push(cy * size + cx);
        cx += dx * s;
        cy += dy * s;
      }
    }
    if (line.length >= 5) {
      line.sort((a, b) => a - b);
      return line;
    }
  }
  return null;
}

export class GomokuGame {
  constructor(size = 15) {
    this.size = size;
    this.reset();
  }

  reset() {
    this.board = initialBoard(this.size);
    this.turn = BLACK;
    this.history = [];
    this.moves = [];
    this.ended = false;
    this.result = null;
    this.lastMove = -1;
    this.winLine = null;
  }

  snapshot() {
    return {
      board: this.board.slice(), turn: this.turn, ended: this.ended,
      result: this.result, lastMove: this.lastMove, winLine: this.winLine, moveCount: this.moves.length,
    };
  }

  restore(s) {
    this.board = s.board.slice();
    this.turn = s.turn; this.ended = s.ended; this.result = s.result;
    this.lastMove = s.lastMove; this.winLine = s.winLine; this.moves.length = s.moveCount;
  }

  legalMoves() {
    if (this.ended) return [];
    const out = [];
    for (let i = 0; i < this.board.length; i++) if (this.board[i] === EMPTY) out.push(i);
    return out;
  }

  play(idx) {
    if (this.ended) return { ok: false };
    if (idx < 0 || idx >= this.board.length || this.board[idx] !== EMPTY) return { ok: false };
    this.history.push(this.snapshot());
    this.board[idx] = this.turn;
    this.moves.push({ color: this.turn, idx });
    this.lastMove = idx;
    const five = findFive(this.board, this.size, idx);
    if (five) {
      this.ended = true;
      this.winLine = five;
      this.result = { winner: this.turn, text: `${colorName(this.turn)}棋五连，获胜` };
    } else if (this.moves.length >= this.size * this.size) {
      this.ended = true;
      this.result = { winner: 0, text: '棋盘已满，平局' };
    } else {
      this.turn = opponent(this.turn);
    }
    return { ok: true };
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
