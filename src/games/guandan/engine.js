// 掼蛋（简化版）：双副牌、四人两队（座位 0/2 一队、1/3 一队）、比牌出牌、先出完者所在队胜

import { makeDeck, shuffle } from '../../core/cards.js';
import { parseCombo, beats } from '../doudizhu/combos.js';

export const SEATS = 4;
export const seatName = (s) => ['你', '下家', '对家', '上家'][s] || `玩家${s + 1}`;
export const teamOf = (s) => s % 2;
export const teamName = (t) => (t === 0 ? '我方' : '对方');

export class GuandanGame {
  constructor() { this.reset(); }

  reset() {
    const deck = shuffle(makeDeck({ jokers: true, copies: 2 }));
    this.hands = [[], [], [], []];
    for (let i = 0; i < deck.length; i++) this.hands[i % SEATS].push(deck[i]);
    for (const h of this.hands) h.sort((a, b) => a.rank - b.rank || a.id - b.id);
    this.turn = 0;
    this.lastPlay = null;
    this.history = [];
    this.moves = [];
    this.ended = false;
    this.result = null;
    this.lastMove = null;
  }

  snapshot() {
    return {
      hands: this.hands.map((h) => h.map((c) => ({ ...c }))),
      turn: this.turn,
      lastPlay: this.lastPlay ? { combo: { ...this.lastPlay.combo }, cards: this.lastPlay.cards.map((c) => ({ ...c })), seat: this.lastPlay.seat } : null,
      ended: this.ended, result: this.result, lastMove: this.lastMove, moveCount: this.moves.length,
    };
  }
  restore(s) {
    this.hands = s.hands.map((h) => h.map((c) => ({ ...c })));
    this.turn = s.turn;
    this.lastPlay = s.lastPlay ? { combo: { ...s.lastPlay.combo }, cards: s.lastPlay.cards.map((c) => ({ ...c })), seat: s.lastPlay.seat } : null;
    this.ended = s.ended; this.result = s.result; this.lastMove = s.lastMove; this.moves.length = s.moveCount;
  }

  sameSide(a, b) { return a % 2 === b % 2; }

  play(move) {
    if (this.ended) return { ok: false };
    const seat = this.turn;
    if (move.type === 'pass') {
      if (!this.lastPlay || this.lastPlay.seat === seat) return { ok: false };
      this.history.push(this.snapshot());
      this.moves.push({ color: seat, pass: true });
      this.lastMove = { seat, pass: true };
      this.turn = (seat + 1) % SEATS;
      if (this.lastPlay && this.turn === this.lastPlay.seat) this.lastPlay = null;
      return { ok: true };
    }
    if (move.type === 'play') {
      const cards = (move.cards || []).map((id) => this.hands[seat].find((c) => c.id === id)).filter(Boolean);
      if (cards.length !== (move.cards || []).length || cards.length === 0) return { ok: false };
      const combo = parseCombo(cards);
      if (!combo) return { ok: false };
      if (this.lastPlay && this.lastPlay.seat !== seat && !beats(combo, this.lastPlay.combo)) return { ok: false };
      this.history.push(this.snapshot());
      const ids = new Set(cards.map((c) => c.id));
      this.hands[seat] = this.hands[seat].filter((c) => !ids.has(c.id));
      this.lastPlay = { combo, cards: cards.map((c) => ({ ...c })), seat };
      this.lastMove = { seat, cards: cards.map((c) => ({ ...c })) };
      this.moves.push({ color: seat, cards: cards.length });
      if (this.hands[seat].length === 0) {
        this.ended = true;
        this.result = { winner: teamOf(seat), text: `${teamName(teamOf(seat))}获胜（${seatName(seat)}先出完）` };
        return { ok: true };
      }
      this.turn = (seat + 1) % SEATS;
      return { ok: true };
    }
    return { ok: false };
  }

  undo() { if (!this.history.length) return false; this.restore(this.history.pop()); return true; }
  resign(seat) { if (this.ended) return { ok: false }; const t = 1 - teamOf(seat); this.ended = true; this.result = { winner: t, text: `${teamName(t)}获胜（${seatName(seat)}认输）` }; return { ok: true }; }
}
