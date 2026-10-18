// 将棋（日本象棋）规则引擎
// 棋盘 9x9，index = y*9 + x，y=0 为后手（上手）底线，y=8 为先手（下手）底线
// 棋子编码：color*100 + type；type 1..8 为基本子，+10 为成子
// 先手 BLACK=1 向上（y 减小）前进；后手 WHITE=2 向下（y 增大）

export const BLACK = 1;
export const WHITE = 2;

export const P = 1, L = 2, N = 3, S = 4, G = 5, B = 6, R = 7, K = 8;
export const PROMOTED = 10; // type + PROMOTED

export const N_FILE = 9;
export const SIZE = 81;

export const opponent = (c) => (c === BLACK ? WHITE : BLACK);
export const colorName = (c) => (c === BLACK ? '先手' : '后手');
export const piece = (color, type) => color * 100 + type;
export const colorOf = (p) => (p / 100) | 0;
export const typeOf = (p) => p % 100;
export const isPromoted = (t) => t >= PROMOTED;
export const baseType = (t) => (isPromoted(t) ? t - PROMOTED : t);
export const idx = (x, y) => y * N_FILE + x;
export const xOf = (i) => i % N_FILE;
export const yOf = (i) => (i / N_FILE) | 0;
const inB = (x, y) => x >= 0 && x < N_FILE && y >= 0 && y < N_FILE;

export const KANJI = {
  [P]: '歩', [L]: '香', [N]: '桂', [S]: '銀', [G]: '金', [B]: '角', [R]: '飛', [K]: '玉',
  [P + PROMOTED]: 'と', [L + PROMOTED]: '杏', [N + PROMOTED]: '圭', [S + PROMOTED]: '全',
  [B + PROMOTED]: '馬', [R + PROMOTED]: '龍',
};

export function initialBoard() {
  const b = new Int16Array(SIZE);
  const back = [L, N, S, G, K, G, S, N, L];
  for (let x = 0; x < 9; x++) {
    b[idx(x, 0)] = piece(WHITE, back[x]);
    b[idx(x, 8)] = piece(BLACK, back[x]);
  }
  b[idx(1, 1)] = piece(WHITE, R);
  b[idx(7, 1)] = piece(WHITE, B);
  b[idx(1, 7)] = piece(BLACK, B);
  b[idx(7, 7)] = piece(BLACK, R);
  for (let x = 0; x < 9; x++) {
    b[idx(x, 2)] = piece(WHITE, P);
    b[idx(x, 6)] = piece(BLACK, P);
  }
  return b;
}

const STEP = {
  [K]: [[0, -1], [-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]],
  [G]: [[0, -1], [-1, -1], [1, -1], [-1, 0], [1, 0], [0, 1]],
  [S]: [[0, -1], [-1, -1], [1, -1], [-1, 1], [1, 1]],
  [N]: [[-1, -2], [1, -2]],
  [P]: [[0, -1]],
  [P + PROMOTED]: [[0, -1], [-1, -1], [1, -1], [-1, 0], [1, 0], [0, 1]],
  [L + PROMOTED]: [[0, -1], [-1, -1], [1, -1], [-1, 0], [1, 0], [0, 1]],
  [N + PROMOTED]: [[0, -1], [-1, -1], [1, -1], [-1, 0], [1, 0], [0, 1]],
  [S + PROMOTED]: [[0, -1], [-1, -1], [1, -1], [-1, 0], [1, 0], [0, 1]],
  [B + PROMOTED]: [[-1, 0], [1, 0], [0, -1], [0, 1]],
  [R + PROMOTED]: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
};
const SLIDE = {
  [L]: [[0, -1]],
  [B]: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  [R]: [[0, -1], [-1, 0], [1, 0], [0, 1]],
  [B + PROMOTED]: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  [R + PROMOTED]: [[0, -1], [-1, 0], [1, 0], [0, 1]],
};

const PROMOTABLE = new Set([P, L, N, S, B, R]);

function inZone(color, y) {
  return color === BLACK ? y <= 2 : y >= 6;
}
function lastRank(color, y) {
  return color === BLACK ? y === 0 : y === 8;
}
function lastTwo(color, y) {
  return color === BLACK ? y <= 1 : y >= 7;
}

