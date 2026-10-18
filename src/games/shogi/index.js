// 将棋（日本象棋）模块清单

import * as engine from './engine.js';
import * as ai from './ai.js';
import { createView, palettes } from './view.js';
import { lessons, tutorial } from './lessons.js';
import { BLACK, WHITE, colorName, colorOf, inCheck, SIZE } from './engine.js';

const art = `
  <svg viewBox="0 0 96 96" width="72" height="72">
    <rect x="6" y="6" width="84" height="84" rx="12" fill="#f0dcae" stroke="#c49a58" stroke-width="2"/>
    <path d="M30 78 L30 34 L48 22 L66 34 L66 78 Z" fill="#fbf1da" stroke="#9c7a42" stroke-width="2"/>
    <text x="48" y="64" font-size="34" font-weight="700" text-anchor="middle" fill="#2a2118" font-family="Yu Mincho, Songti SC, serif">王</text>
  </svg>`;

function counts(game, color) {
  let onBoard = 0;
  for (let i = 0; i < SIZE; i++) if (game.board[i] && colorOf(game.board[i]) === color) onBoard++;
  const hand = game.hands[color];
  const inHand = Object.values(hand).reduce((a, b) => a + b, 0);
  return { onBoard, inHand };
}

export default {
  id: 'shogi',
  name: '日本将棋',
  nameEn: 'Shogi',
  tagline: '升变打入，日本将棋',
  description: '规则完整的日本将棋，含升变、持驹打入、二步与打步诘限制。',
  accent: '#7a5a2e',
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
    { key: 'humanColor', label: '执子', type: 'options', default: BLACK, options: [
      { value: BLACK, label: '执先手（先走）' }, { value: WHITE, label: '执后手（后走）' },
    ] },
  ],
  supports: { undo: true, hint: true, resign: true, pass: false, estimate: false },
  helpers: [],

  createGame() {
    return new engine.ShogiGame();
  },

  stats(game) {
    const s = counts(game, BLACK);
    const g = counts(game, WHITE);
    return [
      { label: '先手(持驹)', value: `${s.onBoard}(${s.inHand})` },
      { label: '后手(持驹)', value: `${g.onBoard}(${g.inHand})` },
      { label: '步数', value: game.moves.length },
    ];
  },

  statusLine(game, ctx) {
    if (game.ended) return game.result ? game.result.text : '对局结束';
    if (ctx.thinking) return 'AI 思考中…';
    const isHuman = game.turn === ctx.humanColor;
    const check = inCheck(game.board, game.turn) ? '（王手！）' : '';
    return isHuman
      ? `轮到你落子（执${colorName(ctx.humanColor)}）${check}`
      : `AI 回合（执${colorName(game.turn)}）${check}`;
  },

  dotColor(game) {
    return game.turn === BLACK ? '#2a2118' : '#f5f5f5';
  },
};
