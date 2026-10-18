// 升级 AI：亮主选花色 + 单张墩牌出牌

import { SEATS, teamOf, isTrump, beats, POINTS } from './engine.js';

function valOf(c) { return c.joker ? 300 + c.rank : (c.rank === 2 ? 200 : c.suit === undefined ? c.rank : c.rank); }

export function chooseTrump(game, difficulty = 'medium') {
  const hand = game.hands[0];
  const cnt = { S: 0, H: 0, D: 0, C: 0 };
  for (const c of hand) if (cnt[c.suit] !== undefined) cnt[c.suit]++;
  let best = 'S', bv = -1;
  for (const k of ['S', 'H', 'D', 'C']) if (cnt[k] > bv) { bv = cnt[k]; best = k; }
  return best;
}

export function chooseMove(game, difficulty = 'medium') {
  if (game.phase === 'trump') return { type: 'trump', suit: chooseTrump(game, difficulty) };
  const seat = game.turn;
  const legal = game.trick.length ? game.legalFollower(seat) : game.hands[seat];
  if (legal.length === 0) return null;
  const trump = game.trumpSuit;

  if (game.trick.length === 0) {
    // 领出：优先非分牌的低牌
    const sorted = legal.slice().sort((a, b) => (isTrump(a, trump) ? 1000 : 0) + a.rank - ((isTrump(b, trump) ? 1000 : 0) + b.rank));
    const nonPoint = sorted.find((c) => !POINTS[c.rank]);
    return { type: 'play', card: (nonPoint || sorted[0]).id };
  }

  const led = game.trick[0].card;
  const ledSuit = isTrump(led, trump) ? null : led.suit;
  let win = game.trick[0];
  for (const t of game.trick) if (beats(t.card, win.card, trump, ledSuit)) win = t;

  if (teamOf(win.seat) === teamOf(seat)) {
    // 队友赢墩：给分
    const withPts = legal.filter((c) => POINTS[c.rank]);
    return { type: 'play', card: (withPts.length ? withPts.sort((a, b) => POINTS[b.rank] - POINTS[a.rank])[0] : legal[0]).id };
  }
  // 对手赢墩：尝试压过
  const beating = legal.filter((c) => beats(c, win.card, trump, ledSuit)).sort((a, b) => a.rank - b.rank);
  if (beating.length) return { type: 'play', card: beating[0].id };
  // 压不过：出最小非分牌
  const sorted = legal.slice().sort((a, b) => a.rank - b.rank);
  const nonPoint = sorted.find((c) => !POINTS[c.rank]);
  return { type: 'play', card: (nonPoint || sorted[0]).id };
}

export function suggestMove(game, color) {
  const saved = game.turn;
  game.turn = color;
  const mv = chooseMove(game, 'hard');
  game.turn = saved;
  return mv;
}
