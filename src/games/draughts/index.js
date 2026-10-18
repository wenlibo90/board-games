// 国际跳棋模块清单

import * as engine from './engine.js';
import * as ai from './ai.js';
import { createView, palettes } from './view.js';
import { lessons, tutorial } from './lessons.js';
import { WHITE, BLACK, MAN, KING, colorName, colorOf, typeOf } from './engine.js';

const art = `
  <svg viewBox="0 0 96 96" width="72" height="72">
    <rect x="6" y="6" width="84" height="84" rx="12" fill="#8a6a3f" stroke="#4a3418" stroke-width="2"/>
    <g fill="#e8d3a6">
      <rect x="6" y="6" width="21" height="21"/><rect x="48" y="6" width="21" height="21"/>
      <rect x="27" y="27" width="21" height="21"/><rect x="69" y="27" width="21" height="21"/>
      <rect x="6" y="48" width="21" height="21"/><rect x="48" y="48" width="21" height="21"/>
      <rect x="27" y="69" width="21" height="21"/><rect x="69" y="69" width="21" height="21"/>
    </g>
    <circle cx="37" cy="48" r="11" fill="#111"/>
    <circle cx="58" cy="27" r="11" fill="#111"/>
    <circle cx="37" cy="69" r="11" fill="#f7f3e9"/>
    <circle cx="58" cy="48" r="11" fill="#f7f3e9"/>
  </svg>`;

function count(board, color) {
  let men = 0, kings = 0;
  for (const p of board) {
    if (!p || colorOf(p) !== color) continue;
    if (typeOf(p) === KING) kings++;
    else men++;
  }
  return { men, kings, total: men + kings };
}

export default {
  id: 'draughts',
  name: '国际跳棋',
  nameEn: 'Draughts',
  tagline: '强制吃子，连吃升王',
  description: '10x10 国际跳棋（波兰跳棋）规则，含强制吃子、多子连吃与飞王。',
  accent: '#8a6a3f',
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
    { key: 'humanColor', label: '执子', type: 'options', default: WHITE, options: [
      { value: WHITE, label: '执白先行' }, { value: BLACK, label: '执黑后行' },
    ] },
  ],
  supports: { undo: true, hint: true, resign: true, pass: false, estimate: false },
  helpers: [],

  createGame() {
    return new engine.DraughtsGame();
  },

  stats(game) {
    const w = count(game.board, WHITE);
    const b = count(game.board, BLACK);
    return [
      { label: `白方(王 ${w.kings})`, value: w.total },
      { label: `黑方(王 ${b.kings})`, value: b.total },
      { label: '步数', value: game.moves.length },
    ];
  },

  statusLine(game, ctx) {
    if (game.ended) return game.result ? game.result.text : '对局结束';
    if (ctx.thinking) return 'AI 思考中…';
    const isHuman = game.turn === ctx.humanColor;
    const forced = game.legalMoves(game.turn).some((m) => m.captures.length > 0) ? '（有子可吃，必须吃）' : '';
    return isHuman
      ? `轮到你落子（执${colorName(ctx.humanColor)}）${forced}`
      : `AI 回合（执${colorName(game.turn)}）`;
  },

  dotColor(game) {
    return game.turn === WHITE ? '#f5f5f5' : '#1b1b1b';
  },
};
