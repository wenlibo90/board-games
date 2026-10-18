// 韩国象棋（Janggi）规则引擎
// 棋盘 9x10，index = y*9 + x，RED（漢，下方）先行
// 与象棋的差异：炮必须隔子才能移动、不能吃炮；象走"用"字；士/将可在九宫内斜走；兵可横走。

export const RED = 1;
export const BLUE = 2;

export const K = 1, A = 2, E = 3, H = 4, R = 5, C = 6, P = 7;

export const COLS = 9, ROWS = 10, SIZE = COLS * ROWS;

export const LABEL = {
  [RED * 10 + K]: '漢', [RED * 10 + A]: '士', [RED * 10 + E]: '象', [RED * 10 + H]: '馬', [RED * 10 + R]: '車', [RED * 10 + C]: '包', [RED * 10 + P]: '兵',
  [BLUE * 10 + K]: '楚', [BLUE * 10 + A]: '士', [BLUE * 10 + E]: '象', [BLUE * 10 + H]: '馬', [BLUE * 10 + R]: '車', [BLUE * 10 + C]: '包', [BLUE * 10 + P]: '卒',
};

export const opponent = (c) => (c === RED ? BLUE : RED);
export const colorName = (c) => (c === RED ? '漢' : '楚');
export const piece = (color, type) => color * 10 + type;
export const colorOf = (p) => (p / 10) | 0;
export const typeOf = (p) => p % 10;
export const idx = (x, y) => y * COLS + x;
export const xOf = (i) => i % COLS;
export const yOf = (i) => (i / COLS) | 0;
const inB = (x, y) => x >= 0 && x < COLS && y >= 0 && y < ROWS;
const inPalace = (x, y, color) => x >= 3 && x <= 5 && (color === BLUE ? y >= 0 && y <= 2 : y >= 7 && y <= 9);

const ORTHO = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

export function initialBoard() {
  const b = new Int8Array(SIZE);
  const back = [R, H, E, A, 0, A, E, H, R];
  for (let x = 0; x < 9; x++) {
    if (back[x]) { b[idx(x, 0)] = piece(BLUE, back[x]); b[idx(x, 9)] = piece(RED, back[x]); }
  }
  b[idx(4, 1)] = piece(BLUE, K);
  b[idx(4, 8)] = piece(RED, K);
  b[idx(1, 2)] = piece(BLUE, C); b[idx(7, 2)] = piece(BLUE, C);
  b[idx(1, 7)] = piece(RED, C); b[idx(7, 7)] = piece(RED, C);
  for (const x of [0, 2, 4, 6, 8]) { b[idx(x, 3)] = piece(BLUE, P); b[idx(x, 6)] = piece(RED, P); }
  return b;
}

export function findKing(board, color) {
  const t = piece(color, K);
  for (let i = 0; i < SIZE; i++) if (board[i] === t) return i;
  return -1;
}

export function genPieceMoves(board, from, color) {
  const type = typeOf(board[from]);
  const x = xOf(from), y = yOf(from);
  const out = [];
  const push = (tx, ty) => {
    if (!inB(tx, ty)) return;
    const to = idx(tx, ty);
    const q = board[to];
    if (q && colorOf(q) === color) return;
    out.push({ from, to });
  };

  if (type === K || type === A) {
    const dirs = [...ORTHO, ...DIAG];
    for (const [dx, dy] of dirs) {
      const tx = x + dx, ty = y + dy;
      if (inPalace(tx, ty, color)) push(tx, ty);
    }
  } else if (type === E) {
    // 象：1 正交 + 2 斜
    for (const [ox, oy] of ORTHO) {
      for (const [dx, dy] of DIAG) {
        // 方向需与正交方向一致：先正交再沿该象限斜走
        if (ox !== 0 && Math.sign(dx) !== Math.sign(ox)) continue;
        if (oy !== 0 && Math.sign(dy) !== Math.sign(oy)) continue;
        const p1x = x + ox, p1y = y + oy;
        const p2x = p1x + dx, p2y = p1y + dy;
        const tx = p2x + dx, ty = p2y + dy;
        if (!inB(tx, ty)) continue;
        if (board[idx(p1x, p1y)] !== 0) continue;
        if (board[idx(p2x, p2y)] !== 0) continue;
        push(tx, ty);
      }
    }
  } else if (type === H) {
    const moves = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
    for (const [dx, dy] of moves) {
      const tx = x + dx, ty = y + dy;
      if (!inB(tx, ty)) continue;
      const lx = Math.abs(dx) === 2 ? x + dx / 2 : x;
      const ly = Math.abs(dy) === 2 ? y + dy / 2 : y;
      if (board[idx(lx, ly)] !== 0) continue;
      push(tx, ty);
    }
  } else if (type === R) {
    for (const [dx, dy] of ORTHO) {
      let tx = x + dx, ty = y + dy;
      while (inB(tx, ty)) {
        const to = idx(tx, ty); const q = board[to];
        if (!q) out.push({ from, to });
        else { if (colorOf(q) !== color) out.push({ from, to }); break; }
        tx += dx; ty += dy;
      }
    }
  } else if (type === C) {
    for (const [dx, dy] of ORTHO) {
      let tx = x + dx, ty = y + dy;
      while (inB(tx, ty) && board[idx(tx, ty)] === 0) { tx += dx; ty += dy; }
      if (!inB(tx, ty)) continue;
      const screen = board[idx(tx, ty)];
      if (typeOf(screen) === C) continue; // 炮不能借炮为架
      tx += dx; ty += dy;
      while (inB(tx, ty)) {
        const to = idx(tx, ty); const q = board[to];
        if (!q) out.push({ from, to });
        else { if (colorOf(q) !== color && typeOf(q) !== C) out.push({ from, to }); break; }
        tx += dx; ty += dy;
      }
    }
  } else if (type === P) {
    const fwd = color === RED ? -1 : 1;
    push(x, y + fwd);
    push(x - 1, y);
    push(x + 1, y);
  }
  return out;
}