function oriented(color, dx, dy) {
  return color === BLACK ? [dx, dy] : [dx, -dy];
}

// 某棋子的盘上走法（含升变选项），不含打入
export function pieceMoves(board, from, color) {
  const p = board[from];
  if (!p) return [];
  const t = typeOf(p);
  const x = xOf(from), y = yOf(from);
  const out = [];
  const add = (tx, ty) => {
    if (!inB(tx, ty)) return;
    const to = idx(tx, ty);
    const q = board[to];
    if (q && colorOf(q) === color) return;
    pushWithPromotion(out, from, to, t, color);
  };

  const steps = STEP[t];
  if (steps) for (const [dx, dy] of steps) { const [ox, oy] = oriented(color, dx, dy); add(x + ox, y + oy); }
  const slides = SLIDE[t];
  if (slides) for (const [dx, dy] of slides) {
    const [ox, oy] = oriented(color, dx, dy);
    let cx = x + ox, cy = y + oy;
    while (inB(cx, cy)) {
      const to = idx(cx, cy);
      const q = board[to];
      if (!q) pushWithPromotion(out, from, to, t, color);
      else { if (colorOf(q) !== color) pushWithPromotion(out, from, to, t, color); break; }
      cx += ox; cy += oy;
    }
  }
  return out;
}

function pushWithPromotion(out, from, to, t, color) {
  const ty = yOf(to);
  const canPromote = PROMOTABLE.has(t) && (inZone(color, yOf(from)) || inZone(color, ty));
  const forced = ((t === P || t === L) && lastRank(color, ty)) || (t === N && lastTwo(color, ty));
  if (canPromote) out.push({ from, to, promote: true });
  if (!forced) out.push({ from, to, promote: false });
}

export function findKing(board, color) {
  const target = piece(color, K);
  for (let i = 0; i < SIZE; i++) if (board[i] === target) return i;
  return -1;
}

export function isAttacked(board, pos, byColor) {
  if (pos < 0) return false;
  for (let i = 0; i < SIZE; i++) {
    const p = board[i];
    if (!p || colorOf(p) !== byColor) continue;
    const moves = pieceMoves(board, i, byColor);
    for (const m of moves) if (m.to === pos) return true;
  }
  return false;
}

export function inCheck(board, color) {
  return isAttacked(board, findKing(board, color), opponent(color));
}

export function emptyHands() {
  return { [P]: 0, [L]: 0, [N]: 0, [S]: 0, [G]: 0, [B]: 0, [R]: 0 };
}

function nifu(board, color, x) {
  for (let y = 0; y < 9; y++) {
    const p = board[idx(x, y)];
    if (p && colorOf(p) === color && typeOf(p) === P) return true;
  }
  return false;
}

export function dropMoves(state, color) {
  const out = [];
  const hand = state.hands[color];
  for (const t of [R, B, G, S, N, L, P]) {
    if (!hand[t]) continue;
    for (let i = 0; i < SIZE; i++) {
      if (state.board[i]) continue;
      const x = xOf(i), y = yOf(i);
      if ((t === P || t === L) && lastRank(color, y)) continue;
      if (t === N && lastTwo(color, y)) continue;
      if (t === P && nifu(state.board, color, x)) continue;
      out.push({ drop: t, to: i });
    }
  }
  return out;
}

export function applyMove(state, m) {
  const color = state.turn;
  if (m.drop) {
    state.hands[color][m.drop]--;
    state.board[m.to] = piece(color, m.drop);
    state.turn = opponent(color);
    return { drop: m.drop, to: m.to, captured: 0, from: -1, movedType: m.drop };
  }
  const p = state.board[m.from];
  const captured = state.board[m.to];
  const movedType = typeOf(p);
  state.board[m.from] = 0;
  state.board[m.to] = m.promote ? piece(color, movedType + PROMOTED) : p;
  if (captured) state.hands[color][baseType(typeOf(captured))]++;
  state.turn = opponent(color);
  return { from: m.from, to: m.to, captured, capturedType: captured ? typeOf(captured) : 0, movedType, promote: !!m.promote, drop: 0 };
}

