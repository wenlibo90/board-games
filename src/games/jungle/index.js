// 斗兽棋模块清单

import * as engine from './engine.js';
import * as ai from './ai.js';
import { createView, palettes } from './view.js';
import { lessons, tutorial } from './lessons.js';
import { RED, BLUE, colorName, colorOf, SIZE } from './engine.js';

const art = `
  <svg viewBox="0 0 96 96" width="72" height="72">
    <rect x="6" y="6" width="84" height="84" rx="12" fill="#e6d3a3" stroke="#c49a58" stroke-width="2"/>
    <rect x="14" y="40" width="68" height="24" fill="#8fc4e0"/>
    <circle cx="30" cy="22" r="11" fill="#fbf1da" stroke="#b3261e" stroke-width="3"/>
    <text x="30" y="27" font-size="14" font-weight="700" text-anchor="middle" fill="#b3261e" font-family="KaiTi, serif">狮</text>
    <circle cx="66" cy="22" r="11" fill="#fbf1da" stroke="#1d4ed8" stroke-width="3"/>
    <text x="66" y="27" font-size="14" font-weight="700" text-anchor="middle" fill="#1d4ed8" font-family="KaiTi, serif">象</text>
  </svg>`;

function count(board, color) {
  let n = 0;
  for (let i = 0; i < SIZE; i++) if (board[i] && colorOf(board[i]) === color) n++;
  return n;
}

export default {
  id: 'jungle',
  name: '斗兽棋',
  nameEn: 'Jungle',
  tagline: '兽穴之争，鼠象相克',
  description: '丛林斗兽棋，含等级吃子、鼠象相克、下水规则、虎狮跳河与兽穴取胜。',
  accent: '#c98a3a',
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
      { value: RED, label: '执红先行' }, { value: BLUE, label: '执蓝后行' },
    ] },
  ],
  supports: { undo: true, hint: true, resign: true, pass: false, estimate: false },
  helpers: [],

  createGame() {
    return new engine.JungleGame();
  },

  stats(game) {
    return [
      { label: '红方', value: count(game.board, RED) },
      { label: '蓝方', value: count(game.board, BLUE) },
      { label: '步数', value: game.moves.length },
    ];
  },

  statusLine(game, ctx) {
    if (game.ended) return game.result ? game.result.text : '对局结束';
    if (ctx.thinking) return 'AI 思考中…';
    return game.turn === ctx.humanColor
      ? `轮到你落子（执${colorName(ctx.humanColor)}）`
      : `AI 回合（执${colorName(game.turn)}）`;
  },

  dotColor(game) {
    return game.turn === RED ? '#c0392b' : '#1d4ed8';
  },
};
