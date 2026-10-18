// UNO AI：启发式（优先同色、用功能牌干扰、谨慎用万能牌）

import { COLORS } from './engine.js';

function bestColor(game, seat) {
  const cnt = { R: 0, Y: 0, G: 0, B: 0 };
  for (const c of game.hands[seat]) if (cnt[c.color] !== undefined) cnt[c.color]++;
  let best = 'R', bv = -1;
  for (const k of COLORS) if (cnt[k] > bv) { bv = cnt[k]; best = k; }
  return best;
}

export function chooseMove(game, difficulty = 'medium') {
  const seat = game.turn;
  const plays = game.legalPlays(seat);
  if (plays.length === 0) {
    if (game.phase === 'afterDraw') return { type: 'pass' };
    return { type: 'draw' };
  }
  const scored = plays.map((c) => {
    let sc = 0;
    if (c.color === 'W') sc -= 35;
    else sc += 10;
    if (c.value === 'skip' || c.value === 'draw2') sc += 9;
    if (c.value === 'rev') sc += 4;
    const sameColor = game.hands[seat].filter((x) => x.color === c.color).length;
    sc += sameColor * 0.6;
    if (difficulty === 'easy') sc += Math.random() * 40;
    return { c, sc };
  });
  scored.sort((a, b) => b.sc - a.sc);
  const pick = scored[0].c;
  const move = { type: 'play', id: pick.id };
  if (pick.color === 'W') move.color = bestColor(game, seat);
  return move;
}

export function suggestMove(game, color) {
  const saved = game.turn;
  game.turn = color;
  const mv = chooseMove(game, 'hard');
  game.turn = saved;
  return mv;
}
