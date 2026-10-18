// 斗兽棋（丛林棋）规则引擎
// 棋盘 7x9，index = y*7 + x，y=0 为蓝方底线，y=8 为红方底线

export const RED = 1; // 下方
export const BLUE = 2; // 上方

export const RAT = 1, CAT = 2, DOG = 3, WOLF = 4, LEOPARD = 5, TIGER = 6, LION = 7, ELEPHANT = 8;

export const COLS = 7, ROWS = 9, SIZE = COLS * ROWS;

export const RANK_NAME = {
  [RAT]: '鼠', [CAT]: '猫', [DOG]: '狗', [WOLF]: '狼',
  [LEOPARD]: '豹', [TIGER]: '虎', [LION]: '狮', [ELEPHANT]: '象',
};

export const opponent = (c) => (c === RED ? BLUE : RED);
export const colorName = (c) => (c === RED ? '红' : '蓝');
export const piece = (color, rank) => color * 10 + rank;
export const colorOf = (p) => (p / 10) | 0;
export const rankOf = (p) => p % 10;
export const idx = (x, y) => y * COLS + x;
export const xOf = (i) => i % COLS;
export const yOf = (i) => (i / COLS) | 0;
const inB = (x, y) => x >= 0 && x < COLS && y >= 0 && y < ROWS;

export const DEN = { [BLUE]: idx(3, 0), [RED]: idx(3, 8) };
const TRAPS = {
  [BLUE]: [idx(2, 0), idx(4, 0), idx(3, 1)],
  [RED]: [idx(2, 8), idx(4, 8), idx(3, 7)],
};

export function inWater(i) {
  const x = xOf(i), y = yOf(i);
  return y >= 3 && y <= 5 && x >= 1 && x <= 5;
}

export function isTrapOf(i, color) {
  return TRAPS[color].includes(i);
}

export function initialBoard() {
  const b = new Int8Array(SIZE);
  const layout = [
    [BLUE, LION, 1, 0], [BLUE, TIGER, 5, 0],
    [BLUE, ELEPHANT, 0, 1], [BLUE, WOLF, 3, 1], [BLUE, LEOPARD, 6, 1],
    [BLUE, CAT, 1, 2], [BLUE, RAT, 3, 2], [BLUE, DOG, 5, 2],
  ];
  for (const [c, r, x, y] of layout) b[idx(x, y)] = piece(c, r);
  for (const [c, r, x, y] of layout) b[idx(x, 8 - y)] = piece(opponent(c), r);
  return b;
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// 判断攻方能否吃掉守方
function canCapture(board, from, to, color) {
  const attacker = board[from];
  const defender = board[to];
  if (!defender) return true;
  if (colorOf(defender) === color) return false;
  const aw = inWater(from), dw = inWater(to);
  if (dw && !aw) return rankOf(attacker) === RAT; // 陆地子不能吃水中子（鼠除外）
  if (aw && !dw) return false; // 水中子不能吃陆地子
  const at = rankOf(attacker), dt = rankOf(defender);
  if (isTrapOf(to, color)) return true; // 守方在攻方陷阱中，任意子可吃
  if (at === ELEPHANT && dt === RAT) return false; // 象不能吃鼠
  if (at === RAT && dt === ELEPHANT) return true; // 鼠可吃象
  return at >= dt;
}

function jumpTargets(board, from, color) {
  const out = [];
  const x = xOf(from), y = yOf(from);
  const tryJump = (dx, dy) => {
    let cx = x + dx, cy = y + dy;
    const cells = [];
    while (inB(cx, cy)) {
      if (!inWater(idx(cx, cy))) break;
      cells.push(idx(cx, cy));
      cx += dx; cy += dy;
    }
    if (cells.length < 2) return; // 跳河需跨越水面
    if (!inB(cx, cy)) return;
    // 水面路径上不能有鼠
    for (const c of cells) if (board[c] && rankOf(board[c]) === RAT) return;
    const to = idx(cx, cy);
    if (inWater(to)) return;
    const q = board[to];
    if (q && colorOf(q) === color) return;
    if (q && !canCapture(board, from, to, color)) return;
    out.push({ from, to, jump: true });
  };
  for (const [dx, dy] of DIRS) tryJump(dx, dy);
  return out;
}

export function genMovesFrom(board, from, color) {
  const p = board[from];
  if (!p || colorOf(p) !== color) return [];
  const out = [];
  const x = xOf(from), y = yOf(from);
  for (const [dx, dy] of DIRS) {
    const nx = x + dx, ny = y + dy;
    if (!inB(nx, ny)) continue;
    const to = idx(nx, ny);
    if (to === DEN[color]) continue; // 不可进入己方兽穴
    if (!canCapture(board, from, to, color)) continue;
    out.push({ from, to, jump: false });
  }
  if (rankOf(p) === LION || rankOf(p) === TIGER) out.push(...jumpTargets(board, from, color));
  return out;
}

export function legalMoves(board, color) {
  const out = [];
  for (let i = 0; i < SIZE; i++) {
    const p = board[i];
    if (p && colorOf(p) === color) out.push(...genMovesFrom(board, i, color));
  }
  return out;
}

export class JungleGame {
  constructor() {
    this.size = SIZE;
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

  snapshot() {
    return { board: this.board.slice(), turn: this.turn, ended: this.ended, result: this.result, lastMove: this.lastMove, moveCount: this.moves.length };
  }

  restore(s) {
    this.board = s.board.slice();
    this.turn = s.turn; this.ended = s.ended; this.result = s.result; this.lastMove = s.lastMove; this.moves.length = s.moveCount;
  }

  legalMoves(color) {
    return legalMoves(this.board, color === undefined ? this.turn : color);
  }

  legalMovesFrom(from) {
    return genMovesFrom(this.board, from, this.turn);
  }

  play(move) {
    if (this.ended) return { ok: false };
    const legal = genMovesFrom(this.board, move.from, this.turn).find((m) => m.to === move.to);
    if (!legal) return { ok: false };
    this.history.push(this.snapshot());
    const color = this.turn;
    const captured = this.board[move.to];
    this.board[move.to] = this.board[move.from];
    this.board[move.from] = 0;
    this.moves.push({ color, from: move.from, to: move.to, jump: !!legal.jump, captured });
    this.lastMove = { from: move.from, to: move.to };
    // 进入对方兽穴获胜
    if (move.to === DEN[opponent(color)]) {
      this.ended = true;
      this.result = { winner: color, text: `${colorName(color)}胜（攻入对方兽穴）` };
      return { ok: true, captured };
    }
    this.turn = opponent(color);
    this._check();
    return { ok: true, captured };
  }

  _check() {
    const moves = legalMoves(this.board, this.turn);
    if (moves.length === 0) {
      const winner = opponent(this.turn);
      this.ended = true;
      this.result = { winner, text: `${colorName(winner)}胜（对方无子可动）` };
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