export function isAttacked(board, pos, byColor) {
  if (pos < 0) return false;
  const x = xOf(pos), y = yOf(pos);
  // 车 / 将（含飞将）
  for (const [dx, dy] of ORTHO) {
    let cx = x + dx, cy = y + dy;
    while (inB(cx, cy)) {
      const p = board[idx(cx, cy)];
      if (p) {
        if (colorOf(p) === byColor && (typeOf(p) === R || typeOf(p) === K)) return true;
        break;
      }
      cx += dx; cy += dy;
    }
  }
  // 炮
  for (const [dx, dy] of ORTHO) {
    let cx = x + dx, cy = y + dy, sawScreen = false;
    while (inB(cx, cy)) {
      const p = board[idx(cx, cy)];
      if (p) {
        if (!sawScreen) {
          if (typeOf(p) === C) break; // 炮不能为架
          sawScreen = true;
        } else {
          if (colorOf(p) === byColor && typeOf(p) === C) return true;
          break;
        }
      }
      cx += dx; cy += dy;
    }
  }
  // 马
  for (const [dx, dy] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) {
    const hx = x + dx, hy = y + dy;
    if (!inB(hx, hy)) continue;
    const p = board[idx(hx, hy)];
    if (p && colorOf(p) === byColor && typeOf(p) === H) {
      const ex = x - hx, ey = y - hy;
      const lx = Math.abs(ex) === 2 ? hx + ex / 2 : hx;
      const ly = Math.abs(ey) === 2 ? hy + ey / 2 : hy;
      if (board[idx(lx, ly)] === 0) return true;
    }
  }
  // 象
  for (const [X, Y] of [[3, 2], [3, -2], [-3, 2], [-3, -2], [2, 3], [2, -3], [-2, 3], [-2, -3]]) {
    const ex = x - X, ey = y - Y;
    if (!inB(ex, ey)) continue;
    const p = board[idx(ex, ey)];
    if (!p || colorOf(p) !== byColor || typeOf(p) !== E) continue;
    let ox, oy, dx, dy;
    if (Math.abs(X) === 3) { ox = Math.sign(X); oy = 0; dx = Math.sign(X); dy = Math.sign(Y); }
    else { ox = 0; oy = Math.sign(Y); dx = Math.sign(X); dy = Math.sign(Y); }
    const p1 = idx(ex + ox, ey + oy);
    const p2 = idx(ex + ox + dx, ey + oy + dy);
    if (board[p1] === 0 && board[p2] === 0) return true;
  }
  // 士/将 相邻
  for (const [dx, dy] of [...ORTHO, ...DIAG]) {
    const nx = x + dx, ny = y + dy;
    if (!inB(nx, ny)) continue;
    const p = board[idx(nx, ny)];
    if (p && colorOf(p) === byColor && (typeOf(p) === K || typeOf(p) === A)) return true;
  }
  // 兵/卒
  if (byColor === RED) {
    if (y + 1 < ROWS) { const p = board[idx(x, y + 1)]; if (p && colorOf(p) === RED && typeOf(p) === P) return true; }
    for (const sx of [x - 1, x + 1]) { if (sx < 0 || sx >= COLS) continue; const p = board[idx(sx, y)]; if (p && colorOf(p) === RED && typeOf(p) === P) return true; }
  } else {
    if (y - 1 >= 0) { const p = board[idx(x, y - 1)]; if (p && colorOf(p) === BLUE && typeOf(p) === P) return true; }
    for (const sx of [x - 1, x + 1]) { if (sx < 0 || sx >= COLS) continue; const p = board[idx(sx, y)]; if (p && colorOf(p) === BLUE && typeOf(p) === P) return true; }
  }
  return false;
}

