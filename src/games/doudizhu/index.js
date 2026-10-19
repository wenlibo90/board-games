// 斗地主模块清单

import * as engine from './engine.js';
import * as ai from './ai.js';
import { createView, palettes } from './view.js';
import { lessons, tutorial } from './lessons.js';
import { seatName } from './engine.js';

const art = `
  <svg viewBox="0 0 96 96" width="72" height="72">
    <rect x="20" y="14" width="30" height="48" rx="6" fill="#fbf7ec" stroke="#b9b0a0" stroke-width="2"/>
    <text x="35" y="42" font-size="17" text-anchor="middle" fill="#1b1b1b" font-family="serif">♠A</text>
    <rect x="46" y="14" width="30" height="48" rx="6" fill="#fbf7ec" stroke="#b9b0a0" stroke-width="2"/>
    <text x="61" y="42" font-size="17" text-anchor="middle" fill="#c0392b" font-family="serif">♥K</text>
    <rect x="33" y="30" width="30" height="48" rx="6" fill="#fbf7ec" stroke="#8a8271" stroke-width="2.4"/>
    <text x="48" y="60" font-size="17" text-anchor="middle" fill="#c0392b" font-family="serif">♦Q</text>
  </svg>`;

export default {
  id: 'doudizhu',
  name: '斗地主',
  nameEn: 'Dou Dizhu',
  tagline: '叫分夺地主，先出完获胜',
  description: '3 人斗地主：叫分抢地主、全套牌型（顺子/连对/飞机/炸弹/王炸）与队友配合。',
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
  setup: [],
  supports: { undo: true, hint: true, resign: true, pass: false, estimate: false },
  helpers: [],
  buttons: [
    { key: 'play', label: '出牌', tone: 'primary' },
    { key: 'pass', label: '不要' },
    { key: 'b1', label: '叫 1 分' },
    { key: 'b2', label: '叫 2 分' },
    { key: 'b3', label: '叫 3 分' },
    { key: 'b0', label: '不叫' },
  ],

  createGame() { return new engine.DouDizhuGame(); },

  onAction(game, key, view) {
    if (game.ended || game.turn !== 0) return;
    if (game.phase === 'bid') {
      if (key.length === 2 && key[0] === 'b') game.play({ type: 'bid', value: Number(key[1]) });
      return;
    }
    if (game.phase === 'play') {
      if (key === 'play') {
        const sel = view.getSelection(game.hands[0]);
        if (sel.length === 0) return;
        const r = game.play({ type: 'play', cards: sel.map((c) => c.id) });
        if (r.ok) view.clearSelection();
      } else if (key === 'pass') {
        game.play({ type: 'pass' });
        view.clearSelection();
      }
    }
  },

  buttonEnabled(game, key) {
    if (game.ended || game.turn !== 0) return false;
    if (game.phase === 'bid') return key.length === 2 && key[0] === 'b';
    if (game.phase === 'play') {
      if (key === 'play') return true;
      if (key === 'pass') return !!game.lastPlay && game.lastPlay.seat !== 0;
    }
    return false;
  },

  stats(game) {
    return [0, 1, 2].map((s) => ({
      label: `${seatName(s)}${game.landlord === s ? '(地主)' : ''}`,
      value: game.hands[s].length,
    }));
  },

  statusLine(game, ctx) {
    if (game.ended) return game.result ? game.result.text : '对局结束';
    if (ctx.thinking) return 'AI 思考中…';
    if (game.phase === 'bid') {
      const best = game.bestBid > 0 ? `（当前最高 ${game.bestBid} 分 · ${seatName(game.bestSeat)}）` : '（暂无人叫分）';
      return game.turn === 0 ? `轮到你叫分 ${best}` : `叫分中：${seatName(game.turn)} ${best}`;
    }
    if (game.turn === 0) {
      const lead = !game.lastPlay || game.lastPlay.seat === 0;
      return lead ? '轮到你领出牌' : `轮到你：压过 ${seatName(game.lastPlay.seat)} 的牌，或点「不要」`;
    }
    return `${seatName(game.turn)} 出牌中…`;
  },

  dotColor(game) { return game.turn === game.landlord ? '#c0392b' : '#1d6f4b'; },
};
