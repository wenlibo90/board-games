// 六角跳棋 AI：贪心推进 + 优先跳跃

import { BOARD, N, RED, BLUE, opponent } from './engine.js';

function centroid(ids) {
  let x = 0, y = 0;
  for (const i of ids) { x += BOARD.coords[i].x; y += BOARD.coords[i].y; }
  return { x: x / ids.length, y: y / ids.length };
}
const CENTER = { [RED]: centroid(BOARD.bottom), [BLUE]: centroid(BOARD.top) };
const HOME = { [RED]: new Set(BOARD.bottom), [BLUE]: new Set(BOARD.top) };

function distTo(i, c) {
  const p = BOARD.coords[i];
  return Math.hypot(p.x - c.x, p.y - c.y);
}

export function chooseMove(game, difficulty = 'medium') {
  const color = game.turn;
  const moves = game.legalMoves(color);
  if (moves.length === 0) return null;
  const center = CENTER[color];
  const home = HOME[color];

  const scored = moves.map((m) => {
    let gain = distTo(m.from, center) - distTo(m.to, center);
    // 已经到位的子尽量不要再动
    if (home.has(m.from)) gain -= 60;
    if (!home.has(m.from) && home.has(m.to)) gain += 20;
    // 跳跃幅度越大越好
    gain += Math.max(0, distTo(m.from, m.to) - 1) * 0.6;
    if (difficulty === 'easy') gain += Math.random() * 10;
    return { m, gain };
  });
  scored.sort((a, b) => b.gain - a.gain);
  return scored[0].m;
}

export function suggestMove(game, color) {
  const saved = game.turn;
  game.turn = color;
  const mv = chooseMove(game, 'hard');
  game.turn = saved;
  return mv;
}