export function inCheck(board, color) {
  return isAttacked(board, findKing(board, color), opponent(color));
}

export function makeMove(board, from, to) {
  const moved = board[from]; const captured = board[to];
  board[to] = moved; board[from] = 0;
  return { moved, captured };
}
export function unmakeMove(board, from, to, moved, captured) {
  board[from] = moved; board[to] = captured;
}

export function legalMoves(board, color) {
  const out = [];
  const opp = opponent(color);
  const kingPos = findKing(board, color);
  for (let from = 0; from < SIZE; from++) {
    const p = board[from];
    if (!p || colorOf(p) !== color) continue;
    const isK = typeOf(p) === K;
    for (const m of genPieceMoves(board, from, color)) {
      const { moved, captured } = makeMove(board, from, m.to);
      const kp = isK ? m.to : kingPos;
      if (!isAttacked(board, kp, opp)) out.push(m);
      unmakeMove(board, from, m.to, moved, captured);
    }
  }
  return out;
}

export function legalMovesFrom(board, from, color) {
  const opp = opponent(color);
  const out = [];
  const isK = typeOf(board[from]) === K;
  const kingPos = findKing(board, color);
  for (const m of genPieceMoves(board, from, color)) {
    const { moved, captured } = makeMove(board, from, m.to);
    const kp = isK ? m.to : kingPos;
    if (!isAttacked(board, kp, opp)) out.push(m);
    unmakeMove(board, from, m.to, moved, captured);
  }
  return out;
}

export class JanggiGame {
  constructor() {
    this.cols = COLS; this.rows = ROWS;
    this.reset();
  }
  reset() {
    this.board = initialBoard();
    this.turn = RED;
    this.history = [];
    this.moves = [];
    this.ended = false;
    this.result = null;
    this.lastMove = null;
  }
  snapshot() { return { board: this.board.slice(), turn: this.turn, ended: this.ended, result: this.result, lastMove: this.lastMove, moveCount: this.moves.length }; }
  restore(s) { this.board = s.board.slice(); this.turn = s.turn; this.ended = s.ended; this.result = s.result; this.lastMove = s.lastMove; this.moves.length = s.moveCount; }
  legalMoves(color) { return legalMoves(this.board, color === undefined ? this.turn : color); }
  legalMovesFrom(from) { if (from < 0 || from >= SIZE) return []; const p = this.board[from]; if (!p || colorOf(p) !== this.turn) return []; return legalMovesFrom(this.board, from, this.turn); }
  play(move) {
    if (this.ended) return { ok: false };
    const legal = this.legalMovesFrom(move.from).some((m) => m.to === move.to);
    if (!legal) return { ok: false };
    this.history.push(this.snapshot());
    const { moved, captured } = makeMove(this.board, move.from, move.to);
    this.moves.push({ color: this.turn, from: move.from, to: move.to, captured });
    this.lastMove = { from: move.from, to: move.to };
    this.turn = opponent(this.turn);
    this._check();
    return { ok: true, captured };
  }
  _check() {
    if (legalMoves(this.board, this.turn).length === 0) {
      const winner = opponent(this.turn);
      const checked = inCheck(this.board, this.turn);
      this.ended = true;
      this.result = { winner, text: `${colorName(winner)}胜（${checked ? '将死' : '困毙'}）` };
    }
  }
  undo() { if (!this.history.length) return false; this.restore(this.history.pop()); return true; }
  resign(color) { if (this.ended) return { ok: false }; const winner = opponent(color); this.ended = true; this.result = { winner, text: `${colorName(winner)}胜（${colorName(color)}认输）` }; return { ok: true }; }
  inCheck(color) { return inCheck(this.board, color === undefined ? this.turn : color); }
}
