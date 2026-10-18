// 掼蛋 AI：复用斗地主牌型判断的领出/跟牌策略（队友不压）

import { parseCombo, findBeat, leadPlay } from '../doudizhu/combos.js';

export function chooseMove(game, difficulty = 'medium') {
  const seat = game.turn;
  const hand = game.hands[seat];
  const last = game.lastPlay;
  const lead = !last || last.seat === seat;
  if (lead) {
    const cards = leadPlay(hand);
    return { type: 'play', cards: cards.map((c) => c.id) };
  }
  if (game.sameSide(last.seat, seat)) return { type: 'pass' };
  const beat = findBeat(hand, last.combo);
  if (!beat) return { type: 'pass' };
  const combo = parseCombo(beat);
  if ((combo.type === 'bomb' || combo.type === 'rocket') && last.combo.size < 4 && difficulty !== 'easy') {
    const oppClose = [0, 1, 2, 3].some((s) => s !== seat && !game.sameSide(s, seat) && game.hands[s].length <= 2);
    if (!oppClose) return { type: 'pass' };
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
