// 国际象棋规则引擎
// 棋盘 8x8，index = y*8 + x，y=0 为第 8 行（黑方底线），y=7 为第 1 行（白方底线）
// 棋子编码：color*10 + type，color: WHITE=1, BLACK=2

export const WHITE = 1;
export const BLACK = 2;

export const P = 1;
export const N = 2;
export const B = 3;
export const R = 4;
export const Q = 5;
export const K = 6;

export const SIZE = 64;

export const colorOf = (p) => (p / 10) | 0;
export const typeOf = (p) => p % 10;
export const piece = (color, type) => color * 10 + type;
export const opponent = (c) => (c === WHITE ? BLACK : WHITE);
export const colorName = (c) => (c === WHITE ? '白' : '黑');

export const idx = (x, y) => y * 8 + x;
export const xOf = (i) => i % 8;
export const yOf = (i) => (i / 8) | 0;
const inB = (x, y) => x >= 0 && x < 8 && y >= 0 && y < 8;

const KNIGHT = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
const ORTHO = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const ALL8 = [...ORTHO, ...DIAG];

const WK = 1, WQ = 2, BK = 4, BQ = 8;

export const PIECE_UNICODE = {
  [WHITE * 10 + K]: '♔', [WHITE * 10 + Q]: '♕', [WHITE * 10 + R]: '♖',
  [WHITE * 10 + B]: '♗', [WHITE * 10 + N]: '♘', [WHITE * 10 + P]: '♙',
  [BLACK * 10 + K]: '♚', [BLACK * 10 + Q]: '♛', [BLACK * 10 + R]: '♜',
  [BLACK * 10 + B]: '♝', [BLACK * 10 + N]: '♞', [BLACK * 10 + P]: '♟',
};

export function initialBoard() {
  const b = new Int8Array(SIZE);
  const back = [R, N, B, Q, K, B, N, R];
  for (let x = 0; x < 8; x++) {
    b[idx(x, 0)] = piece(BLACK, back[x]);
    b[idx(x, 1)] = piece(BLACK, P);
    b[idx(x, 6)] = piece(WHITE, P);
    b[idx(x, 7)] = piece(WHITE, back[x]);
  }
  return b;
}

export function findKing(board, color) {
  const target = piece(color, K);
  for (let i = 0; i < SIZE; i++) if (board[i] === target) return i;
  return -1;
}

export function isAttacked(board, sq, by) {
  if (sq < 0) return false;
  const x = xOf(sq), y = yOf(sq);

  // 兵
  const pdir = by === WHITE ? 1 : -1;
  for (const dx of [-1, 1]) {
    const nx = x + dx, ny = y + pdir;
    if (inB(nx, ny)) {
      const p = board[idx(nx, ny)];
      if (p && colorOf(p) === by && typeOf(p) === P) return true;
    }
  }
  // 马
  for (const [dx, dy] of KNIGHT) {
    const nx = x + dx, ny = y + dy;
    if (inB(nx, ny)) {
      const p = board[idx(nx, ny)];
      if (p && colorOf(p) === by && typeOf(p) === N) return true;
    }
  }
  // 王
  for (const [dx, dy] of ALL8) {
    const nx = x + dx, ny = y + dy;
    if (inB(nx, ny)) {
      const p = board[idx(nx, ny)];
      if (p && colorOf(p) === by && typeOf(p) === K) return true;
    }
  }
  // 斜线：象/后
  for (const [dx, dy] of DIAG) {
    let nx = x + dx, ny = y + dy;
    while (inB(nx, ny)) {
      const p = board[idx(nx, ny)];
      if (p) {
        if (colorOf(p) === by && (typeOf(p) === B || typeOf(p) === Q)) return true;
        break;
      }
      nx += dx; ny += dy;
    }
  }
  // 直线：车/后
  for (const [dx, dy] of ORTHO) {
    let nx = x + dx, ny = y + dy;
    while (inB(nx, ny)) {
      const p = board[idx(nx, ny)];
      if (p) {
        if (colorOf(p) === by && (typeOf(p) === R || typeOf(p) === Q)) return true;
        break;
      }
      nx += dx; ny += dy;
    }
  }
  return false;
}

export function inCheck(board, color) {
  return isAttacked(board, findKing(board, color), opponent(color));
}

function addPawn(moves, from, to, promo) {
  if (promo) {
    for (const t of [Q, R, B, N]) moves.push({ from, to, promotion: t });
  } else {
    moves.push({ from, to });
  }
}

function addCastling(pos, color, moves) {
  const b = pos.board;
  const back = color === WHITE ? 7 : 0;
  const ksq = idx(4, back);
  if (b[ksq] !== piece(color, K)) return;
  const opp = opponent(color);
  const kBit = color === WHITE ? WK : BK;
  const qBit = color === WHITE ? WQ : BQ;
  if (pos.castling & kBit) {
    if (
      !b[idx(5, back)] && !b[idx(6, back)] && b[idx(7, back)] === piece(color, R) &&
      !isAttacked(b, ksq, opp) && !isAttacked(b, idx(5, back), opp) && !isAttacked(b, idx(6, back), opp)
    ) {
      moves.push({ from: ksq, to: idx(6, back), castle: 'K' });
    }
  }
  if (pos.castling & qBit) {
    if (
      !b[idx(1, back)] && !b[idx(2, back)] && !b[idx(3, back)] && b[idx(0, back)] === piece(color, R) &&
      !isAttacked(b, ksq, opp) && !isAttacked(b, idx(3, back), opp) && !isAttacked(b, idx(2, back), opp)
    ) {
      moves.push({ from: ksq, to: idx(2, back), castle: 'Q' });
    }
  }
}

