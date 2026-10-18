// 中国象棋规则引擎
// 棋盘 9 列 x 10 行，index = y*9 + x，y=0 为黑方底线，y=9 为红方底线
// 棋子编码：color*10 + type，color: RED=1, BLACK=2

export const RED = 1;
export const BLACK = 2;

export const K = 1; // 帅/将
export const A = 2; // 仕/士
export const E = 3; // 相/象
export const H = 4; // 马
export const R = 5; // 车
export const C = 6; // 炮
export const P = 7; // 兵/卒

export const COLS = 9;
export const ROWS = 10;
export const SIZE = COLS * ROWS;

export const PIECE_LABEL = {
  [RED * 10 + K]: '帅', [RED * 10 + A]: '仕', [RED * 10 + E]: '相',
  [RED * 10 + H]: '马', [RED * 10 + R]: '车', [RED * 10 + C]: '炮', [RED * 10 + P]: '兵',
  [BLACK * 10 + K]: '将', [BLACK * 10 + A]: '士', [BLACK * 10 + E]: '象',
  [BLACK * 10 + H]: '马', [BLACK * 10 + R]: '车', [BLACK * 10 + C]: '炮', [BLACK * 10 + P]: '卒',
};

export const idx = (x, y) => y * COLS + x;
export const xOf = (i) => i % COLS;
export const yOf = (i) => (i / COLS) | 0;
export const piece = (color, type) => color * 10 + type;
export const colorOf = (p) => (p / 10) | 0;
export const typeOf = (p) => p % 10;
export const opponent = (c) => (c === RED ? BLACK : RED);
export const colorName = (c) => (c === RED ? '红' : '黑');

function inBoard(x, y) {
  return x >= 0 && x < COLS && y >= 0 && y < ROWS;
}

function inPalace(x, y, color) {
  if (x < 3 || x > 5) return false;
  return color === BLACK ? y >= 0 && y <= 2 : y >= 7 && y <= 9;
}

export function findKing(board, color) {
  const target = piece(color, K);
  for (let i = 0; i < SIZE; i++) if (board[i] === target) return i;
  return -1;
}

const ORTHO = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const HORSE = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];

export function genPieceMoves(board, from, color) {
  const type = typeOf(board[from]);
  const x = xOf(from);
  const y = yOf(from);
  const out = [];
  const push = (tx, ty) => {
    if (!inBoard(tx, ty)) return;
    const to = idx(tx, ty);
    const q = board[to];
    if (q && colorOf(q) === color) return;
    out.push({ from, to });
  };

  if (type === K) {
    for (const [dx, dy] of ORTHO) {
      const tx = x + dx, ty = y + dy;
      if (inPalace(tx, ty, color)) push(tx, ty);
    }
  } else if (type === A) {
    for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const tx = x + dx, ty = y + dy;
      if (inPalace(tx, ty, color)) push(tx, ty);
    }
  } else if (type === E) {
    for (const [dx, dy] of [[2, 2], [2, -2], [-2, 2], [-2, -2]]) {
      const tx = x + dx, ty = y + dy;
      if (!inBoard(tx, ty)) continue;
      if (color === BLACK ? ty > 4 : ty < 5) continue; // 相/象不过河
      if (board[idx(x + dx / 2, y + dy / 2)] !== 0) continue; // 塞象眼
      push(tx, ty);
    }
  } else if (type === H) {
    for (const [dx, dy] of HORSE) {
      const tx = x + dx, ty = y + dy;
      if (!inBoard(tx, ty)) continue;
      const lx = Math.abs(dx) === 2 ? x + dx / 2 : x;
      const ly = Math.abs(dy) === 2 ? y + dy / 2 : y;
      if (board[idx(lx, ly)] !== 0) continue; // 蹩马腿
      push(tx, ty);
    }
  } else if (type === R) {
    for (const [dx, dy] of ORTHO) {
      let tx = x + dx, ty = y + dy;
      while (inBoard(tx, ty)) {
        const to = idx(tx, ty);
        const q = board[to];
        if (!q) out.push({ from, to });
        else {
          if (colorOf(q) !== color) out.push({ from, to });
          break;
        }
        tx += dx; ty += dy;
      }
    }
  } else if (type === C) {
    for (const [dx, dy] of ORTHO) {
      let tx = x + dx, ty = y + dy;
      let screen = false;
      while (inBoard(tx, ty)) {
        const to = idx(tx, ty);
        const q = board[to];
        if (!screen) {
          if (!q) out.push({ from, to });
          else screen = true;
        } else if (q) {
          if (colorOf(q) !== color) out.push({ from, to });
          break;
        }
        tx += dx; ty += dy;
      }
    }
  } else if (type === P) {
    const fwd = color === RED ? -1 : 1;
    push(x, y + fwd);
    const crossed = color === RED ? y <= 4 : y >= 5;
    if (crossed) {
      push(x - 1, y);
      push(x + 1, y);
    }
  }
  return out;
}