export function unapplyMove(state, m, info) {
  const color = opponent(state.turn);
  if (info.drop) {
    state.hands[color][info.drop]++;
    state.board[m.to] = 0;
  } else {
    state.board[m.from] = piece(color, info.movedType);
    state.board[m.to] = info.captured;
    if (info.captured) state.hands[color][baseType(info.capturedType)]--;
  }
  state.turn = color;
}

function pseudoMoves(state, color) {
  const out = [];
  for (let i = 0; i < SIZE; i++) {
    const p = state.board[i];
    if (!p || colorOf(p) !== color) continue;
    for (const m of pieceMoves(state.board, i, color)) out.push(m);
  }
  for (const d of dropMoves(state, color)) out.push(d);
  return out;
}

// 判断某方是否还有合法应手（不含打步诘限制，用于打步诘判定）
function hasAnyLegal(state, color) {
  const saved = state.turn;
  state.turn = color;
  for (const m of pseudoMoves(state, color)) {
    const info = applyMove(state, m);
    const ok = !inCheck(state.board, color);
    unapplyMove(state, m, info);
    if (ok) { state.turn = saved; return true; }
  }
  state.turn = saved;
  return false;
}

export function legalMoves(state, color, checkUchi = true) {
  const saved = state.turn;
  state.turn = color;
  const opp = opponent(color);
  const out = [];
  for (const m of pseudoMoves(state, color)) {
    const info = applyMove(state, m);
    let ok = !inCheck(state.board, color);
    // 打步诘：不可打入步兵直接将军致死
    if (ok && checkUchi && m.drop === P && inCheck(state.board, opp)) {
      if (!hasAnyLegal(state, opp)) ok = false;
    }
    unapplyMove(state, m, info);
    if (ok) out.push(m);
  }
  state.turn = saved;
  return out;
}

export function createState() {
  return { board: initialBoard(), hands: [null, emptyHands(), emptyHands()], turn: BLACK };
}

export class ShogiGame {
  constructor() {
    this.reset();
  }

  reset() {
    this.board = initialBoard();
    this.hands = [null, emptyHands(), emptyHands()];
    this.turn = BLACK;
    this.history = [];
    this.moves = [];
    this.ended = false;
    this.result = null;
    this.lastMove = null;
  }

  _state() {
    return { board: this.board, hands: this.hands, turn: this.turn };
  }

  snapshot() {
    return {
      board: this.board.slice(),
      hands: [null, { ...this.hands[1] }, { ...this.hands[2] }],
      turn: this.turn, ended: this.ended, result: this.result,
      lastMove: this.lastMove, moveCount: this.moves.length,
    };
  }

  restore(s) {
    this.board = s.board.slice();
    this.hands = [null, { ...s.hands[1] }, { ...s.hands[2] }];
    this.turn = s.turn; this.ended = s.ended; this.result = s.result;
    this.lastMove = s.lastMove; this.moves.length = s.moveCount;
  }

  legalMoves(color) {
    return legalMoves(this._state(), color === undefined ? this.turn : color);
  }

  legalMovesFrom(from) {
    return legalMoves(this._state(), this.turn).filter((m) => m.from === from);
  }

  play(move) {
    if (this.ended) return { ok: false };
    const legal = this.legalMoves(this.turn).find((m) =>
      m.drop
        ? move.drop === m.drop && move.to === m.to
        : move.from === m.from && move.to === m.to && !!move.promote === !!m.promote
    );
    if (!legal) return { ok: false };
    this.history.push(this.snapshot());
    const color = this.turn;
    const state = this._state();
    const info = applyMove(state, legal);
    this.turn = state.turn;
    this.board = state.board;
    this.hands = state.hands;
    this.moves.push({ color, move: legal, captured: info.captured ? baseType(info.capturedType) : 0 });
    this.lastMove = legal;
    this._check();
    return { ok: true };
  }

  _check() {
    const moves = legalMoves(this._state(), this.turn);
    if (moves.length === 0) {
      const winner = opponent(this.turn);
      this.ended = true;
      const checked = inCheck(this.board, this.turn);
      this.result = { winner, text: `${colorName(winner)}胜（${checked ? '詰み 将死' : '无合法应手'}）` };
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

  inCheck(color) {
    return inCheck(this.board, color === undefined ? this.turn : color);
  }
}
