// 六角跳棋（中国跳棋 / Chinese Checkers）规则引擎（双人）
// 六角星棋盘共 121 个孔位；走法为相邻一步，或连续跳跃（可连跳，不落回已访问点）。
// 目标：把自己的全部棋子移入对面三角区。

export const EMPTY = 0;
export const RED = 1; // 上方三角区
export const BLUE = 2; // 下方三角区

export const opponent = (c) => (c === RED ? BLUE : RED);
export const colorName = (c) => (c === RED ? '红' : '蓝');

const ROW_COUNTS = [1, 2, 3, 4, 13, 12, 11, 10, 9, 10, 11, 12, 13, 4, 3, 2, 1];

function build() {
  const coords = [];
  const rows = [];
  const H = Math.sqrt(3) / 2;
  for (let r = 0; r < ROW_COUNTS.length; r++) {
    const c = ROW_COUNTS[r];
    const ids = [];
    for (let j = 0; j < c; j++) {
      const x = j - (c - 1) / 2;
      const y = r * H;
      ids.push(coords.length);
      coords.push({ x, y, row: r, col: j });
    }
    rows.push(ids);
  }
  const neighbors = coords.map(() => []);
  const dirNeighbor = coords.map(() => ({}));
  const EPS = 1e-6;
  for (let a = 0; a < coords.length; a++) {
    for (let b = a + 1; b < coords.length; b++) {
      const dx = coords[b].x - coords[a].x;
      const dy = coords[b].y - coords[a].y;
      const d = Math.hypot(dx, dy);
      if (Math.abs(d - 1) < EPS) {
        neighbors[a].push(b);
        neighbors[b].push(a);
        const keyA = `${dx.toFixed(3)},${dy.toFixed(3)}`;
        const keyB = `${(-dx).toFixed(3)},${(-dy).toFixed(3)}`;
        dirNeighbor[a][keyA] = b;
        dirNeighbor[b][keyB] = a;
      }
    }
  }
  const top = [];
  for (let r = 0; r <= 3; r++) top.push(...rows[r]);
  const bottom = [];
  for (let r = 13; r <= 16; r++) bottom.push(...rows[r]);
  return { coords, rows, neighbors, dirNeighbor, top, bottom, count: coords.length };
}

export const BOARD = build();
export const N = BOARD.count;

function dirKey(from, to) {
  const dx = BOARD.coords[to].x - BOARD.coords[from].x;
  const dy = BOARD.coords[to].y - BOARD.coords[from].y;
  return `${dx.toFixed(3)},${dy.toFixed(3)}`;
}

export function movesFrom(cells, from) {
  const res = new Set();
  for (const n of BOARD.neighbors[from]) if (cells[n] === EMPTY) res.add(n);
  const visited = new Set([from]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift();
    for (const n of BOARD.neighbors[cur]) {
      if (cells[n] === EMPTY) continue; // 跳跃必须越过棋子
      const land = BOARD.dirNeighbor[n][dirKey(cur, n)];
      if (land != null && cells[land] === EMPTY && !visited.has(land)) {
        visited.add(land);
        res.add(land);
        queue.push(land);
      }
    }
  }
  return [...res];
}

export function initialCells() {
  const cells = new Int8Array(N);
  for (const i of BOARD.top) cells[i] = RED;
  for (const i of BOARD.bottom) cells[i] = BLUE;
  return cells;
}

export class CheckersGame {
  constructor() { this.reset(); }
  reset() {
    this.cells = initialCells();
    this.count = 10;
    this.turn = RED;
    this.history = [];
    this.moves = [];
    this.ended = false;
    this.result = null;
    this.lastMove = null;
    this.passes = 0;
  }
  snapshot() {
    return { cells: this.cells.slice(), turn: this.turn, ended: this.ended, result: this.result, lastMove: this.lastMove, passes: this.passes, moveCount: this.moves.length };
  }
  restore(s) {
    this.cells = s.cells.slice(); this.turn = s.turn; this.ended = s.ended; this.result = s.result; this.lastMove = s.lastMove; this.passes = s.passes; this.moves.length = s.moveCount;
  }
  legalMoves(color) {
    color = color === undefined ? this.turn : color;
    const out = [];
    for (let i = 0; i < N; i++) {
      if (this.cells[i] !== color) continue;
      for (const to of movesFrom(this.cells, i)) out.push({ from: i, to });
    }
    return out;
  }
  legalMovesFrom(from) { if (this.cells[from] !== this.turn) return []; return movesFrom(this.cells, from).map((to) => ({ from, to })); }
  play(move) {
    if (this.ended) return { ok: false };
    const tos = movesFrom(this.cells, move.from);
    if (this.cells[move.from] !== this.turn || !tos.includes(move.to)) return { ok: false };
    this.history.push(this.snapshot());
    const color = this.turn;
    this.cells[move.to] = color;
    this.cells[move.from] = EMPTY;
    this.moves.push({ color, from: move.from, to: move.to });
    this.lastMove = { from: move.from, to: move.to };
    this.passes = 0;
    if (this._won(color)) { this.ended = true; this.result = { winner: color, text: `${colorName(color)}胜（全部棋子抵达对岸）` }; return { ok: true }; }
    this.turn = opponent(color);
    this._checkSkip();
    return { ok: true };
  }
  _won(color) {
    const target = color === RED ? BOARD.bottom : BOARD.top;
    let n = 0;
    for (const i of target) if (this.cells[i] === color) n++;
    return n === this.count;
  }
  _checkSkip() {
    if (this.legalMoves(this.turn).length === 0) {
      this.moves.push({ color: this.turn, pass: true });
      this.passes++;
      this.turn = opponent(this.turn);
      if (this.passes >= 2) { this.ended = true; this.result = { winner: 0, text: '双方均无子可动，和棋' }; }
    }
  }
  undo() { if (!this.history.length) return false; this.restore(this.history.pop()); return true; }
  resign(color) { if (this.ended) return { ok: false }; const winner = opponent(color); this.ended = true; this.result = { winner, text: `${colorName(winner)}胜（${colorName(color)}认输）` }; return { ok: true }; }
}
