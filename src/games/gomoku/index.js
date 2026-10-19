// 五子棋模块清单
import * as engine from './engine.js';
import * as ai from './ai.js';
import { createView, palettes } from './view.js';
import { lessons, tutorial } from './lessons.js';
import { BLACK, WHITE, colorName } from './engine.js';

const art = `
  <svg viewBox="0 0 96 96" width="72" height="72">
    <rect x="6" y="6" width="84" height="84" rx="12" fill="#e8c184" stroke="#b98a45" stroke-width="2"/>
    <g stroke="#8a6a38" stroke-width="1.2">
      <line x1="20" y1="20" x2="76" y2="20"/><line x1="20" y1="34" x2="76" y2="34"/>
      <line x1="20" y1="48" x2="76" y2="48"/><line x1="20" y1="62" x2="76" y2="62"/>
      <line x1="20" y1="76" x2="76" y2="76"/>
    </g>
    <g fill="#111"><circle cx="20" cy="48" r="7"/><circle cx="34" cy="48" r="7"/><circle cx="48" cy="48" r="7"/><circle cx="62" cy="48" r="7"/><circle cx="76" cy="48" r="7"/></g>
  </svg>`;

export default {
  id: 'gomoku',
  name: '五子棋',
  nameEn: 'Gomoku',
  tagline: '连成五子，攻守兼备',
  description: '自由规则五子棋，AI 具备基础进攻与防守判断，适合练习连子与堵截。',
  accent: '#d29034',
  skin: 'gomoku',
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
    { key: 'boardSize', label: '棋盘', type: 'options', default: 15, options: [
      { value: 13, label: '13 路' }, { value: 15, label: '15 路' }, { value: 19, label: '19 路' },
    ] },
    { key: 'humanColor', label: '执子', type: 'options', default: BLACK, options: [
      { value: BLACK, label: '执黑先行' }, { value: WHITE, label: '执白后行' },
    ] },
  ],
  supports: { undo: true, hint: true, resign: true, pass: false, estimate: false },
  helpers: [],

  createGame(config) {
    return new engine.GomokuGame(config.boardSize || 15);
  },

  stats(game) {
    let b = 0, w = 0;
    for (const v of game.board) { if (v === BLACK) b++; else if (v === WHITE) w++; }
    return [
      { label: '黑子', value: b },
      { label: '白子', value: w },
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
    return game.turn === BLACK ? '#111' : '#f5f5f5';
  },
};
