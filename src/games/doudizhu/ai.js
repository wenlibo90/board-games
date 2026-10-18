// 斗地主 AI：叫分评估 + 出牌（跟牌找最小压制 / 领出低牌）

import { SEATS } from './engine.js';
import { parseCombo, findBeat, leadPlay } from './combos.js';

function handStrength(hand) {
  let s = 0;
  const cnt = new Map();
  for (const c of hand) {
    cnt.set(c.rank, (cnt.get(c.rank) || 0) + 1);
    if (c.rank === 17) s += 5;
    else if (c.rank === 16) s += 4;
    else if (c.rank === 15) s += 2; // 2
  }
  for (const [, n] of cnt) if (n === 4) s += 6;
  return s;
}

function opponentClose(game, seat) {
  for (let s = 0; s < SEATS; s++) {
    if (s === seat) continue;
    if (!game.sameSide(s, seat) && game.hands[s].length <= 2) return true;
  }
  return false;
}

export function chooseMove(game, difficulty = 'medium') {
  if (game.phase === 'bid') {
    const st = handStrength(game.hands[game.turn]);
    let want = st >= 10 ? 3 : st >= 6 ? 2 : st >= 4 ? 1 : 0;
    if (want <= game.bestBid) want = 0;
    if (difficulty === 'easy') { if (Math.random() < 0.5) want = Math.min(3, game.bestBid + 1); }
    return { type: 'bid', value: want };
  }
  const seat = game.turn;
  const hand = game.hands[seat];
  const last = game.lastPlay;
  const isLead = !last || last.seat === seat;

  if (isLead) {
    const cards = leadPlay(hand);
    return { type: 'play', cards: cards.map((c) => c.id) };
  }
  // 队友出的牌不压
  if (game.sameSide(last.seat, seat)) return { type: 'pass' };

  const beat = findBeat(hand, last.combo);
  if (!beat) return { type: 'pass' };
  const combo = parseCombo(beat);
  if (combo.type === 'bomb' || combo.type === 'rocket') {
    if (!opponentClose(game, seat) && last.combo.size < 4) return { type: 'pass' };
  }
  return { type: 'play', cards: beat.map((c) => c.id) };
}

export function suggestMove(game, color) {
  const saved = game.turn;
  game.turn = color;
  const mv = chooseMove(game, 'hard');
  game.turn = saved;
  return mv;
}
