// 中国象棋模块清单

import * as engine from './engine.js';
import * as ai from './ai.js';
import { createView, palettes } from './view.js';
import { lessons, tutorial } from './lessons.js';
import { RED, BLACK, colorName, inCheck } from './engine.js';

const art = `
  <svg viewBox="0 0 96 96" width="72" height="72">
    <rect x="6" y="6" width="84" height="84" rx="12" fill="#e9cf9b" stroke="#c49a58" stroke-width="2"/>
    <line x1="6" y1="30" x2="90" y2="30" stroke="#a9782f" stroke-width="1.5"/>
    <line x1="6" y1="66" x2="90" y2="66" stroke="#a9782f" stroke-width="1.5"/>
    <line x1="30" y1="6" x2="30" y2="90" stroke="#a9782f" stroke-width="1.5"/>
    <line x1="66" y1="6" x2="66" y2="90" stroke="#a9782f" stroke-width="1.5"/>
    <circle cx="48" cy="48" r="17" fill="#fbf2df" stroke="#b3261e" stroke-width="3"/>
    <text x="48" y="55" font-size="20" font-weight="700" text-anchor="middle" fill="#b3261e" font-family="KaiTi, serif">车</text>
  </svg>`;

export default {
  id: 'xiangqi',
  name: '中国象棋',
  nameEn: 'Xiangqi',
  tagline: '楚河汉界，隔子将军',
  description: '车马炮兵同场对垒，规则完整，含蹩马腿、隔子炮、飞将等经典规则。',
  accent: '#b3261e',
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
      { value: RED, label: '执红先行' }, { value: BLACK, label: '执黑后行' },
    ] },
  ],
  supports: { undo: true, hint: true, resign: true, pass: false, estimate: false },
  helpers: [],

  createGame() {
    return new engine.XiangqiGame();
  },

  stats(game) {
    let redCap = 0;
    let blackCap = 0;
    for (const m of game.moves) {
      if (!m.captured) continue;
      if (m.color === RED) redCap++;
      else blackCap++;
    }
    return [
      { label: '红方吃子', value: redCap },
      { label: '黑方吃子', value: blackCap },
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

  dotColor(game) {
    return game.turn === RED ? '#c0392b' : '#1b1b1b';
  },
};