export function generateMoves(pos, color) {
  const b = pos.board;
  const moves = [];
  for (let from = 0; from < SIZE; from++) {
    const p = b[from];
    if (!p || colorOf(p) !== color) continue;
    const t = typeOf(p);
    const x = xOf(from), y = yOf(from);

    if (t === P) {
      const dir = color === WHITE ? -1 : 1;
      const startRank = color === WHITE ? 6 : 1;
      const promoRank = color === WHITE ? 0 : 7;
      const ny = y + dir;
      if (inB(x, ny) && !b[idx(x, ny)]) {
        addPawn(moves, from, idx(x, ny), ny === promoRank);
        if (y === startRank && !b[idx(x, y + 2 * dir)]) moves.push({ from, to: idx(x, y + 2 * dir) });
      }
      for (const dx of [-1, 1]) {
        const nx = x + dx;
        if (!inB(nx, ny)) continue;
        const to = idx(nx, ny);
        const q = b[to];
        if (q && colorOf(q) !== color) addPawn(moves, from, to, ny === promoRank);
        else if (!q && to === pos.ep) moves.push({ from, to, ep: true });
      }
    } else if (t === N) {
      for (const [dx, dy] of KNIGHT) {
        const nx = x + dx, ny = y + dy;
        if (!inB(nx, ny)) continue;
        const to = idx(nx, ny);
        const q = b[to];
        if (!q || colorOf(q) !== color) moves.push({ from, to });
      }
    } else if (t === B || t === R || t === Q) {
      const dirs = t === B ? DIAG : t === R ? ORTHO : ALL8;
      for (const [dx, dy] of dirs) {
        let nx = x + dx, ny = y + dy;
        while (inB(nx, ny)) {
          const to = idx(nx, ny);
          const q = b[to];
          if (!q) moves.push({ from, to });
          else {
            if (colorOf(q) !== color) moves.push({ from, to });
            break;
          }
          nx += dx; ny += dy;
        }
      }
    } else if (t === K) {
      for (const [dx, dy] of ALL8) {
        const nx = x + dx, ny = y + dy;
        if (!inB(nx, ny)) continue;
        const to = idx(nx, ny);
        const q = b[to];
        if (!q || colorOf(q) !== color) moves.push({ from, to });
      }
      addCastling(pos, color, moves);
    }
  }
  return moves;
}

export function makeMove(pos, m) {
  const b = pos.board;
  const undo = {
    piece: b[m.from], captured: 0, capturedSq: -1,
    castling: pos.castling, ep: pos.ep, halfmove: pos.halfmove,
  };
  const pc = b[m.from];
  const color = colorOf(pc);
  if (m.ep) {
    const capSq = m.to + (color === WHITE ? 8 : -8);
    undo.captured = b[capSq];
    undo.capturedSq = capSq;
    b[capSq] = 0;
  } else {
    undo.captured = b[m.to];
    undo.capturedSq = m.to;
  }
  b[m.to] = m.promotion ? piece(color, m.promotion) : pc;
  b[m.from] = 0;
  if (m.castle === 'K') {
    const rp = b[m.to + 1];
    b[m.to + 1] = 0;
    b[m.to - 1] = rp;
  } else if (m.castle === 'Q') {
    const rp = b[m.to - 2];
    b[m.to - 2] = 0;
    b[m.to + 1] = rp;
  }
  // 王车易位权
  let cast = pos.castling;
  if (color === WHITE) {
    if (m.from === 60 || m.from === 63) cast &= ~WK;
    if (m.from === 60 || m.from === 56) cast &= ~WQ;
  } else {
    if (m.from === 4 || m.from === 7) cast &= ~BK;
    if (m.from === 4 || m.from === 0) cast &= ~BQ;
  }
  if (m.to === 63) cast &= ~WK;
  if (m.to === 56) cast &= ~WQ;
  if (m.to === 7) cast &= ~BK;
  if (m.to === 0) cast &= ~BQ;
  pos.castling = cast;

  pos.ep = -1;
  if (typeOf(pc) === P && Math.abs(yOf(m.to) - yOf(m.from)) === 2) pos.ep = (m.from + m.to) / 2;
  if (typeOf(pc) === P || undo.captured) pos.halfmove = 0;
  else pos.halfmove++;
  pos.turn = opponent(color);
  return undo;
}

