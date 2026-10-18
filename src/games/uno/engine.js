// UNO 规则引擎（4 人：玩家1 vs AI×3）

export const SEATS = 4;
export const COLORS = ['R', 'Y', 'G', 'B'];
export const COLOR_NAME = { R: '红', Y: '黄', G: '绿', B: '蓝', W: '无色' };
export const seatName = (s) => `玩家${s + 1}`;

let _uid = 1;
function card(color, value) { return { id: _uid++, color, value }; }

export function buildDeck() {
  const deck = [];
  for (const c of COLORS) {
    deck.push(card(c, '0'));
    for (let n = 1; n <= 9; n++) { deck.push(card(c, String(n))); deck.push(card(c, String(n))); }
    for (const v of ['skip', 'rev', 'draw2']) { deck.push(card(c, v)); deck.push(card(c, v)); }
  }
  for (let i = 0; i < 4; i++) { deck.push(card('W', 'wild')); deck.push(card('W', 'wild4')); }
  return deck;
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}

function playable(card2, color, value) {
  if (card2.color === 'W') return true;
  return card2.color === color || card2.value === value;
}

export class UnoGame {
  constructor() { this.reset(); }

  reset() {
    this.hands = [[], [], [], []];
    const deck = shuffle(buildDeck());
    for (let i = 0; i < 7; i++) for (let s = 0; s < SEATS; s++) this.hands[s].push(deck.pop());
    // 起始牌：翻到数字牌为止
    let start = deck.pop();
    while (start && start.color === 'W') { deck.unshift(start); start = deck.pop(); }
    this.discard = [start];
    this.drawPile = deck;
    this.color = start.color;
    this.value = start.value;
    this.turn = 0;
    this.dir = 1;
    this.phase = 'play'; // play | afterDraw
    this.drawnId = -1;
    this.history = [];
    this.moves = [];
    this.ended = false;
    this.result = null;
    this.lastMove = null;
    this.pendingFrom = -1;
    // 起始效果
    if (start.value === 'skip') this._advance(2);
    else if (start.value === 'rev') { this.dir = -1; this._advance(1); }
    else if (start.value === 'draw2') { this._drawTo(0, 2); this._advance(2); }
  }

  snapshot() {
    return {
      hands: this.hands.map((h) => h.map((c) => ({ ...c }))),
      discard: this.discard.map((c) => ({ ...c })),
      drawPile: this.drawPile.map((c) => ({ ...c })),
      color: this.color, value: this.value, turn: this.turn, dir: this.dir,
      phase: this.phase, drawnId: this.drawnId, ended: this.ended, result: this.result,
      lastMove: this.lastMove, moveCount: this.moves.length,
    };
  }
  restore(s) {
    this.hands = s.hands.map((h) => h.map((c) => ({ ...c })));
    this.discard = s.discard.map((c) => ({ ...c }));
    this.drawPile = s.drawPile.map((c) => ({ ...c }));
    this.color = s.color; this.value = s.value; this.turn = s.turn; this.dir = s.dir;
    this.phase = s.phase; this.drawnId = s.drawnId; this.ended = s.ended; this.result = s.result;
    this.lastMove = s.lastMove; this.moves.length = s.moveCount;
  }

  top() { return this.discard[this.discard.length - 1]; }

  legalPlays(seat) {
    if (this.phase === 'afterDraw') {
      const h = this.hands[seat];
      const dc = h.find((c) => c.id === this.drawnId);
      if (dc && playable(dc, this.color, this.value)) return [dc];
      return [];
    }
    return this.hands[seat].filter((c) => playable(c, this.color, this.value));
  }

  _drawOne(seat) {
    if (this.drawPile.length === 0) this._reshuffle();
    if (this.drawPile.length === 0) return null;
    const c = this.drawPile.pop();
    this.hands[seat].push(c);
    return c;
  }
  _drawTo(seat, n) { for (let i = 0; i < n; i++) this._drawOne(seat); }
  _reshuffle() {
    if (this.discard.length <= 1) return;
    const top = this.discard.pop();
    const rest = this.discard.splice(0, this.discard.length);
    this.drawPile = shuffle(rest.concat(this.drawPile));
    this.discard = [top];
  }

  _advance(steps) {
    this.turn = (((this.turn + this.dir * steps) % SEATS) + SEATS) % SEATS;
  }

  play(move) {
    if (this.ended) return { ok: false };
    const seat = this.turn;
    if (move.type === 'draw') {
      if (this.phase !== 'play') return { ok: false };
      this.history.push(this.snapshot());
      const c = this._drawOne(seat);
      if (!c) { this._advance(1); return { ok: true }; }
      this.moves.push({ color: seat, draw: true });
      if (playable(c, this.color, this.value)) { this.phase = 'afterDraw'; this.drawnId = c.id; }
      else { this._endTurn(); }
      return { ok: true };
    }
    if (move.type === 'pass') {
      if (this.phase !== 'afterDraw') return { ok: false };
      this.history.push(this.snapshot());
      this.moves.push({ color: seat, pass: true });
      this._endTurn();
      return { ok: true };
    }
    if (move.type === 'play') {
      const card2 = this.hands[seat].find((c) => c.id === move.id);
      if (!card2) return { ok: false };
      const legal = this.phase === 'afterDraw' ? (this.drawnId === card2.id && playable(card2, this.color, this.value)) : playable(card2, this.color, this.value);
      if (!legal) return { ok: false };
      this.history.push(this.snapshot());
      this.hands[seat] = this.hands[seat].filter((c) => c.id !== card2.id);
      this.discard.push(card2);
      this.lastMove = { seat, card: { ...card2 } };
      this.moves.push({ color: seat, id: card2.id, value: card2.value });
      if (card2.color === 'W') this.color = COLORS.includes(move.color) ? move.color : this._bestColor(seat);
      else this.color = card2.color;
      this.value = card2.value;
      this.phase = 'play';
      this.drawnId = -1;
      if (this.hands[seat].length === 0) {
        this.ended = true;
        this.result = { winner: seat, text: `${seatName(seat)} 手牌出完，获胜` };
        return { ok: true };
      }
      // 效果
      const v = card2.value;
      if (v === 'skip') this._advance(2);
      else if (v === 'rev') { this.dir = -1 * this.dir; this._advance(1); }
      else if (v === 'draw2') { const n = this._next(1); this._drawTo(n, 2); this._advance(2); }
      else if (v === 'wild4') { const n = this._next(1); this._drawTo(n, 4); this._advance(2); }
      else this._advance(1);
      return { ok: true };
    }
    return { ok: false };
  }

  _next(steps) { return (((this.turn + this.dir * steps) % SEATS) + SEATS) % SEATS; }
  _endTurn() { this.phase = 'play'; this.drawnId = -1; this._advance(1); }
  _bestColor(seat) {
    const cnt = { R: 0, Y: 0, G: 0, B: 0 };
    for (const c of this.hands[seat]) if (cnt[c.color] !== undefined) cnt[c.color]++;
    let best = 'R', bv = -1;
    for (const k of COLORS) if (cnt[k] > bv) { bv = cnt[k]; best = k; }
    return best;
  }

  undo() { if (!this.history.length) return false; this.restore(this.history.pop()); return true; }
  resign(seat) { if (this.ended) return { ok: false }; const winner = (seat + 1) % SEATS; this.ended = true; this.result = { winner, text: `${seatName(winner)} 获胜（${seatName(seat)} 认输）` }; return { ok: true }; }
}
