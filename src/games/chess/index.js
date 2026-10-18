// 国际象棋模块清单

import * as engine from './engine.js';
import * as ai from './ai.js';
import { createView, palettes } from './view.js';
import { lessons, tutorial } from './lessons.js';
import { WHITE, BLACK, K, Q, R, B, N, P, colorName, inCheck } from './engine.js';

const art = `
  <svg viewBox="0 0 96 96" width="72" height="72">
    <rect x="6" y="6" width="84" height="84" rx="12" fill="#eddfc5" stroke="#b58863" stroke-width="2"/>
    <g>
      <rect x="6" y="6" width="21" height="21" fill="#b58863"/>
      <rect x="27" y="6" width="21" height="21" fill="#eddfc5"/>
      <rect x="48" y="6" width="21" height="21" fill="#b58863"/>
      <rect x="69" y="6" width="21" height="21" fill="#eddfc5"/>
      <rect x="6" y="27" width="21" height="21" fill="#eddfc5"/>
      <rect x="27" y="27" width="21" height="21" fill="#b58863"/>
      <rect x="48" y="27" width="21" height="21" fill="#eddfc5"/>
      <rect x="69" y="27" width="21" height="21" fill="#b58863"/>
    </g>
    <text x="48" y="62" font-size="46" text-anchor="middle" fill="#1b1b1b" font-family="serif">♞</text>
  </svg>`;

export default {
  id: 'chess',
  name: '国际象棋',
  chessName: 'Chess',
  nameEn: 'Chess',
  tagline: '王后车象马兵，将杀定胜负',
  description: '规则完整的国际象棋，含王车易位、吃过路兵、兵升变与将杀判定。',
  accent: '#334155',
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
    return new engine.ChessGame();
  },

  stats(game) {
    let whiteTake = 0;
    let blackTake = 0;
    for (const m of game.moves) {
      if (!m.captured) continue;
      if (m.color === WHITE) whiteTake++;
      else blackTake++;
    }
    return [
      { label: '白方吃子', value: whiteTake },
      { label: '黑方吃子', value: blackTake },
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
    return game.turn === WHITE ? '#f5f5f5' : '#1b1b1b';
  },
};