export function unmakeMove(pos, m, undo) {
  const b = pos.board;
  b[m.from] = undo.piece;
  b[m.to] = 0;
  if (undo.capturedSq >= 0) b[undo.capturedSq] = undo.captured;
  if (m.castle === 'K') {
    const rp = b[m.to - 1];
    b[m.to - 1] = 0;
    b[m.to + 1] = rp;
  } else if (m.castle === 'Q') {
    const rp = b[m.to + 1];
    b[m.to + 1] = 0;
    b[m.to - 2] = rp;
  }
  pos.castling = undo.castling;
  pos.ep = undo.ep;
  pos.halfmove = undo.halfmove;
  pos.turn = colorOf(undo.piece);
}

export function legalMoves(pos, color) {
  const out = [];
  for (const m of generateMoves(pos, color)) {
    const undo = makeMove(pos, m);
    if (!inCheck(pos.board, color)) out.push(m);
    unmakeMove(pos, m, undo);
  }
  return out;
}

function insufficientMaterial(board) {
  const pieces = [];
  for (let i = 0; i < SIZE; i++) if (board[i]) pieces.push({ t: typeOf(board[i]), c: colorOf(board[i]), i });
  const nonKings = pieces.filter((p) => p.t !== K);
  if (nonKings.length === 0) return true;
  if (nonKings.length === 1 && (nonKings[0].t === B || nonKings[0].t === N)) return true;
  if (nonKings.length === 2 && nonKings.every((p) => p.t === B)) {
    const sq = nonKings.map((p) => (xOf(p.i) + yOf(p.i)) % 2);
    if (sq[0] === sq[1]) return true;
  }
  return false;
}

export class ChessGame {
  constructor() {
    this.reset();
  }

  reset() {
    this.board = initialBoard();
    this.turn = WHITE;
    this.castling = WK | WQ | BK | BQ;
    this.ep = -1;
    this.halfmove = 0;
    this.fullmove = 1;
    this.history = [];
    this.moves = [];
    this.ended = false;
    this.result = null;
    this.lastMove = null;
  }

  _pos() {
    return { board: this.board, turn: this.turn, castling: this.castling, ep: this.ep, halfmove: this.halfmove };
  }

  snapshot() {
    return {
      board: this.board.slice(),
      turn: this.turn,
      castling: this.castling,
      ep: this.ep,
      halfmove: this.halfmove,
      fullmove: this.fullmove,
      ended: this.ended,
      result: this.result,
      lastMove: this.lastMove,
      moveCount: this.moves.length,
    };
  }

  restore(s) {
    this.board = s.board.slice();
    this.turn = s.turn;
    this.castling = s.castling;
    this.ep = s.ep;
    this.halfmove = s.halfmove;
    this.fullmove = s.fullmove;
    this.ended = s.ended;
    this.result = s.result;
    this.lastMove = s.lastMove;
    this.moves.length = s.moveCount;
  }

  legalMoves(color) {
    return legalMoves(this._pos(), color === undefined ? this.turn : color);
  }

  legalMovesFrom(from) {
    if (from < 0 || from >= SIZE) return [];
    const p = this.board[from];
    if (!p || colorOf(p) !== this.turn) return [];
    return this.legalMoves(this.turn).filter((m) => m.from === from);
  }

  play(move) {
    if (this.ended) return { ok: false };
    const legal = this.legalMovesFrom(move.from).find(
      (m) => m.to === move.to && (m.promotion || 0) === (move.promotion || 0)
    );
    if (!legal) return { ok: false };
    this.history.push(this.snapshot());
    const pc = this.board[move.from];
    const movColor = colorOf(pc);
    const pos = this._pos();
    const undo = makeMove(pos, legal);
    this.turn = pos.turn;
    this.ep = pos.ep;
    this.castling = pos.castling;
    this.halfmove = pos.halfmove;
    this.moves.push({
      color: movColor,
      from: legal.from,
      to: legal.to,
      promotion: legal.promotion,
      castle: legal.castle,
      captured: undo.captured ? typeOf(undo.captured) : 0,
    });
    if (movColor === BLACK) this.fullmove++;
    this.lastMove = { from: legal.from, to: legal.to };
    this._checkGameOver();
    return { ok: true };
  }

  _checkGameOver() {
    const moves = this.legalMoves(this.turn);
    if (moves.length === 0) {
      const checked = inCheck(this.board, this.turn);
      const winner = checked ? opponent(this.turn) : 0;
      this.ended = true;
      if (checked) {
        this.result = { reason: 'checkmate', winner, text: `${colorName(winner)}胜（将杀）` };
      } else {
        this.result = { reason: 'stalemate', winner: 0, text: '和棋（无子可动）' };
      }
      return;
    }
    if (this.halfmove >= 100) {
      this.ended = true;
      this.result = { reason: 'fifty', winner: 0, text: '和棋（50 回合未吃子未动兵）' };
      return;
    }
    if (insufficientMaterial(this.board)) {
      this.ended = true;
      this.result = { reason: 'material', winner: 0, text: '和棋（子力不足）' };
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
    for (let y = 0; y < 8; y++) {
      let r = '';
      for (let x = 0; x < 8; x++) {
        const p = this.board[idx(x, y)];
        r += p ? PIECE_UNICODE[p] : '·';
      }
      rows.push(r);
    }
    return rows.join('\n');
  }
}
