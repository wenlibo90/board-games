// 升级 / 拖拉机（简化版）：单副牌 54 张、四人两队、亮主、单张墩牌、按分牌计分
// 座位 0/2 为“庄方”，1/3 为“抓分方”；抓分方收集 5/10/K 分牌，满 80 分获胜。

import { makeDeck, shuffle } from '../../core/cards.js';

export const SEATS = 4;
export const seatName = (s) => ['你', '下家', '对家', '上家'][s] || `玩家${s + 1}`;
export const teamOf = (s) => s % 2;
export const SUIT_NAME = { S: '黑桃', H: '红桃', D: '方块', C: '梅花', NT: '无主' };
export const LEVEL = 2;
export const POINTS = { 5: 5, 10: 10, 13: 10 };

export function isTrump(c, trumpSuit) {
  return c.joker > 0 || c.rank === LEVEL || c.suit === trumpSuit;
}
function val(c, trumpSuit) {
  if (c.joker) return 300 + c.rank;
  if (c.rank === LEVEL) return 200 + (c.suit === trumpSuit ? 5 : 0);
  if (c.suit === trumpSuit) return 100 + c.rank;
  return c.rank;
}
export function beats(a, b, trumpSuit, ledSuit) {
  const at = isTrump(a, trumpSuit), bt = isTrump(b, trumpSuit);
  if (at !== bt) return at;
  if (!at) {
    const aLed = a.suit === ledSuit, bLed = b.suit === ledSuit;
    if (aLed !== bLed) return aLed;
  }
  return val(a, trumpSuit) > val(b, trumpSuit);
}

export class ShengjiGame {
  constructor() { this.reset(); }

  reset() {
    const deck = shuffle(makeDeck({ jokers: true }));
    this.hands = [[], [], [], []];
    for (let i = 0; i < 52; i++) this.hands[i % SEATS].push(deck[i]);
    this.bottom = deck.slice(52);
    for (const h of this.hands) h.sort((a, b) => (a.suit || 'Z').localeCompare(b.suit || 'Z') || a.rank - b.rank);
    this.phase = 'trump';
    this.trumpSuit = null;
    this.turn = 0;
    this.trick = [];
    this.leader = 0;
    this.tricks = 0;
    this.points = [0, 0];
    this.history = [];
    this.moves = [];
    this.ended = false;
    this.result = null;
    this.lastMove = null;
  }

  snapshot() {
    return {
      hands: this.hands.map((h) => h.map((c) => ({ ...c }))),
      phase: this.phase, trumpSuit: this.trumpSuit, turn: this.turn, leader: this.leader,
      trick: this.trick.map((t) => ({ seat: t.seat, card: { ...t.card } })),
      tricks: this.tricks, points: this.points.slice(), ended: this.ended, result: this.result,
      lastMove: this.lastMove, moveCount: this.moves.length,
    };
  }
  restore(s) {
    this.hands = s.hands.map((h) => h.map((c) => ({ ...c })));
    this.phase = s.phase; this.trumpSuit = s.trumpSuit; this.turn = s.turn; this.leader = s.leader;
    this.trick = s.trick.map((t) => ({ seat: t.seat, card: { ...t.card } }));
    this.tricks = s.tricks; this.points = s.points.slice(); this.ended = s.ended; this.result = s.result;
    this.lastMove = s.lastMove; this.moves.length = s.moveCount;
  }

  legalFollower(seat) {
    const led = this.trick[0] ? this.trick[0].card : null;
    const hand = this.hands[seat];
    if (!led) return hand;
    const ledTrump = isTrump(led, this.trumpSuit);
    if (ledTrump) {
      const t = hand.filter((c) => isTrump(c, this.trumpSuit));
      return t.length ? t : hand;
    }
    const s = hand.filter((c) => !isTrump(c, this.trumpSuit) && c.suit === led.suit);
    return s.length ? s : hand;
  }

  play(move) {
    if (this.ended) return { ok: false };
    if (this.phase === 'trump') {
      if (this.turn !== 0 || move.type !== 'trump') return { ok: false };
      this.history.push(this.snapshot());
      this.trumpSuit = move.suit === 'NT' ? null : move.suit;
      this.phase = 'play';
      this.turn = 0;
      this.trick = [];
      this.moves.push({ color: 0, trump: move.suit });
      return { ok: true };
    }
    const seat = this.turn;
    if (move.type !== 'play') return { ok: false };
    const card = this.hands[seat].find((c) => c.id === move.card);
    if (!card) return { ok: false };
    if (this.trick.length > 0) {
      const allowed = this.legalFollower(seat);
      if (!allowed.some((c) => c.id === card.id)) return { ok: false };
    }
    this.history.push(this.snapshot());
    this.hands[seat] = this.hands[seat].filter((c) => c.id !== card.id);
    this.trick.push({ seat, card });
    this.lastMove = { seat, card: { ...card } };
    this.moves.push({ color: seat, card: card.id });
    if (this.trick.length === SEATS) {
      this._resolveTrick();
    } else {
      this.turn = (seat + 1) % SEATS;
    }
    return { ok: true };
  }

  _resolveTrick() {
    const led = this.trick[0].card;
    const ledSuit = isTrump(led, this.trumpSuit) ? null : led.suit;
    let win = this.trick[0];
    for (const t of this.trick) {
      if (beats(t.card, win.card, this.trumpSuit, ledSuit)) win = t;
    }
    let pts = 0;
    for (const t of this.trick) pts += POINTS[t.card.rank] || 0;
    this.points[teamOf(win.seat)] += pts;
    this.tricks++;
    this.trick = [];
    this.turn = win.seat;
    this.leader = win.seat;
    if (this.tricks >= 13) this._finish();
  }

  _finish() {
    this.ended = true;
    const grab = this.points[1];
    const dealer = this.points[0];
    const grabWins = grab >= 80;
    this.result = {
      winner: grabWins ? 1 : 0,
      text: grabWins ? `抓分方获胜（抓到 ${grab} 分）` : `庄方获胜（抓分方仅 ${grab} 分）`,
    };
  }

  undo() { if (!this.history.length) return false; this.restore(this.history.pop()); return true; }
  resign(seat) { if (this.ended) return { ok: false }; const t = 1 - teamOf(seat); this.ended = true; this.result = { winner: t, text: `${t === 0 ? '庄方' : '抓分方'}获胜（${seatName(seat)}认输）` }; return { ok: true }; }
}
