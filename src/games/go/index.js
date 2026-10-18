// 围棋模块清单（多棋种平台契约实现）

import * as engine from './engine.js';
import * as ai from './ai.js';
import { createView, palettes } from './view.js';
import { lessons, tutorial } from './lessons.js';
import { BLACK, WHITE, colorName, computeScore } from './engine.js';

const art = `
  <svg viewBox="0 0 96 96" width="72" height="72">
    <rect x="6" y="6" width="84" height="84" rx="12" fill="#e8c184" stroke="#b98a45" stroke-width="2"/>
    <g stroke="#8a6a38" stroke-width="1.4">
      <line x1="22" y1="22" x2="74" y2="22"/><line x1="22" y1="37" x2="74" y2="37"/>
      <line x1="22" y1="52" x2="74" y2="52"/><line x1="22" y1="67" x2="74" y2="67"/>
      <line x1="22" y1="22" x2="22" y2="67"/><line x1="37" y1="22" x2="37" y2="67"/>
      <line x1="52" y1="22" x2="52" y2="67"/><line x1="67" y1="22" x2="67" y2="67"/>
      <line x1="74" y1="22" x2="74" y2="67"/>
    </g>
    <circle cx="40" cy="44" r="11" fill="#111"/>
    <circle cx="58" cy="56" r="11" fill="#f7f3e9" stroke="#cbbfa5"/>
  </svg>`;

export default {
  id: 'go',
  name: '围棋',
  nameEn: 'Go',
  tagline: '落子围地，吃子争先',
  description: '在交叉点落子，围出更多地盘。内置提子、打劫、数子等完整规则。',
  accent: '#0f766e',
  art,
  palettes,
  createView,
  lessons,
  tutorial,
  engine,
  ai: {
    move: (game, difficulty) => {
      const r = ai.chooseMove(game, difficulty);
      return r.pass || r.idx < 0 ? 'pass' : r.idx;
    },
    hint: (game, color) => ai.suggestMove(game, color),
  },
  setup: [
    { key: 'boardSize', label: '棋盘', type: 'options', default: 9, options: [
      { value: 9, label: '9 路' }, { value: 13, label: '13 路' }, { value: 19, label: '19 路' },
    ] },
    { key: 'humanColor', label: '执子', type: 'options', default: BLACK, options: [
      { value: BLACK, label: '执黑先行' }, { value: WHITE, label: '执白后行' },
    ] },
  ],
  supports: { undo: true, hint: true, resign: true, pass: true, estimate: true },
  helpers: [
    { key: 'showLiberties', label: '显示气（鼠标悬停棋子）', default: true, apply: (view, v) => view.setShowLiberties(v) },
    { key: 'showLegal', label: '显示可落子点', default: false, apply: (view, v) => view.setShowLegal(v) },
  ],

  createGame(config) {
    const size = config.boardSize || 9;
    const komi = size === 9 ? 6.5 : 7.5;
    return new engine.GoGame(size, komi);
  },

  stats(game) {
    return [
      { label: '黑方提子', value: game.captures[BLACK] },
      { label: '白方提子', value: game.captures[WHITE] },
      { label: '总手数', value: game.moves.length },
    ];
  },

  statusLine(game, ctx) {
    if (game.ended) return game.result ? game.result.text : '对局结束';
    if (ctx.thinking) return 'AI 思考中…';
    const isHuman = game.turn === ctx.humanColor;
    return isHuman ? `轮到你落子（执${colorName(ctx.humanColor)}）` : `AI 回合（执${colorName(game.turn)}）`;
  },

  dotColor(game) {
    return game.turn === BLACK ? '#111' : '#f5f5f5';
  },

  estimate(game) {
    const s = computeScore(game.board, game.size, game.komi);
    const lead = s.diff > 0 ? `黑领先 ${s.diff.toFixed(1)}` : s.diff < 0 ? `白领先 ${(-s.diff).toFixed(1)}` : '双方接近';
    return {
      text: `形势判断：黑 ${s.black} : 白 ${s.white}（${lead}）`,
      overlay: { territory: { black: s.blackTerritory, white: s.whiteTerritory } },
    };
  },

  endOverlay(game) {
    if (!game.result || !game.result.score) return null;
    const s = game.result.score;
    return { territory: { black: s.blackTerritory, white: s.whiteTerritory } };
  },
};
