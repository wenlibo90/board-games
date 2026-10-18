// 黑白棋（奥赛罗）模块清单

import * as engine from './engine.js';
import * as ai from './ai.js';
import { createView, palettes } from './view.js';
import { lessons, tutorial } from './lessons.js';
import { BLACK, WHITE, colorName, countDiscs } from './engine.js';

const art = `
  <svg viewBox="0 0 96 96" width="72" height="72">
    <rect x="6" y="6" width="84" height="84" rx="12" fill="#3f8459" stroke="#2a5c3c" stroke-width="2"/>
    <g stroke="#264f34" stroke-width="1.2">
      <line x1="6" y1="34" x2="90" y2="34"/><line x1="6" y1="62" x2="90" y2="62"/>
      <line x1="34" y1="6" x2="34" y2="90"/><line x1="62" y1="6" x2="62" y2="90"/>
    </g>
    <circle cx="34" cy="34" r="11" fill="#f7f3e9" stroke="#cbbfa5"/>
    <circle cx="62" cy="34" r="11" fill="#111"/>
    <circle cx="34" cy="62" r="11" fill="#111"/>
    <circle cx="62" cy="62" r="11" fill="#f7f3e9" stroke="#cbbfa5"/>
  </svg>`;

export default {
  id: 'reversi',
  name: '黑白棋',
  nameEn: 'Reversi',
  tagline: '夹子翻转，占角为王',
  description: '奥赛罗规则，含夹子翻转、行动力与占角策略，落子强制合法。',
  accent: '#2f7d4f',
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
      { value: BLACK, label: '执黑先行' }, { value: WHITE, label: '执白后行' },
    ] },
  ],
  supports: { undo: true, hint: true, resign: true, pass: false, estimate: false },
  helpers: [],

  createGame() {
    return new engine.ReversiGame();
  },

  stats(game) {
    const { black, white } = countDiscs(game.board);
    return [
      { label: '黑子', value: black },
      { label: '白子', value: white },
      { label: '步数', value: game.moves.length },
    ];
  },

  statusLine(game, ctx) {
    if (game.ended) return game.result ? game.result.text : '对局结束';
    if (ctx.thinking) return 'AI 思考中…';
    const isHuman = game.turn === ctx.humanColor;
    const who = colorName(game.turn);
    const skip = game.passed ? '（对方无子可落，跳过）' : '';
    return isHuman ? `轮到你落子（执${colorName(ctx.humanColor)}）${skip}` : `AI 回合（执${who}）`;
  },

  dotColor(game) {
    return game.turn === BLACK ? '#111' : '#f5f5f5';
  },
};
