// 掼蛋（简化版）模块清单

import * as engine from './engine.js';
import * as ai from './ai.js';
import { createView, palettes } from './view.js';
import { lessons, tutorial } from './lessons.js';
import { seatName, teamName, teamOf } from './engine.js';

const art = `
  <svg viewBox="0 0 96 96" width="72" height="72">
    <rect x="10" y="12" width="30" height="46" rx="6" fill="#fbf7ec" stroke="#b9b0a0" stroke-width="2"/>
    <text x="25" y="42" font-size="16" text-anchor="middle" fill="#1b1b1b" font-family="serif">♣10</text>
    <rect x="36" y="16" width="30" height="46" rx="6" fill="#fbf7ec" stroke="#b9b0a0" stroke-width="2"/>
    <text x="51" y="46" font-size="16" text-anchor="middle" fill="#c0392b" font-family="serif">♦K</text>
    <rect x="24" y="34" width="30" height="46" rx="6" fill="#fbf7ec" stroke="#b9b0a0" stroke-width="2"/>
    <text x="39" y="64" font-size="16" text-anchor="middle" fill="#1b1b1b" font-family="serif">♠5</text>
  </svg>`;

export default {
  id: 'guandan',
  name: '掼蛋',
  nameEn: 'Guandan',
  tagline: '双副组队，配合出牌',
  description: '四人两队掼蛋（简化版）：两副牌比牌、队友配合、炸弹与天王炸。',
  accent: '#8a5a2b',
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
  setup: [],
  supports: { undo: true, hint: true, resign: true, pass: false, estimate: false },
  helpers: [],
  buttons: [
    { key: 'play', label: '出牌', tone: 'primary' },
    { key: 'pass', label: '不要' },
  ],

  createGame() { return new engine.GuandanGame(); },

  onAction(game, key, view) {
    if (game.ended || game.turn !== 0) return;
    if (key === 'play') {
      const sel = view.getSelection(game.hands[0]);
      if (sel.length === 0) return;
      const r = game.play({ type: 'play', cards: sel.map((c) => c.id) });
      if (r.ok) view.clearSelection();
    } else if (key === 'pass') {
      game.play({ type: 'pass' });
      view.clearSelection();
    }
  },

  buttonEnabled(game, key) {
    if (game.ended || game.turn !== 0) return false;
    if (key === 'play') return true;
    if (key === 'pass') return !!game.lastPlay && game.lastPlay.seat !== 0;
    return false;
  },

  stats(game) {
    return [0, 1, 2, 3].map((s) => ({
      label: `${seatName(s)}${s === 0 || s === 2 ? '(我队)' : ''}`,
      value: game.hands[s].length,
    }));
  },

  statusLine(game, ctx) {
    if (game.ended) return game.result ? game.result.text : '对局结束';
    if (ctx.thinking) return 'AI 思考中…';
    if (game.turn === 0) {
      const lead = !game.lastPlay || game.lastPlay.seat === 0;
      return lead ? '轮到你领出牌' : `轮到你：压过 ${seatName(game.lastPlay.seat)}，或点「不要」`;
    }
    return `${seatName(game.turn)} 出牌中…（${teamOf(game.turn) === 0 ? '我方' : '对方'}）`;
  },

  dotColor(game) { return teamOf(game.turn) === 0 ? '#1d6f4b' : '#b3261e'; },
};