// 判断 pos 是否被 byColor 一方攻击（含飞将）
export function isAttacked(board, pos, byColor) {
  if (pos < 0) return false;
  const x = xOf(pos), y = yOf(pos);

  for (const [dx, dy] of ORTHO) {
    let cx = x + dx, cy = y + dy, screen = 0;
    while (inBoard(cx, cy)) {
      const p = board[idx(cx, cy)];
      if (p) {
        const pc = colorOf(p), pt = typeOf(p);
        if (screen === 0) {
          if (pc === byColor && (pt === R || pt === K)) return true; // 车 / 将（含飞将）
          screen = 1;
        } else {
          if (pc === byColor && pt === C) return true; // 炮
          break;
        }
      }
      cx += dx; cy += dy;
    }
  }

  for (const [dx, dy] of HORSE) {
    const hx = x + dx, hy = y + dy;
    if (!inBoard(hx, hy)) continue;
    const p = board[idx(hx, hy)];
    if (p && colorOf(p) === byColor && typeOf(p) === H) {
      const ex = x - hx, ey = y - hy;
      const lx = Math.abs(ex) === 2 ? hx + ex / 2 : hx;
      const ly = Math.abs(ey) === 2 ? hy + ey / 2 : hy;
      if (board[idx(lx, ly)] === 0) return true;
    }
  }

  if (byColor === RED) {
    if (y + 1 < ROWS) {
      const p = board[idx(x, y + 1)];
      if (p && colorOf(p) === RED && typeOf(p) === P) return true;
    }
    if (y <= 4) {
      for (const sx of [x - 1, x + 1]) {
        if (sx < 0 || sx >= COLS) continue;
        const q = board[idx(sx, y)];
        if (q && colorOf(q) === RED && typeOf(q) === P) return true;
      }
    }
  } else {
    if (y - 1 >= 0) {
      const p = board[idx(x, y - 1)];
      if (p && colorOf(p) === BLACK && typeOf(p) === P) return true;
    }
    if (y >= 5) {
      for (const sx of [x - 1, x + 1]) {
        if (sx < 0 || sx >= COLS) continue;
        const q = board[idx(sx, y)];
        if (q && colorOf(q) === BLACK && typeOf(q) === P) return true;
      }
    }
  }
  return false;
}

export function inCheck(board, color) {
  return isAttacked(board, findKing(board, color), opponent(color));
}

export function makeMove(board, from, to) {
  const moved = board[from];
  const captured = board[to];
  board[to] = moved;
  board[from] = 0;
  return { moved, captured };
}

export function unmakeMove(board, from, to, moved, captured) {
  board[from] = moved;
  board[to] = captured;
}

// 生成合法着法（过滤掉送将/照面）
export function legalMoves(board, color) {
  const out = [];
  let kingPos = findKing(board, color);
  const opp = opponent(color);
  for (let from = 0; from < SIZE; from++) {
    const p = board[from];
    if (!p || colorOf(p) !== color) continue;
    for (const m of genPieceMoves(board, from, color)) {
      const isKing = typeOf(p) === K;
      const { moved, captured } = makeMove(board, from, m.to);
      const kp = isKing ? m.to : kingPos;
      if (!isAttacked(board, kp, opp)) out.push(m);
      unmakeMove(board, from, m.to, moved, captured);
    }
  }
  return out;
}

