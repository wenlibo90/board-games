// 韩国象棋模块清单

import * as engine from './engine.js';
import * as ai from './ai.js';
import { createView, palettes } from './view.js';
import { lessons, tutorial } from './lessons.js';
import { RED, BLUE, colorName, colorOf, inCheck } from './engine.js';

const art = `
  <svg viewBox="0 0 96 96" width="72" height="72">
    <rect x="6" y="6" width="84" height="84" rx="12" fill="#edd7a6" stroke="#c49a58" stroke-width="2"/>
    <g stroke="#a9782f" stroke-width="1.2">
      <line x1="18" y1="18" x2="78" y2="18"/><line x1="18" y1="39" x2="78" y2="39"/>
      <line x1="18" y1="60" x2="78" y2="60"/><line x1="18" y1="78" x2="78" y2="78"/>
      <line x1="18" y1="18" x2="18" y2="78"/><line x1="48" y1="18" x2="48" y2="78"/><line x1="78" y1="18" x2="78" y2="78"/>
    </g>
    <circle cx="48" cy="48" r="15" fill="#fbf2df" stroke="#1d4ed8" stroke-width="3"/>
    <text x="48" y="55" font-size="19" font-weight="700" text-anchor="middle" fill="#1d4ed8" font-family="KaiTi, serif">包</text>
  </svg>`;

export default {
  id: 'janggi',
  name: '韩国象棋',
  nameEn: 'Janggi',
  tagline: '隔子包炮，用字行象',
  description: '韩国象棋（Janggi）规则，含隔子炮、不能吃炮、用字象、士将斜行与飞将。',
  accent: '#1d4ed8',
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
      { value: RED, label: '执漢（红）先行' }, { value: BLUE, label: '执楚（蓝）后行' },
    ] },
  ],
  supports: { undo: true, hint: true, resign: true, pass: false, estimate: false },
  helpers: [],

  createGame() { return new engine.JanggiGame(); },

  stats(game) {
    let red = 0, blue = 0;
    for (const p of game.board) { if (!p) continue; if (colorOf(p) === RED) red++; else blue++; }
    return [
      { label: '漢方', value: red },
      { label: '楚方', value: blue },
      { label: '步数', value: game.moves.length },
    ];
  },

  statusLine(game, ctx) {
    if (game.ended) return game.result ? game.result.text : '对局结束';
    if (ctx.thinking) return 'AI 思考中…';
    const isHuman = game.turn === ctx.humanColor;
    const check = inCheck(game.board, game.turn) ? '（将军！）' : '';
    return isHuman ? `轮到你落子（执${colorName(ctx.humanColor)}）${check}` : `AI 回合（执${colorName(game.turn)}）${check}`;
  },

  dotColor(game) { return game.turn === RED ? '#c0392b' : '#1d4ed8'; },
};
