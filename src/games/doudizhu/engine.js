// 斗地主规则引擎（3 人：玩家为地主或农民）

import { makeDeck, shuffle } from '../../core/cards.js';
import { parseCombo, beats } from './combos.js';

export const SEATS = 3;
export const seatName = (s) => ['你', '右家', '左家'][s] || `玩家${s + 1}`;

export class DouDizhuGame {
  constructor() { this.reset(); }

  reset() { this._deal(); }

  _deal() {
    const deck = shuffle(makeDeck({ jokers: true }));
    this.hands = [[], [], []];
    for (let i = 0; i < 51; i++) this.hands[i % 3].push(deck[i]);
    this.bottom = deck.slice(51);
    for (const h of this.hands) h.sort((a, b) => a.rank - b.rank || a.id - b.id);
    this.phase = 'bid';
    this.turn = 0;
    this.bidCount = 0;
    this.bestBid = 0;
    this.bestSeat = -1;
    this.landlord = -1;
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
      bottom: this.bottom.map((c) => ({ ...c })),
      phase: this.phase, turn: this.turn, bidCount: this.bidCount, bestBid: this.bestBid, bestSeat: this.bestSeat,
      landlord: this.landlord, lastPlay: this.lastPlay ? { combo: { ...this.lastPlay.combo }, cards: this.lastPlay.cards.map((c) => ({ ...c })), seat: this.lastPlay.seat } : null,
      ended: this.ended, result: this.result, lastMove: this.lastMove, moveCount: this.moves.length,
    };
  }
  restore(s) {
    this.hands = s.hands.map((h) => h.map((c) => ({ ...c })));
    this.bottom = s.bottom.map((c) => ({ ...c }));
    this.phase = s.phase; this.turn = s.turn; this.bidCount = s.bidCount; this.bestBid = s.bestBid; this.bestSeat = s.bestSeat;
    this.landlord = s.landlord;
    this.lastPlay = s.lastPlay ? { combo: { ...s.lastPlay.combo }, cards: s.lastPlay.cards.map((c) => ({ ...c })), seat: s.lastPlay.seat } : null;
    this.ended = s.ended; this.result = s.result; this.lastMove = s.lastMove; this.moves.length = s.moveCount;
  }

  isFarmer(s) { return this.landlord >= 0 && s !== this.landlord; }
  sameSide(a, b) { return (a === this.landlord) === (b === this.landlord); }

  _startPlay() {
    this.phase = 'play';
    this.landlord = this.bestSeat;
    this.hands[this.landlord].push(...this.bottom);
    this.hands[this.landlord].sort((a, b) => a.rank - b.rank || a.id - b.id);
    this.turn = this.landlord;
    this.lastPlay = null;
  }

  play(move) {
    if (this.ended) return { ok: false };
    if (this.phase === 'bid') {
      if (move.type !== 'bid') return { ok: false };
      this.history.push(this.snapshot());
      const v = move.value;
      this.bidCount++;
      if (v > this.bestBid) { this.bestBid = v; this.bestSeat = this.turn; }
      this.moves.push({ color: this.turn, bid: v });
      if (v === 3 || this.bidCount >= SEATS) {
        if (this.bestBid > 0) { this._startPlay(); }
        else { this._deal(); }
      } else {
        this.turn = (this.turn + 1) % SEATS;
      }
      return { ok: true };
    }
    // play phase
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
      if (this.lastPlay && this.lastPlay.seat !== seat) {
        if (!beats(combo, this.lastPlay.combo)) return { ok: false };
      }
      this.history.push(this.snapshot());
      const ids = new Set(cards.map((c) => c.id));
      this.hands[seat] = this.hands[seat].filter((c) => !ids.has(c.id));
      this.lastPlay = { combo, cards: cards.map((c) => ({ ...c })), seat };
      this.lastMove = { seat, cards: cards.map((c) => ({ ...c })) };
      this.moves.push({ color: seat, cards: cards.length });
      if (this.hands[seat].length === 0) {
        this.ended = true;
        const landlordWin = seat === this.landlord;
        this.result = { winner: landlordWin ? 'landlord' : 'farmers', seat, text: landlordWin ? '地主获胜' : '农民获胜' };
        return { ok: true };
      }
      this.turn = (seat + 1) % SEATS;
      return { ok: true };
    }
    return { ok: false };
  }

  undo() { if (!this.history.length) return false; this.restore(this.history.pop()); return true; }
  resign(seat) {
    if (this.ended) return { ok: false };
    const landlordWin = seat !== this.landlord;
    this.ended = true;
    this.result = { winner: landlordWin ? 'landlord' : 'farmers', text: landlordWin ? '地主获胜（农民认输）' : '农民获胜（地主认输）' };
    return { ok: true };
  }
}