export function legalMovesFrom(board, from, color) {
  const opp = opponent(color);
  const out = [];
  const isKing = typeOf(board[from]) === K;
  const kingPos = findKing(board, color);
  for (const m of genPieceMoves(board, from, color)) {
    const { moved, captured } = makeMove(board, from, m.to);
    const kp = isKing ? m.to : kingPos;
    if (!isAttacked(board, kp, opp)) out.push(m);
    unmakeMove(board, from, m.to, moved, captured);
  }
  return out;
}

export function initialBoard() {
  const b = new Int8Array(SIZE);
  const back = [R, H, E, A, K, A, E, H, R];
  for (let x = 0; x < COLS; x++) {
    b[idx(x, 0)] = piece(BLACK, back[x]);
    b[idx(x, 9)] = piece(RED, back[x]);
  }
  b[idx(1, 2)] = piece(BLACK, C);
  b[idx(7, 2)] = piece(BLACK, C);
  b[idx(1, 7)] = piece(RED, C);
  b[idx(7, 7)] = piece(RED, C);
  for (const x of [0, 2, 4, 6, 8]) {
    b[idx(x, 3)] = piece(BLACK, P);
    b[idx(x, 6)] = piece(RED, P);
  }
  return b;
}

export class XiangqiGame {
  constructor() {
    this.cols = COLS;
    this.rows = ROWS;
    this.reset();
  }

  reset() {
    this.board = initialBoard();
    this.turn = RED;
    this.history = [];
    this.moves = [];
    this.ended = false;
    this.result = null;
    this.lastMove = null; // {from,to}
  }

  snapshot() {
    return {
      board: this.board.slice(),
      turn: this.turn,
      ended: this.ended,
      result: this.result,
      lastMove: this.lastMove,
      moveCount: this.moves.length,
    };
  }

  restore(s) {
    this.board = s.board.slice();
    this.turn = s.turn;
    this.ended = s.ended;
    this.result = s.result;
    this.lastMove = s.lastMove;
    this.moves.length = s.moveCount;
  }

  legalMoves(color) {
    return legalMoves(this.board, color === undefined ? this.turn : color);
  }

  legalMovesFrom(from) {
    if (from < 0 || from >= SIZE) return [];
    const p = this.board[from];
    if (!p || colorOf(p) !== this.turn) return [];
    return legalMovesFrom(this.board, from, this.turn);
  }

  play(move) {
    if (this.ended) return { ok: false };
    const { from, to } = move;
    if (from === undefined || to === undefined) return { ok: false };
    const legal = this.legalMovesFrom(from).some((m) => m.to === to);
    if (!legal) return { ok: false };
    this.history.push(this.snapshot());
    const { moved, captured } = makeMove(this.board, from, to);
    this.moves.push({ color: this.turn, from, to, captured, moved });
    this.lastMove = { from, to };
    this.turn = opponent(this.turn);
    this._checkGameOver();
    return { ok: true, captured };
  }

  _checkGameOver() {
    if (legalMoves(this.board, this.turn).length === 0) {
      const winner = opponent(this.turn);
      const checked = inCheck(this.board, this.turn);
      this.ended = true;
      this.result = {
        reason: checked ? 'checkmate' : 'stalemate',
        winner,
        text: `${colorName(winner)}胜（${checked ? '将死' : '困毙'}）`,
      };
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
    this.result = { reason: 'resign', winner, text: `${colorName(winner)}胜（${colorName(color)}认输）` };
    return { ok: true };
  }

  inCheck(color) {
    return inCheck(this.board, color === undefined ? this.turn : color);
  }

  toAscii() {
    const rows = [];
    for (let y = 0; y < ROWS; y++) {
      let r = '';
      for (let x = 0; x < COLS; x++) {
        const p = this.board[idx(x, y)];
        r += p ? PIECE_LABEL[p] : '·';
      }
      rows.push(r);
    }
    return rows.join('\n');
  }
}
