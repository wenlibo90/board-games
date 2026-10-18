// 六角跳棋模块清单

import * as engine from './engine.js';
import * as ai from './ai.js';
import { createView, palettes } from './view.js';
import { lessons, tutorial } from './lessons.js';
import { RED, BLUE, colorName, BOARD } from './engine.js';

const art = `
  <svg viewBox="0 0 96 96" width="72" height="72">
    <rect x="6" y="6" width="84" height="84" rx="12" fill="#f2ead8" stroke="#cbb98f" stroke-width="2"/>
    <polygon points="48,10 62,34 38,34" fill="rgba(226,72,61,0.25)"/>
    <polygon points="48,86 34,62 62,62" fill="rgba(79,127,240,0.25)"/>
    <g fill="#b9a680">
      <circle cx="48" cy="14" r="3"/><circle cx="43" cy="24" r="3"/><circle cx="53" cy="24" r="3"/>
      <circle cx="48" cy="44" r="3"/><circle cx="40" cy="44" r="3"/><circle cx="56" cy="44" r="3"/>
      <circle cx="48" cy="82" r="3"/><circle cx="43" cy="72" r="3"/><circle cx="53" cy="72" r="3"/>
    </g>
    <circle cx="48" cy="34" r="5" fill="#e2483d"/><circle cx="38" cy="34" r="5" fill="#e2483d"/>
    <circle cx="48" cy="62" r="5" fill="#4f7ff0"/><circle cx="58" cy="62" r="5" fill="#4f7ff0"/>
  </svg>`;

function inTarget(game, color) {
  const target = color === RED ? BOARD.bottom : BOARD.top;
  let n = 0;
  for (const i of target) if (game.cells[i] === color) n++;
  return n;
}

export default {
  id: 'chinesecheckers',
  name: '六角跳棋',
  nameEn: 'Chinese Checkers',
  tagline: '连跳腾挪，抢占对岸',
  description: '六角星棋盘双人跳棋，含相邻步与连续跳跃，把全部棋子送抵对岸三角区。',
  accent: '#e2483d',
  art,
  palettes,
  createView,
  lessons,
  tutorial,
  engine,
  ai: {
    move: (game, difficulty) => ai.chooseMove(game, difficulty),
    hint: (game, color) => ai.suggestMove(game, color),
  },
  setup: [
    { key: 'humanColor', label: '执子', type: 'options', default: RED, options: [
      { value: RED, label: '执红（上）先行' }, { value: BLUE, label: '执蓝（下）后行' },
    ] },
  ],
  supports: { undo: true, hint: true, resign: true, pass: false, estimate: false },
  helpers: [],

  createGame() { return new engine.CheckersGame(); },

  stats(game) {
    return [
      { label: '红方到位', value: inTarget(game, RED) },
      { label: '蓝方到位', value: inTarget(game, BLUE) },
      { label: '步数', value: game.moves.length },
    ];
  },

  statusLine(game, ctx) {
    if (game.ended) return game.result ? game.result.text : '对局结束';
    if (ctx.thinking) return 'AI 思考中…';
    return game.turn === ctx.humanColor
      ? `轮到你走棋（执${colorName(ctx.humanColor)}）`
      : `AI 回合（执${colorName(game.turn)}）`;
  },

  dotColor(game) { return game.turn === RED ? '#e2483d' : '#4f7ff0'; },
};
